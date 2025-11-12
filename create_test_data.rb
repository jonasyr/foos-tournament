#!/usr/bin/env ruby
# Create test data for the foosball tournament database

require_relative 'conf'
require_relative 'dm/data_model'

include DataModel

puts "Creating test data..."

# Create season
season = Season.first_or_create(
  { id: 1 },
  { title: 'Fall Championship 2025', start: '2025-09-01', end: '2025-12-15' }
)
puts "Created season: #{season.title}"

# Create players
players_data = [
  [1, 'Alice Johnson', 'Alice'],
  [2, 'Bob Smith', 'Bob'],
  [3, 'Carol Williams', 'Carol'],
  [4, 'Dave Brown', 'Dave'],
  [5, 'Eve Davis', 'Eve'],
  [6, 'Frank Miller', 'Frank'],
  [7, 'Grace Wilson', 'Grace'],
  [8, 'Henry Moore', 'Henry'],
  [9, 'Ivy Taylor', 'Ivy'],
  [10, 'Jack Anderson', 'Jack'],
  [11, 'Kate Thomas', 'Kate'],
  [12, 'Leo Jackson', 'Leo']
]

players_data.each do |id, name, nick|
  Player.first_or_create({ id: id }, { name: name, nick: nick })
end
puts "Created #{players_data.length} players"

# Create division
division = Division.first_or_create(
  { id: 1 },
  {
    name: 'Premier Division',
    level: 1,
    season_id: 1,
    total_rounds: 10,
    current_round: 1,
    scoring: 0
  }
)
puts "Created division: #{division.name}"

# Add players to division
players_data.each_with_index do |(id, _, _), index|
  matches_count = [5, 5, 5, 5, 4, 4, 4, 3, 3, 2, 2, 1][index]
  Divisionplayer.first_or_create(
    { player_id: id, division_id: 1 },
    { total_matches: matches_count, assign_deviation: 0 }
  )
end
puts "Associated players with division"

# Create open matches
open_matches = [
  { id: 1001, pl1: 1, pl2: 2, pl3: 3, pl4: 4 },
  { id: 1002, pl1: 5, pl2: 6, pl3: 7, pl4: 8 },
  { id: 1003, pl1: 9, pl2: 10, pl3: 11, pl4: 12 }
]

open_matches.each do |match_data|
  Match.first_or_create(
    { id: match_data[:id] },
    {
      round: 1,
      pl1: match_data[:pl1],
      pl2: match_data[:pl2],
      pl3: match_data[:pl3],
      pl4: match_data[:pl4],
      status: 1,  # open
      division_id: 1,
      quick_match: false,
      mode: 'doubles'
    }
  )
end
puts "Created #{open_matches.length} open matches"

# Create played matches
now = Time.now
played_matches = [
  { id: 1004, pl1: 1, pl2: 3, pl3: 5, pl4: 7, score1a: 10, score1b: 8, time: now - 7200 },
  { id: 1005, pl1: 2, pl2: 4, pl3: 6, pl4: 8, score1a: 7, score1b: 10, time: now - 3600 },
  { id: 1006, pl1: 1, pl2: 2, pl3: 9, pl4: 10, score1a: 10, score1b: 6, time: now - 1800 },
  { id: 1007, pl1: 3, pl2: 4, pl3: 11, pl4: 12, score1a: 10, score1b: 5, time: now - 900 }
]

played_matches.each do |match_data|
  Match.first_or_create(
    { id: match_data[:id] },
    {
      round: 1,
      pl1: match_data[:pl1],
      pl2: match_data[:pl2],
      pl3: match_data[:pl3],
      pl4: match_data[:pl4],
      status: 2,  # played
      division_id: 1,
      quick_match: false,
      mode: 'doubles',
      score1a: match_data[:score1a],
      score1b: match_data[:score1b],
      score2a: 0,
      score2b: 0,
      score3a: 0,
      score3b: 0,
      time: match_data[:time],
      duration: 300 + rand(300)
    }
  )
end
puts "Created #{played_matches.length} played matches"

# Create quick matches
quick_matches = [
  { id: 2001, pl1: 1, pl2: 5, pl3: 2, pl4: 6, mode: 'doubles', target: 10 },
  { id: 2002, pl1: 3, pl2: 7, pl3: 4, pl4: 8, mode: 'singles', target: 15 }
]

quick_matches.each do |match_data|
  Match.first_or_create(
    { id: match_data[:id] },
    {
      round: 1,
      pl1: match_data[:pl1],
      pl2: match_data[:pl2],
      pl3: match_data[:pl3],
      pl4: match_data[:pl4],
      status: 1,  # open
      division_id: 1,
      quick_match: true,
      mode: match_data[:mode],
      target_score: match_data[:target]
    }
  )
end
puts "Created #{quick_matches.length} quick matches"

puts "\n=== Database Summary ==="
puts "Players: #{Player.count}"
puts "Seasons: #{Season.count}"
puts "Divisions: #{Division.count}"
puts "Open matches: #{Match.all(status: 1).count}"
puts "Played matches: #{Match.all(status: 2).count}"
puts "\nTest data creation complete!"
