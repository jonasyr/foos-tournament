require 'date'
require_relative 'dm/data_model'

module Stats
  START_ELO = 1000
  K_FACTOR  = 24

  # -------- helpers
  def self.team_of_match(m, side)
    # Match has pl1, pl2, pl3, pl4
    # score1a is pl1+pl2 (yellow), score1b is pl3+pl4 (black)
    # score2a is pl1+pl3 (yellow), score2b is pl2+pl4 (black)
    # score3a is pl1+pl4 (yellow), score3b is pl2+pl3 (black)
    # For simplicity, assume first two players are yellow, last two are black
    if side == :yellow
      [m.pl1, m.pl2].compact.map { |pid| DataModel::Player.get(pid) }.compact
    else
      [m.pl3, m.pl4].compact.map { |pid| DataModel::Player.get(pid) }.compact
    end
  end

  def self.final_score(m)
    # Calculate final score from the three sub-matches
    # score1a (pl1+pl2) vs score1b (pl3+pl4)
    # score2a (pl1+pl3) vs score2b (pl2+pl4)
    # score3a (pl1+pl4) vs score3b (pl2+pl3)
    yellow_wins = 0
    black_wins = 0
    
    yellow_wins += 1 if m.score1a && m.score1b && m.score1a > m.score1b
    black_wins += 1  if m.score1a && m.score1b && m.score1b > m.score1a
    
    yellow_wins += 1 if m.score2a && m.score2b && m.score2a > m.score2b
    black_wins += 1  if m.score2a && m.score2b && m.score2b > m.score2a
    
    yellow_wins += 1 if m.score3a && m.score3b && m.score3a > m.score3b
    black_wins += 1  if m.score3a && m.score3b && m.score3b > m.score3a
    
    [yellow_wins, black_wins]
  end

  def self.team_elo(elo_table, players)
    return START_ELO if players.empty?
    (players.map { |p| elo_table[p.id] || START_ELO }.sum / players.size.to_f)
  end

  def self.update_elo_for_match!(elo_table, m)
    y_players = team_of_match(m, :yellow)
    b_players = team_of_match(m, :black)
    y_score, b_score = final_score(m)

    return elo_table if y_players.nil? || b_players.nil?

    ry = team_elo(elo_table, y_players)
    rb = team_elo(elo_table, b_players)

    sa = y_score > b_score ? 1.0 : (y_score == b_score ? 0.5 : 0.0)
    ea = 1.0 / (1.0 + 10.0**((rb - ry) / 400.0))
    delta = K_FACTOR * (sa - ea)

    (y_players + b_players).each { |p| elo_table[p.id] ||= START_ELO }
    y_players.each { |p| elo_table[p.id] += delta }
    b_players.each { |p| elo_table[p.id] -= delta }
    elo_table
  end

  def self.leaderboard(season_id: nil, limit: 50)
    # recompute ELO chronologically for determinism
    conditions = season_id ? { :division => { :season_id => season_id } } : {}
    matches = DataModel::Match.all(conditions.merge(:status => 2, :order => [ :time.asc, :id.asc ]))
    elo = {}
    played = Hash.new(0)
    wins   = Hash.new(0)

    matches.each do |m|
      y_score, b_score = final_score(m)
      y_players = team_of_match(m, :yellow)
      b_players = team_of_match(m, :black)
      (y_players + b_players).each { |p| played[p.id] += 1 }
      if y_score != b_score
        (y_score > b_score ? y_players : b_players).each { |p| wins[p.id] += 1 }
      end
      update_elo_for_match!(elo, m)
    end

    players = DataModel::Player.all.map do |p|
      games = played[p.id]
      wr = games > 0 ? (wins[p.id].to_f / games) : 0.0
      { player_id: p.id, name: p.name, games: games, wins: wins[p.id],
        win_rate: wr, elo: (elo[p.id] || START_ELO).round }
    end
    players.sort_by { |r| -r[:elo] }.first(limit)
  end

  def self.player_detail(player_id:, window_days: [7, 30, 90])
    p = DataModel::Player.get(player_id)
    return {} unless p

    ms = matches_of_player(p)
    totals = reduce_totals(ms, p)
    windows = {}
    now = DateTime.now
    window_days.each do |d|
      msw = ms.all(:time.gte => now - d)
      windows[d] = reduce_totals(msw, p)
    end

    { player_id: p.id, name: p.name }.merge(totals).merge({ windows: windows })
  end

  def self.matches_of_player(p)
    # Find all matches where player participated
    DataModel::Match.all(:status => 2, :conditions => [
      'pl1 = ? OR pl2 = ? OR pl3 = ? OR pl4 = ?',
      p.id, p.id, p.id, p.id
    ])
  end

  def self.reduce_totals(matches, p)
    games = matches.count
    wins = 0
    goals_for = 0
    goals_against = 0
    streak = 0
    best_streak = 0
    worst_streak = 0
    last_res = 0

    matches.each do |m|
      y, b = final_score(m)
      on_yellow = [m.pl1, m.pl2].compact.include?(p.id)
      my = on_yellow ? y : b
      op = on_yellow ? b : y
      goals_for     += my
      goals_against += op
      if my > op
        wins += 1
        last_res = +1
        streak = last_res == +1 ? streak + 1 : 1
        best_streak = [best_streak, streak].max
      elsif my < op
        last_res = -1
        streak = last_res == -1 ? streak - 1 : -1
        worst_streak = [worst_streak, -streak].max
      end
    end

    {
      games: games, wins: wins, losses: games - wins,
      win_rate: (games > 0 ? wins.to_f / games : 0.0),
      goals_for: goals_for, goals_against: goals_against,
      goal_diff: goals_for - goals_against,
      avg_for: (games > 0 ? goals_for.to_f / games : 0.0),
      avg_against: (games > 0 ? goals_against.to_f / games : 0.0),
      current_streak: streak, longest_win_streak: best_streak, longest_lose_streak: worst_streak
    }
  end

  # ---- H2H / Partnerships (basic)
  def self.h2h(a_id:, b_id:)
    ms = DataModel::Match.all(:status => 2, :conditions => [
      '(pl1 = ? OR pl2 = ? OR pl3 = ? OR pl4 = ?) AND ' \
      '(pl1 = ? OR pl2 = ? OR pl3 = ? OR pl4 = ?)',
      a_id, a_id, a_id, a_id, b_id, b_id, b_id, b_id
    ])
    wins_a = 0
    wins_b = 0
    diff = 0
    ms.each do |m|
      y, b = final_score(m)
      a_on_y = [m.pl1, m.pl2].include?(a_id)
      my = a_on_y ? y : b
      op = a_on_y ? b : y
      wins_a += 1 if my > op
      wins_b += 1 if op > my
      diff += (my - op)
    end
    { a_id: a_id, b_id: b_id, games: ms.count, wins_a: wins_a, wins_b: wins_b, goal_diff_a: diff }
  end

  # ---- Partnerships
  def self.partnerships(player_id:, limit: 10)
    p = DataModel::Player.get(player_id)
    return [] unless p

    partners = Hash.new { |h, k| h[k] = { games: 0, wins: 0 } }
    
    DataModel::Match.all(:status => 2, :conditions => [
      'pl1 = ? OR pl2 = ? OR pl3 = ? OR pl4 = ?',
      p.id, p.id, p.id, p.id
    ]).each do |m|
      y_score, b_score = final_score(m)
      
      if [m.pl1, m.pl2].include?(p.id)
        # Player on yellow team
        partner_id = [m.pl1, m.pl2].find { |pid| pid != p.id }
        if partner_id
          partners[partner_id][:games] += 1
          partners[partner_id][:wins] += 1 if y_score > b_score
        end
      else
        # Player on black team
        partner_id = [m.pl3, m.pl4].find { |pid| pid != p.id }
        if partner_id
          partners[partner_id][:games] += 1
          partners[partner_id][:wins] += 1 if b_score > y_score
        end
      end
    end

    partners.map do |partner_id, stats|
      partner = DataModel::Player.get(partner_id)
      next unless partner
      
      wr = stats[:games] > 0 ? (stats[:wins].to_f / stats[:games]) : 0.0
      {
        partner_id: partner_id,
        partner_name: partner.name,
        games: stats[:games],
        wins: stats[:wins],
        win_rate: wr
      }
    end.compact.sort_by { |r| -r[:win_rate] }.first(limit)
  end

  # ---- Goal timeline driven metrics (clutch/comeback/close)
  def self.timeline_metrics(match_id)
    ev = DataModel::GoalEvent.all(:match_id => match_id, :order => [:id.asc])
    return {} if ev.empty?
    
    close_threshold = 1 # one-goal games
    final = ev.last
    total_goals = ev.count
    close_game = (final.score_yellow - final.score_black).abs <= close_threshold

    # Comeback detection: did the winner ever trail?
    winner = final.score_yellow > final.score_black ? :yellow : :black
    trailed = ev.any? do |e|
      if winner == :yellow
        e.score_yellow < e.score_black
      else
        e.score_black < e.score_yellow
      end
    end

    # clutch: was the score close before the final goal?
    clutch = false
    if total_goals >= 2
      before_last = ev[-2]
      clutch = (before_last.score_yellow - before_last.score_black).abs <= 1
    end

    {
      total_goals: total_goals,
      close_game: close_game,
      comeback: trailed,
      clutch_finish: clutch
    }
  end
end
