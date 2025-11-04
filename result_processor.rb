$LOAD_PATH << '.'

require 'match_repository'

module ResultProcessor

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
