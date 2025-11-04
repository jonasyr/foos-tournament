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

end
