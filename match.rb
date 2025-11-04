# Represents a scheduled or completed foosball match.
#
# The entity stores the four participating players, metadata about the match
# configuration (quick match mode, win conditions, score targets), and the
# recorded scores for every submatch. Instances are created by repositories and
# passed around the application to avoid exposing DataMapper records to the
# domain logic.
#
# Matches can be either "league" style (best-of-three across different
# pairings) or "quick" matches (single game, optional singles mode). Utility
# helpers below normalise inputs, expose convenience predicates, and derive
# submatch breakdowns for reporting purposes.
#
# @!attribute [rw] id
#   Unique identifier for the match, assigned by the repository once persisted.
#   @return [Integer, nil]
# @!attribute [r] division_id
#   Identifier of the division the match belongs to.
#   @return [Integer]
# @!attribute [r] round
#   Sequential round number. Quick matches use round zero.
#   @return [Integer]
# @!attribute [r] players
#   Array of player identifiers stored in fixed order [pl1, pl2, pl3, pl4].
#   @return [Array<Integer, nil>]
# @!attribute [r] scores
#   Array of score pairs, one per submatch. Empty until results are set.
#   @return [Array<Array<Integer>>]
# @!attribute [r] victories
#   Cached victory counts per player, recalculated when scores change.
#   @return [Array<Integer>]
# @!attribute [r] status
#   Status flag: 0 pending, 1 cancelled, 2 played.
#   @return [Integer]
# @!attribute [r] time
#   Timestamp of when the match was played.
#   @return [Time, nil]
# @!attribute [r] duration
#   Match duration in seconds.
#   @return [Integer, nil]
# @!attribute [r] quick_match
#   Raw quick match flag used by persistence layer.
#   @return [Boolean]
# @!attribute [r] mode
#   Match mode, e.g. "standard", "doubles", or "singles" for quick matches.
#   @return [String]
# @!attribute [r] win_condition
#   Strategy describing how winners are determined.
#   @return [String]
# @!attribute [r] target_score
#   Target score for quick matches.
#   @return [Integer]
class Match

DEFAULT_MODE = 'standard'
DEFAULT_WIN_CONDITION = 'score_limit'
DEFAULT_TARGET_SCORE = 10

attr_accessor :id 
attr_reader :division_id
attr_reader :round
attr_reader :players
attr_reader :scores
attr_reader :victories
attr_reader :status
attr_reader :time
attr_reader :duration
attr_reader :quick_match
attr_reader :mode
attr_reader :win_condition
attr_reader :target_score

  # Builds a new domain match entity.
  #
  # @param id [Integer, nil] database identifier, nil for new matches
  # @param players [Array<Integer, nil>] players participating in fixed slot
  #   order; shorter arrays are padded with nils
  # @param division_id [Integer] owning division identifier
  # @param round [Integer] sequential round number (0 for quick matches)
  # @param attributes [Hash] optional attributes (status, scores, metadata)
  def initialize(id, players, division_id, round, attributes = {})
  @id = id
  @players = Array(players).dup
  @players.fill(nil, @players.length...4)
  @division_id = division_id
  @round = round

  attributes ||= {}

  @quick_match = false
  @mode = DEFAULT_MODE
  @win_condition = DEFAULT_WIN_CONDITION
  @target_score = DEFAULT_TARGET_SCORE
  @status = attributes[:status]
  @time = attributes[:time]
  @duration = attributes[:duration]

  @scores = []
  @victories = []

  set_quick_match(attributes[:quick_match]) if attributes.key?(:quick_match)
  set_mode(attributes[:mode]) if attributes.key?(:mode)
  set_win_condition(attributes[:win_condition]) if attributes.key?(:win_condition)
  set_target_score(attributes[:target_score]) if attributes.key?(:target_score)
end

  # Indicates whether the match is a quick match.
  #
  # @return [Boolean] true when {#quick_match} flag is set
  def quick_match?()
    return !!@quick_match
  end

  # Sets quick match status, normalising to a boolean.
  #
  # @param value [Object] truthy/falsy value coming from persistence
  # @return [void]
  def set_quick_match(value)
    @quick_match = !!value
  end

  # Configures the match mode, defaulting to {DEFAULT_MODE} when blank.
  #
  # @param value [String, nil]
  # @return [void]
  def set_mode(value)
    @mode = value.nil? || value == '' ? DEFAULT_MODE : value
  end

  # Configures the win condition for the match.
  #
  # @param value [String, nil]
  # @return [void]
  def set_win_condition(value)
    @win_condition = value.nil? || value == '' ? DEFAULT_WIN_CONDITION : value
  end

  # Sets the target score for quick matches, defaulting when blank.
  #
  # @param value [String, Integer, nil]
  # @return [void]
  def set_target_score(value)
    if value.nil? || value == ''
      @target_score = DEFAULT_TARGET_SCORE
    else
      @target_score = value.to_i
    end
  end

  # Checks whether the match has been played.
  #
  # @return [Boolean] true when {#status} equals 2
  def played?()
    return @status == 2
  end

  # Checks whether the match has been cancelled.
  #
  # @return [Boolean] true when {#status} equals 1
  def cancelled?()
    return @status == 1
  end

  # Updates the stored status code.
  #
  # @param status [Integer]
  # @return [void]
  def set_status(status)
    @status = status
  end

  # Records timing information for a played match.
  #
  # @param time [Time, nil] timestamp of the match
  # @param duration [Integer, nil] duration in seconds
  # @return [void]
  def set_played_stats(time, duration)
    @time = time
    @duration = duration
  end

  # Stores raw submatch score data.
  #
  # Invalid entries are ignored to preserve backwards compatibility with older
  # result payloads. Once updated the cached victory counts are recalculated.
  #
  # @param scores [Array<Array<Integer>>] array of score pairs
  # @return [void]
  def set_scores(scores)
    @scores = []
    if scores
      scores.each do |score|
        next unless score.is_a?(Array) && score.length >= 2
        @scores << [score[0], score[1]]
      end
    end
    calculate_victories()
  end

  # Recomputes the cached victories per player.
  #
  # Quick matches treat the first two players as a team against the last two,
  # whereas league matches evaluate all three submatches following the
  # historical format used by the foosball league.
  #
  # @return [void]
  def calculate_victories()
  @victories = [0, 0, 0, 0]
  return if @scores.nil? || @scores.empty?

  if quick_match?
    # Single game: Yellow team (pl1+pl2) vs Black team (pl3+pl4)
    score = @scores.first
    return unless valid_score_pair?(score)
    if score[0] > score[1]
      increment_victories([0, 1])  # Yellow team wins
    elsif score[1] > score[0]
      increment_victories([2, 3])  # Black team wins
    end
  else
    # Best-of-3: Three different pairings
    matchups = [
      { score: @scores[0], winners: [0, 1], losers: [2, 3] },  # pl1+pl2 vs pl3+pl4
      { score: @scores[1], winners: [0, 2], losers: [1, 3] },  # pl1+pl3 vs pl2+pl4
      { score: @scores[2], winners: [0, 3], losers: [1, 2] }   # pl1+pl4 vs pl2+pl3
    ]

    matchups.each do |matchup|
      score = matchup[:score]
      next unless valid_score_pair?(score)
      if score[0] > score[1]
        increment_victories(matchup[:winners])
      elsif score[1] > score[0]
        increment_victories(matchup[:losers])
      end
    end
  end
end

# FIXME: The human version should be generated in FE, not here
  # Formats the stored {#time} for human-readable output.
  #
  # @return [String] timestamp formatted as `YYYY/MM/DD HH:MM`
  def get_time()
    return @time.strftime("%Y/%m/%d %H:%M")
  end

# FIXME: The human version should be generated in FE, not here
  # Formats the stored {#duration} into minutes and seconds.
  #
  # @return [String] formatted duration or `-` when not available
  def get_duration()
    if @duration
      duration_human = "%02d:%02d" % [@duration / 60, @duration % 60]
    else
      duration_human = "-"
    end
    return duration_human
  end

  # Returns a breakdown of submatches with participating players and scores.
  #
  # @return [Array<Array>] array of four-element entries describing the two
  #   teams and the recorded score for each submatch
  def get_submatches()
    return [] if @scores.nil? || @scores.empty?

  if quick_match?
    # Single game: Yellow team vs Black team
    score = @scores.first
    return [] unless valid_score_pair?(score)
    return [
      [[@players[0], @players[1]].compact, score[0], [@players[2], @players[3]].compact, score[1]]
    ]
  end

  # Best-of-3: Three different pairings
  submatches = []
  pairs = [
    [[@players[0], @players[1]], [@players[2], @players[3]], @scores[0]],
    [[@players[0], @players[2]], [@players[1], @players[3]], @scores[1]],
    [[@players[0], @players[3]], [@players[1], @players[2]], @scores[2]]
  ]

  pairs.each do |team1, team2, score|
    next unless valid_score_pair?(score)
    submatches << [team1.compact, score[0], team2.compact, score[1]]
  end

  submatches
end

private

  # @return [Boolean] whether the provided score tuple is usable
  def valid_score_pair?(score)
    score.is_a?(Array) && score.length >= 2 && !score[0].nil? && !score[1].nil?
  end

def increment_victories(indices)
  indices.each do |idx|
    next if idx.nil?
    player_id = @players[idx]
    next if player_id.nil?
    @victories[idx] += 1
  end
end

end
