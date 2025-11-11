require 'data_mapper'
require './match'

# DataMapper resource capturing a single goal within a quick or league match.
#
# Goal events fuel time-based analytics such as comeback detection. Records are
# created by the simulator and processed by {Stats.timeline_metrics}.
class GoalEvent
  include DataMapper::Resource

  property :id,            Serial
  property :match_id,      Integer, required: true, index: true
  property :team,          String,  required: true  # 'yellow' | 'black'
  property :at_second,     Integer, required: true
  property :score_yellow,  Integer, required: true
  property :score_black,   Integer, required: true
  property :created_at,    DateTime, default: lambda { |_r, _p| DateTime.now }

  belongs_to :match
end
