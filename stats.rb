require 'date'
require_relative 'dm/data_model'

# Collection of analytics utilities for foosball matches and players.
#
# The module re-computes ELO leaderboards, aggregates player statistics across
# configurable scopes (league vs. quick matches), and exposes helper queries for
# head-to-head records, partnerships, and goal-timeline derived metrics. All
# functions are written in a functional style so they can be used from the web
# app as well as CLI tooling.
module Stats
  START_ELO = 1000
  K_FACTOR  = 24
  MATCH_SCOPES = {
    all: nil,
    league: false,
    quick: true
  }.freeze

  # -------- helpers
  # Retrieves the DataMapper player records representing one side of a match.
  #
  # @param m [DataModel::Match] DataMapper match record
  # @param side [Symbol] :yellow or :black side identifier
  # @return [Array<DataModel::Player>] list of participating players
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

  # Calculates the overall score for yellow vs. black teams.
  #
  # Works for both league matches (best-of-three submatches) and quick matches
  # (single game). Missing submatches are ignored to stay backwards compatible
  # with partial data imported from legacy clients.
  #
  # @param m [DataModel::Match]
  # @return [Array<Integer>] `[yellow_wins, black_wins]`
  def self.final_score(m)
    # Calculate final score: Count wins from available submatches
    # Works for both Best-of-3 (3 submatches) and Quick Match (1 submatch)
    scores = []
    scores << [m.score1a, m.score1b] if m.score1a && m.score1b
    scores << [m.score2a, m.score2b] if m.score2a && m.score2b
    scores << [m.score3a, m.score3b] if m.score3a && m.score3b
    
    yellow_wins = 0
    black_wins = 0
    
    scores.each do |y_score, b_score|
      if y_score > b_score
        yellow_wins += 1
      elsif b_score > y_score
        black_wins += 1
      end
    end
    
    [yellow_wins, black_wins]
  end

  # Computes the average ELO rating for a list of players.
  #
  # @param elo_table [Hash{Integer=>Numeric}] current ELO ratings keyed by id
  # @param players [Array<DataModel::Player>] players forming a team
  # @return [Numeric] average ELO value or {START_ELO} if no data available
  def self.team_elo(elo_table, players)
    return START_ELO if players.empty?
    (players.map { |p| elo_table[p.id] || START_ELO }.sum / players.size.to_f)
  end

  # Updates the in-memory ELO table with the outcome of a match.
  #
  # @param elo_table [Hash{Integer=>Numeric}] mutable rating store
  # @param m [DataModel::Match] match whose result should be accounted for
  # @return [Hash{Integer=>Numeric}] the same hash instance for chaining
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

  # Builds a leaderboard sorted by ELO rating.
  #
  # @param season_id [Integer, nil] optional season filter
  # @param limit [Integer] maximum number of players to return
  # @param scope [Symbol] :all, :league, or :quick
  # @return [Array<Hash>] ranking entries containing player id, name, and stats
  def self.leaderboard(season_id: nil, limit: 50, scope: :all)
    # recompute ELO chronologically for determinism
    conditions = season_id ? { :division => { :season_id => season_id } } : {}
    matches = DataModel::Match.all(conditions.merge(:status => 2, :order => [ :time.asc, :id.asc ]))
    matches = apply_scope(matches, scope)
    matches = matches_to_array(matches)
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

  # Provides rich statistics for a single player.
  #
  # @param player_id [Integer]
  # @param window_days [Array<Integer>] rolling windows (in days) to compute
  #   snapshot statistics for
  # @param scope [Symbol] :all, :league, or :quick
  # @return [Hash] aggregated metrics including totals and per-window breakdowns
  def self.player_detail(player_id:, window_days: [7, 30, 90], scope: :all)
    p = DataModel::Player.get(player_id)
    return {} unless p

    ms = matches_of_player(p, scope: scope)
    totals = reduce_totals(ms, p)
    windows = {}
    now = DateTime.now
    window_days.each do |d|
      cutoff = now - d
      msw = ms.select { |m| m.time && m.time >= cutoff }
      windows[d] = reduce_totals(msw, p)
    end

    { player_id: p.id, name: p.name }.merge(totals).merge({ windows: windows })
  end

  # Returns played matches that involve the provided player.
  #
  # @param p [DataModel::Player]
  # @param scope [Symbol]
  # @return [Array<DataModel::Match>]
  def self.matches_of_player(p, scope: :all)
    # Find all matches where player participated
    matches = DataModel::Match.all(:status => 2, :conditions => [
      'pl1 = ? OR pl2 = ? OR pl3 = ? OR pl4 = ?',
      p.id, p.id, p.id, p.id
    ], :order => [:time.asc, :id.asc])
    matches = apply_scope(matches, scope)
    matches_to_array(matches)
  end

  # Aggregates wins, losses, and goal statistics for a player.
  #
  # @param matches [Array<DataModel::Match>]
  # @param p [DataModel::Player]
  # @return [Hash] metrics including win rate, goals, and streak information
  def self.reduce_totals(matches, p)
    matches = matches_to_array(matches)
    games = matches.length
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
  # Calculates head-to-head statistics for two players.
  #
  # @param a_id [Integer]
  # @param b_id [Integer]
  # @param scope [Symbol]
  # @return [Hash] with games played, win counts, and goal differential
  def self.h2h(a_id:, b_id:, scope: :all)
    ms = DataModel::Match.all(:status => 2, :conditions => [
      '(pl1 = ? OR pl2 = ? OR pl3 = ? OR pl4 = ?) AND ' \
      '(pl1 = ? OR pl2 = ? OR pl3 = ? OR pl4 = ?)',
      a_id, a_id, a_id, a_id, b_id, b_id, b_id, b_id
    ], :order => [:time.asc, :id.asc])
    ms = apply_scope(ms, scope)
    ms = matches_to_array(ms)
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
    { a_id: a_id, b_id: b_id, games: ms.length, wins_a: wins_a, wins_b: wins_b, goal_diff_a: diff }
  end

  # ---- Partnerships
  # Lists best-performing partners for a player.
  #
  # @param player_id [Integer]
  # @param limit [Integer]
  # @param scope [Symbol]
  # @return [Array<Hash>] sorted partnership records including win rate
  def self.partnerships(player_id:, limit: 10, scope: :all)
    p = DataModel::Player.get(player_id)
    return [] unless p

    partners = Hash.new { |h, k| h[k] = { games: 0, wins: 0 } }

    matches = DataModel::Match.all(:status => 2, :conditions => [
      'pl1 = ? OR pl2 = ? OR pl3 = ? OR pl4 = ?',
      p.id, p.id, p.id, p.id
    ], :order => [:time.asc, :id.asc])
    matches = apply_scope(matches, scope)
    matches_to_array(matches).each do |m|
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
  # Derives clutch/comeback metrics based on goal events for a match.
  #
  # @param match_id [Integer]
  # @return [Hash] timeline indicators such as :close_game and :comeback
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

  # Normalises a provided scope value into a supported symbol.
  #
  # @param scope [Symbol, String, nil]
  # @return [Symbol] one of :all, :league, :quick
  def self.normalize_scope(scope)
    sym = scope.respond_to?(:to_sym) ? scope.to_sym : :all
    MATCH_SCOPES.key?(sym) ? sym : :all
  end

  # Filters matches by quick/league scope.
  #
  # @param matches [DataMapper::Collection, Array<DataModel::Match>]
  # @param scope [Symbol]
  # @return [Array<DataModel::Match>] filtered matches respecting the scope
  def self.apply_scope(matches, scope)
    normalized = normalize_scope(scope)
    desired = MATCH_SCOPES[normalized]
    return matches if desired.nil?

    if quick_flag_supported? && matches.respond_to?(:all)
      begin
        return matches.all(:quick_match => desired)
      rescue ArgumentError
        # fall back to enumerable filtering below
      end
    end

    matches_to_array(matches).select { |m| match_quick?(m) == desired }
  end

  # Ensures the provided matches collection is converted into an array.
  #
  # @param matches [#to_a, Array]
  # @return [Array<DataModel::Match>]
  def self.matches_to_array(matches)
    if matches.respond_to?(:to_a)
      matches.to_a
    else
      Array(matches)
    end
  end

  # Detects whether a match should be considered a quick match.
  #
  # @param match [#quick_match?, #quick_match]
  # @return [Boolean]
  def self.match_quick?(match)
    if match.respond_to?(:quick_match?)
      match.quick_match?
    elsif match.respond_to?(:quick_match)
      !!match.quick_match
    else
      false
    end
  end

  # Checks whether the underlying schema exposes the quick_match column.
  #
  # @return [Boolean]
  def self.quick_flag_supported?
    return @quick_flag_supported unless @quick_flag_supported.nil?

    supported = false
    if defined?(DataModel::Match) && DataModel::Match.respond_to?(:properties)
      begin
        supported = DataModel::Match.properties.map(&:name).include?(:quick_match)
      rescue StandardError
        supported = false
      end
    end
    @quick_flag_supported = supported
  end
end
