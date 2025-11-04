$LOAD_PATH << '.'

require 'dm/data_model'
require 'match'

class MatchRepository

public

def get(match_id)
  match_record = DataModel::Match.get(match_id)
  return map_record_to_entity(match_record)
end

def get_division_matches(division_id)
  match_records = DataModel::Match.all(DataModel::Match.division.id => division_id, :order => [:time.desc, :id.asc])
  return map_records_to_entities(match_records)
end

def get_recently_finished_matches(division_ids, limit)
  match_records = DataModel::Match.all(:division_id => division_ids, :status => 2, :order => [:time.desc], :limit => limit)
  return map_records_to_entities(match_records)
end

def update(match_entity)
  match_id = match_entity.id
  match_record = DataModel::Match.get(match_id)
  map_entity_to_record(match_entity, match_record)
  match_record.save
end

def add(match_entity)
  match_record = DataModel::Match.new()
  map_entity_to_record(match_entity, match_record)
  match_record.save
  match_entity.id = match_record.id
  return match_record.id
end

def delete(match_entity)
  match_id = match_entity.id
  match_record = DataModel::Match.get(match_id)
  match_record.destroy
end

def create_quick_match(division_id:, players:, mode: nil, win_condition: nil, target_score: nil, round: nil)
  raise ArgumentError, 'division_id is required for quick matches' if division_id.nil?

  player_ids = Array(players).dup
  player_ids.fill(nil, player_ids.length...4)
  player_ids = player_ids.first(4)

  # Quick matches use round 0 by default (not bound to league rounds)
  round = 0 if round.nil?

  match_entity = Match.new(
    nil,
    player_ids,
    division_id,
    round,
    quick_match: true,
    mode: mode,
    win_condition: win_condition,
    target_score: target_score,
    status: 0
  )
  match_entity.set_status(0)
  add(match_entity)
  return match_entity
end

private

def map_record_to_entity(m)
  players = [m.pl1, m.pl2, m.pl3, m.pl4]
  match_entity = Match.new(
    m.id,
    players,
    m.division_id,
    m.round,
    quick_match: m.quick_match,
    mode: m.mode,
    win_condition: m.win_condition,
    target_score: m.target_score,
    status: m.status,
    time: m.time,
    duration: m.duration
  )
  if m.status == 2
    scores = [[m.score1a, m.score1b], [m.score2a, m.score2b], [m.score3a, m.score3b]]
    match_entity.set_scores(scores)
  end
  match_entity.set_status(m.status)
  match_entity.set_played_stats(m.time, m.duration)
  return match_entity
end

def map_records_to_entities(match_records)
  match_entities = []
  match_records.each do |m|
    match_entities << map_record_to_entity(m)
  end
  return match_entities
end

def map_entity_to_record(match_entity, match_record)
  match_record.id = match_entity.id if match_entity.id
  match_record.division_id = match_entity.division_id
  match_record.round = match_entity.round
  match_record.status = match_entity.status
  players = match_entity.players
  match_record.pl1 = players[0]
  match_record.pl2 = players[1]
  match_record.pl3 = players[2]
  match_record.pl4 = players[3]
  match_record.quick_match = match_entity.quick_match?
  match_record.mode = match_entity.mode || Match::DEFAULT_MODE
  match_record.win_condition = match_entity.win_condition || Match::DEFAULT_WIN_CONDITION
  match_record.target_score = match_entity.target_score || Match::DEFAULT_TARGET_SCORE
  if match_entity.played?
    scores = match_entity.scores
    match_record.score1a = scores[0][0]
    match_record.score1b = scores[0][1]
    match_record.score2a = scores[1][0]
    match_record.score2b = scores[1][1]
    match_record.score3a = scores[2][0]
    match_record.score3b = scores[2][1]
    time = match_entity.time
    time = Time.now() if time == nil
    match_record.time = time
    match_record.duration = match_entity.duration
  end
end

end
