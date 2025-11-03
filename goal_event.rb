require 'data_mapper'
require './match'

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
