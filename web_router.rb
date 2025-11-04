$LOAD_PATH << '.'

require 'sinatra'
require 'conf'

require 'tilt/erb'
require 'json'

require 'season_repository'
require 'division_repository'
require 'match_repository'
require 'player_repository'
require 'result_processor'
require 'hook_manager'

ALLOWED_MATCH_MODES = {
  'doubles' => 2
}.freeze

# Disable Rack protection for LAN development (allows API calls from localhost and LAN hostnames)
# This must come AFTER all requires to ensure config_file doesn't override it
set :protection, except: [:host_authorization, :json_csrf, :remote_token]
set :bind, '0.0.0.0'
set :allow_origin, :any
set :allow_methods, [:get, :post, :put, :delete, :options]

get '/' do
  season_repo = SeasonRepository.new()
  @seasons = season_repo.get_all_seasons()
  current_season = season_repo.get_most_recent_season()
  @default_season_id = current_season.id
  erb :web
end

get '/ajax/season/:season_id' do
  @season_id = params[:season_id].to_i
  season_repo = SeasonRepository.new()
  season = season_repo.get(@season_id)
  @divisions = season.divisions
  erb :season
end

get '/ajax/summary/:season_id' do
  season_repo = SeasonRepository.new()
  division_repo = DivisionRepository.new()
  season = season_repo.get(params[:season_id].to_i)
  divisions = season.divisions
  @division_data = {}
  divisions.each do |d|
    division_entity = division_repo.get(d.id)
    @division_data[d.id] = {
      :name => division_entity.name,
      :classification => division_entity.get_current_classification()
    }
  end

  match_repo = MatchRepository.new()
  division_ids = @division_data.keys()
  @recent_matches = match_repo.get_recently_finished_matches(division_ids, 8)

  player_repo = PlayerRepository.new
  @players = player_repo.get_all_players_by_id()

  erb :summary
end

get '/ajax/division/:division' do
  division_repo = DivisionRepository.new
  division = division_repo.get(params[:division].to_i)
  @division_id = division.id
  @classification = division.get_current_classification()
  @rivals = division.get_rivals_info()
  @open_matches = division.get_open_matches()
  @finished_matches = division.get_finished_matches()
  @total_matches = division.total_matches

  player_repo = PlayerRepository.new
  @players = player_repo.get_all_players_by_id()

  erb :division
end

get '/ajax/history/:division' do
  @division_id = params[:division].to_i
  division_repo = DivisionRepository.new()
  division = division_repo.get(@division_id)

  player_repo = PlayerRepository.new
  @players = player_repo.get_all_players_by_id()

  full_classification_history = division.get_classification_history()
  @classification_history = []
  (1...(full_classification_history.length)).each do |i|
    step = {
      :match => full_classification_history[i][:match],
      :before => full_classification_history[i-1][:classification],
      :after => full_classification_history[i][:classification],
      :highlight => {}
    }
    full_classification_history[i][:match].players.each do |p|
      step[:highlight][p] = :equal
    end
    @classification_history << step
  end

  erb :history
end

get '/ajax/player/:player/:division' do
  @player_id = params[:player].to_i
  @division_id = params[:division].to_i
  division_repo = DivisionRepository.new()
  division = division_repo.get(@division_id)

  player_repo = PlayerRepository.new
  @players = player_repo.get_all_players_by_id()

  full_classification_history = division.get_classification_history()
  @classification_history = []
  has_played_matches = false
  (1...(full_classification_history.length)).each do |i|
    player_in_match = false
    if full_classification_history[i][:match].players.include?(@player_id)
      has_played_matches = true
      player_in_match = true
    end
    if has_played_matches
      classification_before = full_classification_history[i-1][:classification]
      classification_after = full_classification_history[i][:classification]
      player_state_before = classification_before.find {|x| x[:player_id] == @player_id}
      player_state_after = classification_after.find {|x| x[:player_id] == @player_id}
      diff_points = player_state_after[:points] - player_state_before[:points]
      diff_position = player_state_after[:position] - player_state_before[:position]
      if diff_points != 0 or diff_position != 0
        step = {
          :match => full_classification_history[i][:match],
          :before => classification_before,
          :after => classification_after,
        }
        if diff_points > 0
          step[:highlight] = { @player_id => :up }
        elsif diff_points < 0
          step[:highlight] = { @player_id => :down }
        else
          step[:highlight] = { @player_id => :equal }
        end
        @classification_history << step
      end
    end
  end

  erb :history
end

get '/ajax/simulator/:match' do
  @match_id = params[:match].to_i
  match_repo = MatchRepository.new()
  match = match_repo.get(@match_id)

  division_repo = DivisionRepository.new()
  division = division_repo.get(match.division_id)

  player_repo = PlayerRepository.new
  @players = player_repo.get_all_players_by_id()

  @match_players = match.players
  match_player_names = @match_players.map do |player_id|
    player = @players[player_id]
    player ? player.name : nil
  end

  present_players = @match_players.compact
  missing_players = match_player_names.any?(&:nil?)
  duplicated_players = present_players.uniq.length != present_players.length
  @simulator_disabled = missing_players || duplicated_players
  @simulator_error = if missing_players
    'Not enough players are assigned to this match yet. Assign both teams to enable the simulator.'
  elsif duplicated_players
    'Each player can only appear once in the lineup. Please adjust the teams before running the simulator.'
  else
    nil
  end

  safe_name = lambda do |idx|
    match_player_names[idx] || 'TBD'
  end

  @classification = division.get_current_classification()
  @classification.each do |c|
    if @match_players.include?(c[:player_id])
      c[:highlight] = true
    else
      c[:highlight] = false
    end
  end

  @results1 = [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4]]
  @results2 = [[4, 5], [3, 5], [2, 5], [1, 5], [0, 5]]

  @submatches = [
    {
      :idx => 1,
      :player1a => safe_name.call(0),
      :player1b => safe_name.call(1),
      :player2a => safe_name.call(2),
      :player2b => safe_name.call(3),
    },
    {
      :idx => 2,
      :player1a => safe_name.call(0),
      :player1b => safe_name.call(2),
      :player2a => safe_name.call(1),
      :player2b => safe_name.call(3),
    },
    {
      :idx => 3,
      :player1a => safe_name.call(0),
      :player1b => safe_name.call(3),
      :player2a => safe_name.call(1),
      :player2b => safe_name.call(2),
    }
  ]

  erb :simulator
end

post '/ajax/simulation/:match' do
  body = request.body.read
  data = JSON.parse(body)

  match_id = params[:match].to_i
  match_repo = MatchRepository.new()
  match = match_repo.get(match_id)
  match.set_status(2)
  match.set_played_stats(Time.now.to_i, 0)
  match.set_scores(data['results'])

  division_repo = DivisionRepository.new()
  division = division_repo.get(match.division_id)

  player_repo = PlayerRepository.new()
  @players = player_repo.get_all_players_by_id()

  @classification = division.get_classification_with_extra_match(match)
  match_players = match.players
  @classification.each do |c|
    if match_players.include?(c[:player_id])
      c[:highlight] = true
    else
      c[:highlight] = false
    end
  end

  erb :simulation
end

get %r{/api/v1/players/?} do
  player_repo = PlayerRepository.new()
  response = {}
  player_repo.get_all_players().each do |p|
    response[p.id] = player2api(p)
  end
  json_api(response)
end

get %r{/api/v1/players/(?<player_id>\d+)/?} do
  player_repo = PlayerRepository.new()
  p = player_repo.get(params[:player_id])
  json_api(player2api(p))
end

get %r{/api/v1/seasons/?} do
  season_repo = SeasonRepository.new()
  response = []
  season_repo.get_all_seasons().each do |s|
    response << season2api(s)
  end
  json_api(response)
end

get %r{/api/v1/seasons/current/?} do
  season_repo = SeasonRepository.new()
  s = season_repo.get_most_recent_season()
  json_api(season2api(s))
end

get %r{/api/v1/seasons/(?<season_id>\d+)/?} do
  season_repo = SeasonRepository.new()
  s = season_repo.get(params[:season_id].to_i)
  json_api(season2api(s))
end

get %r{/api/v1/divisions/(?<division_id>\d+)/?} do
  division_repo = DivisionRepository.new()
  d = division_repo.get(params[:division_id].to_i)
  json_api(division2api(d))
end

get %r{/api/v1/divisions/(?<division_id>\d+)/players/?} do
  division_repo = DivisionRepository.new()
  d = division_repo.get(params[:division_id].to_i)
  response = {}
  d.players.each do |p|
    response[p.id] = player2api(p)
  end
  json_api(response)
end

get %r{/api/v1/divisions/(?<division_id>\d+)/players/(?<player_id>\d+)/?} do
  response = {}
  division_repo = DivisionRepository.new()
  d = division_repo.get(params[:division_id].to_i)
  if d
    p = d.players.find { |x| x.id == params[:player_id].to_i }
    if p
      if d.absences.key?(p.id)
        absences = d.absences[p.id]
      else
        absences = []
      end
      response = player2api(p)
      response['absences'] = absences
    end
  end
  json_api(response)
end

get %r{/api/v1/divisions/(?<division_id>\d+)/matches/?} do
  division_repo = DivisionRepository.new()
  d = division_repo.get(params[:division_id].to_i)
  response = []
  assigned_matches = d.get_assigned_matches()
  assigned_matches.each do |m|
    response << match2api(m)
  end

  json_api(response)
end

get %r{/api/v1/divisions/(?<division_id>\d+)/matches/open/?} do
  division_repo = DivisionRepository.new()
  d = division_repo.get(params[:division_id].to_i)

  response = []
  open_matches = d.get_open_matches()
  open_matches.each do |m|
    response << match2api(m)
  end

  json_api(response)
end

get %r{/api/v1/divisions/(?<division_id>\d+)/matches/played/?} do
  division_repo = DivisionRepository.new()
  d = division_repo.get(params[:division_id].to_i)

  response = []
  open_matches = d.get_finished_matches()
  open_matches.each do |m|
    response << match2api(m)
  end

  json_api(response)
end

get %r{/api/v1/divisions/(?<division_id>\d+)/classification/?} do
  division_repo = DivisionRepository.new()
  d = division_repo.get(params[:division_id].to_i)
  response = d.get_current_classification()

  json_api(response)
end

get %r{/api/v1/matches/(?<match_id>\d+)/?} do
  match_repo = MatchRepository.new()
  match = match_repo.get(params[:match_id].to_i)
  if match.played?
    match.calculate_victories()
  end
  response = match2api(match)

  json_api(response)
end

get '/api/get_open_matches' do
  season_repo = SeasonRepository.new()
  match_repo = MatchRepository.new()
  player_repo = PlayerRepository.new

  current_season = season_repo.get_most_recent_season()
  divisions = current_season.divisions

  players = player_repo.get_all_players_by_id()

  response = []
  divisions.each do |d|
    division_data = {}
    division_data[:division_id] = d.id
    division_data[:name] = d.name
    division_data[:matches] = []
    open_matches = d.get_open_matches()
    open_matches.each do |m|
      division_data[:matches] << serialize_open_match(m, players)
    end
    response << division_data
  end

  json_api(response)
end

get '/api/get_quick_match/:id' do
  match_repo = MatchRepository.new()
  player_repo = PlayerRepository.new

  content_type :json
  match = match_repo.get(params[:id].to_i)
  halt 404, json_api({ error: 'match not found' }) unless match
  halt 404, json_api({ error: 'not a quick match' }) unless match.quick_match?

  players = player_repo.get_all_players_by_id()
  json_api(serialize_open_match(match, players))
end

before '/api/set_*' do
  halt 403 unless params['apiKey'] && API_KEYS.include?(params['apiKey'])
end

before '/api/create_quick_match' do
  api_key = request.env['HTTP_X_API_KEY'] || params['apiKey'] || params['api_key']
  halt 403, json_api({'error' => 'Forbidden'}) unless api_key && API_KEYS.include?(api_key)
  content_type :json
end

# ===============================================
# New authenticated Stats API routes
# ===============================================
require_relative 'stats'
require_relative 'dm/data_model'

set :bind, BIND_HOST
set :port, BIND_PORT

# Authentication middleware for new API endpoints
before '/api/stats/*' do
  halt 401, {error: 'missing api key'}.to_json unless request.env['HTTP_X_API_KEY']
  halt 403, {error: 'forbidden'}.to_json unless API_KEYS.include?(request.env['HTTP_X_API_KEY'])
  content_type :json
end

before '/api/matches' do
  next if request.request_method == 'GET'  # Allow GET without auth
  halt 401, {error: 'missing api key'}.to_json unless request.env['HTTP_X_API_KEY']
  halt 403, {error: 'forbidden'}.to_json unless API_KEYS.include?(request.env['HTTP_X_API_KEY'])
  content_type :json
end

# ---- Health check
get '/api/health' do
  content_type :json
  api_key_present = request.env['HTTP_X_API_KEY'] ? true : false
  api_key_valid = api_key_present && API_KEYS.include?(request.env['HTTP_X_API_KEY'])
  
  {
    ok: true,
    season_count: DataModel::Season.all.size,
    player_count: DataModel::Player.all.size,
    auth: {
      key_present: api_key_present,
      key_valid: api_key_valid
    }
  }.to_json
end

# ---- Ad-hoc match creation
post '/api/matches' do
  p = JSON.parse(request.body.read) rescue {}
  season = DataModel::Season.first(:status => 1) || DataModel::Season.first
  halt 400, {error: 'no season'}.to_json unless season

  mode = (p['mode'] || 'doubles').to_s
  team_size = ALLOWED_MATCH_MODES[mode]
  halt 422, {error: 'unsupported mode'}.to_json unless team_size

  player_payload = p['players']
  halt 422, {error: 'players missing'}.to_json unless player_payload.is_a?(Hash)

  yellow_raw = player_payload['yellow']
  black_raw = player_payload['black']
  yellow_raw = yellow_raw.is_a?(Array) ? yellow_raw.compact : []
  black_raw = black_raw.is_a?(Array) ? black_raw.compact : []

  if yellow_raw.length != team_size || black_raw.length != team_size
    halt 422, {error: "each team must have #{team_size} players"}.to_json
  end

  if (yellow_raw + black_raw).any? { |value| value.respond_to?(:strip) && value.strip.empty? }
    halt 422, {error: 'player names must not be blank'}.to_json
  end

  normalized = (yellow_raw + black_raw).map do |value|
    if value.is_a?(Integer)
      "id:#{value}"
    else
      "name:#{value.to_s.strip.downcase}"
    end
  end
  if normalized.uniq.length != normalized.length
    halt 422, {error: 'players must be unique'}.to_json
  end

  # Find or create players by name
  def ensure_player(x)
    return DataModel::Player.get(x) if x.is_a?(Integer)
    DataModel::Player.first(:name => x) || DataModel::Player.create(:name => x)
  end

  y = yellow_raw.map { |n| ensure_player(n) }
  b = black_raw.map { |n| ensure_player(n) }

  # Find the first division in the season
  division = season.divisions.first
  halt 400, {error: 'no division in season'}.to_json unless division

  m = DataModel::Match.create(
    division_id: division.id,
    round: 0,
    pl1: y[0]&.id,
    pl2: y[1]&.id,
    pl3: b[0]&.id,
    pl4: b[1]&.id,
    status: 0,
    time: Time.now
  )
  
  { match_id: m.id }.to_json
end

# ---- Append goal timeline
post '/api/matches/:id/goals' do
  m = DataModel::Match.get(params[:id].to_i)
  halt 404, {error: 'match not found'}.to_json unless m
  
  p = JSON.parse(request.body.read) rescue {}
  events = p['events'] || []
  inserted = 0
  
  events.each do |e|
    DataModel::GoalEvent.create(
      match_id: m.id,
      team: e['team'],
      at_second: e['t'].to_i,
      score_yellow: e['score_yellow'].to_i,
      score_black: e['score_black'].to_i
    )
    inserted += 1
  end
  
  { inserted: inserted }.to_json
end

# ---- Finish match (final score)
post '/api/matches/:id/finish' do
  m = DataModel::Match.get(params[:id].to_i)
  halt 404, {error: 'match not found'}.to_json unless m
  
  p = JSON.parse(request.body.read) rescue {}
  
  # Update match status and scores
  # Calculate scores based on final yellow/black wins
  yellow_wins = (p.dig('final', 'yellow') || 0).to_i
  black_wins = (p.dig('final', 'black') || 0).to_i
  
  # Set score fields based on the match format (3 sub-matches)
  # For simplicity, we'll assume standard 2-1 or 2-0 wins
  m.update(
    status: 2,  # played
    time: Time.now,
    duration: p['duration'].to_i
  )
  
  { ok: true }.to_json
end

# ---- Stats endpoints (read-only)
get '/api/stats/leaderboard' do
  limit = (params['limit'] || 50).to_i
  season_name = params['season']
  season_id = season_name ? DataModel::Season.first(:title => season_name)&.id : nil
  scope = Stats.normalize_scope(params['scope'] || :all)

  Stats.leaderboard(season_id: season_id, limit: limit, scope: scope).to_json
end

get '/api/stats/players' do
  DataModel::Player.all.map { |p| { id: p.id, name: p.name, nick: p.nick } }.to_json
end

get '/api/stats/players/:id' do
  pid = params[:id].to_i
  scope = Stats.normalize_scope(params['scope'] || :all)
  Stats.player_detail(player_id: pid, scope: scope).to_json
end

get '/api/stats/h2h' do
  a = params['a'].to_i
  b = params['b'].to_i
  halt 400, {error: 'missing parameters a and b'}.to_json if a == 0 || b == 0
  scope = Stats.normalize_scope(params['scope'] || :all)

  Stats.h2h(a_id: a, b_id: b, scope: scope).to_json
end

get '/api/stats/partnerships/:id' do
  pid = params[:id].to_i
  limit = (params['limit'] || 10).to_i
  scope = Stats.normalize_scope(params['scope'] || :all)

  Stats.partnerships(player_id: pid, limit: limit, scope: scope).to_json
end

get '/api/stats/match/:id/timeline' do
  mid = params[:id].to_i
  Stats.timeline_metrics(mid).to_json
end

# ===============================================
# End of Stats API routes
# ===============================================

post '/api/set_result' do
  body = request.body.read
  data = JSON.parse(body)

  fd = open("results/result_" + Time.now.to_i.to_s + '_' + data['id'].to_s + ".json", "w")
  fd.write(body)
  fd.close()

  result = ResultProcessor.parse_result(data)
  if result == false
    json_api({'result' => 'Match result already processed'})
  else
    HookManager.match_played(data['id'])
    json_api({'result' => 'Match result correctly processed'})
  end
end

post '/api/create_quick_match' do
  begin
    payload = request.body.read
    payload = '{}' if payload.nil? || payload.empty?
    data = JSON.parse(payload)
  rescue JSON::ParserError
    halt 400, json_api({'error' => 'Invalid JSON payload'})
  end

  division_id = (data['division_id'] || params['division_id']).to_i
  halt 400, json_api({'error' => 'division_id is required'}) if division_id <= 0

  player_ids = data['player_ids']
  unless player_ids
    player_ids = [params['player1'], params['player2'], params['player3'], params['player4']].compact
  end
  player_ids = player_ids.map(&:to_i).reject { |pid| pid <= 0 }

  if player_ids.length != 4
    halt 400, json_api({'error' => 'Exactly four players must be selected'})
  end

  if player_ids.uniq.length != 4
    halt 400, json_api({'error' => 'Each player must be unique'})
  end

  halt 404, json_api({'error' => 'Division not found'}) unless DataModel::Division.get(division_id)

  player_repo = PlayerRepository.new
  players_by_id = player_repo.get_all_players_by_id
  missing_players = player_ids.reject { |pid| players_by_id.key?(pid) }
  unless missing_players.empty?
    halt 400, json_api({'error' => 'Unknown player ids', 'missing' => missing_players})
  end

  match_repo = MatchRepository.new
  begin
    match = match_repo.create_quick_match(division_id: division_id, players: player_ids)
  rescue ArgumentError => e
    halt 400, json_api({'error' => e.message})
  end

  json_api({'result' => 'Match created', 'match' => match2api(match)})
end

def serialize_open_match(match, players_by_id)
  player_ids = (match.players || []).dup
  player_names = player_ids.map do |pid|
    if pid && players_by_id[pid]
      players_by_id[pid].name
    else
      nil
    end
  end

  yellow_ids = player_ids[0..1] || []
  black_ids = player_ids[2..3] || []
  yellow_names = player_names[0..1] || []
  black_names = player_names[2..3] || []

  teams = {
    :yellow => {
      :ids => yellow_ids.compact,
      :names => yellow_names.compact
    },
    :black => {
      :ids => black_ids.compact,
      :names => black_names.compact
    }
  }

  data = {
    :id => match.id,
    :division_id => match.division_id,
    :round => match.round,
    :player_ids => player_ids,
    :players => player_names,
    :mode => match.mode || 'standard',
    :quick_match => match.quick_match?,
    :teams => teams
  }

  data[:target_score] = match.target_score if match.target_score

  unless match.quick_match?
    # League matches: Include all 3 submatch pairings for display
    default_name = 'TBD'
    name1 = player_names[0] || default_name
    name2 = player_names[1] || default_name
    name3 = player_names[2] || default_name
    name4 = player_names[3] || default_name
    data[:submatches] = [
      [[name1, name2], [name3, name4]],
      [[name1, name3], [name2, name4]],
      [[name1, name4], [name2, name3]],
    ]
  end

  data
end

def match2api(m)
  response = {
    'id' => m.id,
    'division_id' => m.division_id,
    'round' => m.round,
    'players' => m.players,
    'mode' => m.mode || 'standard',
    'quick_match' => m.quick_match?
  }
  response['target_score'] = m.target_score if m.target_score
  if m.played?
    response['played'] = true
    response['scores'] = m.scores
    response['victories'] = m.victories
    response['time'] = m.time
    response['duration'] = m.duration
  else
    response['played'] = false
  end
  return response
end

def season2api(s)
  response = {
    'id' => s.id,
    'title' => s.title,
    'start' => s.start_time,
    'end' => s.end_time,
    'divisions' => [],
  }

  s.divisions.each do |d|
    response['divisions'] << division2api(d)
  end
  return response
end

def division2api(d)
  response = {
    'id' => d.id,
    'title' => d.name,
    'level' => d.level,
    'total_rounds' => d.total_rounds,
    'current_round' => d.current_round,
  }
  return response
end

def player2api(p)
  response = { 'name' => p.name, 'nick' => p.nick }
  return response
end

def json_api(object)
  #return JSON.generate(object)
  return JSON.pretty_generate(object)
end
