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

def quick_match?()
  return !!@quick_match
end

def set_quick_match(value)
  @quick_match = !!value
end

def set_mode(value)
  @mode = value.nil? || value == '' ? DEFAULT_MODE : value
end

def set_win_condition(value)
  @win_condition = value.nil? || value == '' ? DEFAULT_WIN_CONDITION : value
end

def set_target_score(value)
  if value.nil? || value == ''
    @target_score = DEFAULT_TARGET_SCORE
  else
    @target_score = value.to_i
  end
end

def played?()
  return @status == 2
end

def cancelled?()
  return @status == 1
end

def set_status(status)
  @status = status
end

def set_played_stats(time, duration)
  @time = time
  @duration = duration
end

def set_scores(scores)
  @scores = scores
  calculate_victories()
end

def calculate_victories()
  @victories = [0, 0, 0, 0]
  if @scores[0][0] > @scores[0][1]
    @victories[0] += 1
    @victories[1] += 1
  else
    @victories[2] += 1
    @victories[3] += 1
  end
  if @scores[1][0] > @scores[1][1]
    @victories[0] += 1
    @victories[2] += 1
  else
    @victories[1] += 1
    @victories[3] += 1
  end
  if @scores[2][0] > @scores[2][1]
    @victories[0] += 1
    @victories[3] += 1
  else
    @victories[2] += 1
    @victories[1] += 1
  end
end

# FIXME: The human version should be generated in FE, not here
def get_time()
  return @time.strftime("%Y/%m/%d %H:%M")
end

# FIXME: The human version should be generated in FE, not here
def get_duration()
  if @duration
    duration_human = "%02d:%02d" % [@duration / 60, @duration % 60]
  else
    duration_human = "-"
  end
  return duration_human
end

def get_submatches()
  return [
    [[@players[0], @players[1]], @scores[0][0], [@players[2], @players[3]], @scores[0][1]],
    [[@players[0], @players[2]], @scores[1][0], [@players[1], @players[3]], @scores[1][1]],
    [[@players[0], @players[3]], @scores[2][0], [@players[1], @players[2]], @scores[2][1]]
  ]
end

end
