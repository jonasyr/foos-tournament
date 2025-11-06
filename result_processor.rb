$LOAD_PATH << '.'
require 'match_repository'

# Parses result payloads coming from the Foos client and persists them.
#
# The helper updates match scores, marks them as played, and records timing
# information when provided by the client. It intentionally keeps side-effects
# limited to the {MatchRepository} so that callers can stub persistence in tests
# or scripts.
module ResultProcessor

  # Applies result data to the stored match.
  #
  # @param data [Hash] payload with match attributes, including `id`, `results`,
  #   and optional `start`/`end` timestamps (epoch seconds)
  # @param overwrite [Boolean] whether to replace existing results
  # @return [Boolean] true when the result was persisted, false when skipped
  def self.parse_result(data, overwrite = false)
    match_id = data['id']
    match_repo = MatchRepository.new()
    match = match_repo.get(match_id)
    if match.played? and not overwrite
      return false
    end

    # Validate result count matches expected submatch count
    results = data['results'] || []
    expected_count = expected_result_count(match)
    
    if results.length != expected_count
      puts "WARNING: Match #{match_id} expected #{expected_count} results, got #{results.length}"
      # Continue anyway - don't block on validation
    end

    match.set_scores(data['results'])

    start_time = data['start']
    end_time = data['end']
    time = start_time ? Time.at(start_time) : Time.now
    duration = if start_time && end_time
      end_time - start_time
    else
      nil
    end
    match.set_status(2)
    match.set_played_stats(time, duration)

    match_repo.update(match)

    return true
  end

  # Determines expected number of result pairs based on match configuration
  #
  # @param match [Match] the match entity
  # @return [Integer] expected count (1 or 3)
  private_class_method def self.expected_result_count(match)
    if match.quick_match?
      # Quick matches: 1 result for score_limit, 3 for best_of
      match.win_condition == 'best_of' ? 3 : 1
    else
      # Traditional league matches: always 3 submatches
      3
    end
  end

end
