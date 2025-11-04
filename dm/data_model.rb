require 'data_mapper'
require 'dm-migrations'
require_relative '../conf'

module DataModel

class Season
  include DataMapper::Resource

  property :id,      Serial
  has n, :divisions

  property :title,   String
  property :status,  Integer    # Playing / Finished
  property :start,   DateTime
  property :end,     DateTime
end

class Division
  include DataMapper::Resource

  property :id,      Serial
  belongs_to :season
  has n, :divisionplayers
  has n, :players, :through => :divisionplayers
  has n, :matches

  property :level,         Integer
  property :name,          String
  property :scoring,       Integer
  property :total_rounds,  Integer
  property :current_round, Integer
end

class Divisionplayer
  include DataMapper::Resource

  belongs_to :division, :key => true
  belongs_to :player, :key => true

  property :total_matches,   Integer
  property :assign_deviation, Integer
end

class Player
  include DataMapper::Resource

  property :id,        Serial
  has n, :divisionplayers
  has n, :divisions, :through => :divisionplayers

  property :name,      String
  property :nick,     String
end

class Roundplayer
  include DataMapper::Resource

  property :id,    Serial
  belongs_to :division
  belongs_to :player

  property :round, Integer
  property :matches, Integer
end

class Match
  include DataMapper::Resource

  property :id,       Serial
  belongs_to :division
  has n, :goal_events, 'GoalEvent'

  property :round,    Integer

  property :pl1,      Integer
  property :pl2,      Integer
  property :pl3,      Integer
  property :pl4,      Integer

  property :score1a,  Integer  # p1+p2
  property :score1b,  Integer  # p3+p4
  property :score2a,  Integer  # p1+p3
  property :score2b,  Integer  # p2+p4
  property :score3a,  Integer  # p1+p4
  property :score3b,  Integer  # p2+p3

  property :status,   Integer  # 0=pending 1=cancelled 2=played
  property :time,     DateTime
  property :duration, Integer

  property :quick_match,  Boolean, default: false
  property :mode,         String,  length: 50, default: 'standard'
  property :win_condition, String, length: 50, default: 'score_limit'
  property :target_score, Integer, default: 10
end

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

#DataMapper::Logger.new($stdout, :debug)
DataMapper.setup(:default, Conf.settings.db_uri)
DataMapper.repository(:default).adapter.resource_naming_convention = DataMapper::NamingConventions::Resource::UnderscoredAndPluralizedWithoutModule
DataMapper.finalize

end
