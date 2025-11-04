$LOAD_PATH << '.'

require 'dm/data_model'
require 'match'

# Repository responsible for loading and persisting {Match} entities.
#
# The class abstracts DataMapper interactions and enforces invariants shared by
# both league and quick matches. It ensures that match entities remain
# consistent with database expectations (four player slots, unique rosters, and
# correctly shaped score arrays) before writes occur.
class MatchRepository

public

  # Retrieves a match entity by identifier.
  #
  # @param match_id [Integer]
  # @return [Match, nil]
  def get(match_id)
    match_record = DataModel::Match.get(match_id)
    return map_record_to_entity(match_record)
  end

  # Loads matches belonging to a specific division ordered by time.
  #
  # @param division_id [Integer]
  # @return [Array<Match>]
  def get_division_matches(division_id)
    match_records = DataModel::Match.all(DataModel::Match.division.id => division_id, :order => [:time.desc, :id.asc])
    return map_records_to_entities(match_records)
  end

  # Fetches recently finished matches for a collection of divisions.
  #
  # @param division_ids [Array<Integer>]
  # @param limit [Integer]
  # @return [Array<Match>]
  def get_recently_finished_matches(division_ids, limit)
    match_records = DataModel::Match.all(:division_id => division_ids, :status => 2, :order => [:time.desc], :limit => limit)
    return map_records_to_entities(match_records)
  end

  # Persists changes to an existing match.
  #
  # @param match_entity [Match]
  # @return [void]
  def update(match_entity)
    validate_match_entity!(match_entity)
    match_id = match_entity.id
    match_record = DataModel::Match.get(match_id)
    map_entity_to_record(match_entity, match_record)
    match_record.save
  end

  # Inserts a new match record and updates the entity identifier.
  #
  # @param match_entity [Match]
  # @return [Integer] identifier assigned by the database
  def add(match_entity)
    validate_match_entity!(match_entity)
    match_record = DataModel::Match.new()
    map_entity_to_record(match_entity, match_record)
    match_record.save
    match_entity.id = match_record.id
    return match_record.id
  end

  # Removes a match from the database.
  #
  # @param match_entity [Match]
  # @return [void]
  def delete(match_entity)
    match_id = match_entity.id
    match_record = DataModel::Match.get(match_id)
    match_record.destroy
  end

  # Creates and persists a quick match tailored for simulator workflows.
  #
  # @param division_id [Integer] owning division identifier
  # @param players [Array<Integer, nil>] players participating in the quick match
  # @param mode [String, nil] optional mode override (:singles or :doubles)
  # @param win_condition [String, nil] optional win condition metadata
  # @param target_score [Integer, nil] optional quick match score target
  # @param round [Integer, nil] round number to assign (defaults to 0)
  # @return [Match] persisted match entity
  # @raise [ArgumentError] when player selection is invalid
  def create_quick_match(division_id:, players:, mode: nil, win_condition: nil, target_score: nil, round: nil)
    raise ArgumentError, 'division_id is required for quick matches' if division_id.nil?

    normalized_mode = (mode || 'doubles').to_s.downcase
    normalized_mode = 'doubles' if normalized_mode.empty? || normalized_mode == 'standard'

    player_ids = Array(players).dup

    case normalized_mode
    when 'singles'
      player_ids = player_ids.compact
      if player_ids.length != 2
        raise ArgumentError, 'Singles quick matches require exactly two players'
      end
      player_ids = [player_ids[0], nil, player_ids[1], nil]
    else
      player_ids.fill(nil, player_ids.length...4)
      player_ids = player_ids.first(4)
      if player_ids.compact.length != 4
        raise ArgumentError, 'Doubles quick matches require four players'
      end
    end

    # Quick matches use round 0 by default (not bound to league rounds)
    round = 0 if round.nil?

    match_entity = Match.new(
      nil,
      player_ids,
      division_id,
      round,
      quick_match: true,
      mode: normalized_mode,
      win_condition: win_condition,
      target_score: target_score,
      status: 0
    )
    match_entity.set_status(0)
    add(match_entity)
    return match_entity
  end

private

  # Converts a DataMapper match record into a domain entity.
  #
  # @param m [DataModel::Match]
  # @return [Match]
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

  # Maps a collection of match records into domain entities.
  #
  # @param match_records [Enumerable<DataModel::Match>]
  # @return [Array<Match>]
  def map_records_to_entities(match_records)
    match_entities = []
    match_records.each do |m|
      match_entities << map_record_to_entity(m)
    end
    return match_entities
  end

  # Copies domain attributes back into a DataMapper match record.
  #
  # @param match_entity [Match]
  # @param match_record [DataModel::Match]
  # @return [void]
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
      scores = match_entity.scores || []
      # Quick matches may have 1 submatch, league matches have 3
      # Store each submatch safely, leaving unset ones as nil
      match_record.score1a = scores[0] ? scores[0][0] : nil
      match_record.score1b = scores[0] ? scores[0][1] : nil
      match_record.score2a = scores[1] ? scores[1][0] : nil
      match_record.score2b = scores[1] ? scores[1][1] : nil
      match_record.score3a = scores[2] ? scores[2][0] : nil
      match_record.score3b = scores[2] ? scores[2][1] : nil
      time = match_entity.time
      time = Time.now() if time == nil
      match_record.time = time
      match_record.duration = match_entity.duration
    end
  end

  # Validates that a domain entity satisfies persistence expectations.
  #
  # @param match_entity [Match]
  # @return [void]
  # @raise [ArgumentError] when player slots or uniqueness constraints are
  #   violated
  def validate_match_entity!(match_entity)
    players = match_entity.players
    unless players.is_a?(Array) && players.length == 4
      raise ArgumentError, 'Match must contain exactly four player slots'
    end

    present_players = players.compact

    if match_entity.quick_match?
      mode = match_entity.mode.to_s.downcase
      mode = 'doubles' if mode.empty? || mode == 'standard'

      case mode
      when 'singles'
        if present_players.length != 2
          raise ArgumentError, 'Singles quick matches require exactly two players'
        end
        unless players[0] && players[2]
          raise ArgumentError, 'Singles quick matches must assign one player per side'
        end
        if players[1] || players[3]
          raise ArgumentError, 'Singles quick matches should leave partner slots empty'
        end
      else
        if present_players.length != 4
          raise ArgumentError, 'Doubles quick matches require four players'
        end
      end
    else
      if present_players.length != 4
        raise ArgumentError, 'Match players must all be present'
      end
    end

    if present_players.uniq.length != present_players.length
      raise ArgumentError, 'Match players must be unique'
    end
  end

end
