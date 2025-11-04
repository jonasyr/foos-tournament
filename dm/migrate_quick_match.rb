#!/usr/bin/env ruby
# Direct migration script for quick match fields
# Bypasses Sinatra dependencies

require 'data_mapper'
require 'dm-migrations'
require 'yaml'

# Load config directly
config_file = File.join(File.dirname(__FILE__), '..', 'config.yaml')
config = YAML.load_file(config_file)
db_uri = config['db_uri']

puts "Connecting to: #{db_uri}"

DataMapper::Logger.new($stdout, :info)
DataMapper.setup(:default, db_uri)

# Define minimal schema with new fields
class Match
  include DataMapper::Resource

  property :id,       Serial
  property :division_id, Integer
  property :round,    Integer
  property :pl1,      Integer
  property :pl2,      Integer
  property :pl3,      Integer
  property :pl4,      Integer
  property :score1a,  Integer
  property :score1b,  Integer
  property :score2a,  Integer
  property :score2b,  Integer
  property :score3a,  Integer
  property :score3b,  Integer
  property :status,   Integer
  property :time,     DateTime
  property :duration, Integer

  # NEW FIELDS FOR QUICK MATCH
  property :quick_match,  Boolean, default: false
  property :mode,         String,  length: 50, default: 'standard'
  property :win_condition, String, length: 50, default: 'score_limit'
  property :target_score, Integer, default: 10
end

DataMapper.finalize

puts "\n=== Running auto_upgrade! ==="
DataMapper.auto_upgrade!

puts "\n=== Migration completed! ==="
puts "New fields added to matches table:"
puts "  - quick_match (Boolean, default: false)"
puts "  - mode (String, default: 'standard')"
puts "  - win_condition (String, default: 'score_limit')"
puts "  - target_score (Integer, default: 10)"
