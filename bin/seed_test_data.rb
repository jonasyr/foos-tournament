#!/usr/bin/env ruby
# Database seeding script to populate test data for UI testing
# Creates a season with players, divisions, and sample matches (both open and completed)

$LOAD_PATH << '..'

require 'season_repository'
require 'division_repository'
require 'player_repository'
require 'match_repository'
require_relative '../dm/data_model'

puts "Starting database seeding..."

# Initialize repositories
season_repo = SeasonRepository.new()
division_repo = DivisionRepository.new()
player_repo = PlayerRepository.new()
match_repo = MatchRepository.new()

# Check if we already have a season
existing_season = season_repo.get_most_recent_season()
if existing_season
  puts "Using existing season: #{existing_season.title} (ID: #{existing_season.id})"
  season_id = existing_season.id
else
  # Create a new season
  puts "Creating new season..."
  season = Season.new(nil, "Test Tournament 2025")
  season.set_status(:playing, Time.now, nil)
  season_repo.add(season)
  season_id = season.id
  puts "Created season: #{season.title} (ID: #{season_id})"
end

# Get or create division
season = season_repo.get(season_id)
if season.divisions.length > 0
  division = season.divisions.first
  puts "Using existing division: #{division.name} (ID: #{division.id})"
else
  puts "Creating division..."
  division = Division.new(nil, season_id, "Premier League", 1, 0)
  division.set_rounds(10, 1)
  division_repo.add(division)
  puts "Created division: #{division.name} (ID: #{division.id})"
end

# Create players
puts "Creating players..."
player_names = [
  "Alice Johnson",
  "Bob Smith",
  "Carol Williams",
  "Dave Brown",
  "Eve Davis",
  "Frank Miller",
  "Grace Wilson",
  "Henry Moore",
  "Ivy Taylor",
  "Jack Anderson",
  "Kate Thomas",
  "Leo Jackson",
  "Mia White",
  "Noah Harris",
  "Olivia Martin",
  "Paul Thompson"
]

players = []
player_names.each do |name|
  # Check if player already exists
  existing_player = DataModel::Player.first(name: name)
  if existing_player
    puts "  Player already exists: #{name} (ID: #{existing_player.id})"
    players << existing_player
  else
    # Create new player
    player = DataModel::Player.create(
      name: name,
      nick: name.split(' ').first
    )
    puts "  Created player: #{name} (ID: #{player.id})"
    players << player
  end
end

# Add all players to division if not already added
puts "Adding players to division..."
division_entity = division_repo.get(division.id)
players.each do |player|
  unless division_entity.players.any? { |p| p.id == player.id }
    DataModel::Divisionplayer.create(
      division_id: division.id,
      player_id: player.id,
      total_matches: 0,
      assign_deviation: 0
    )
    puts "  Added #{player.name} to division"
  end
end

# Create some completed matches with scores
puts "Creating completed matches..."
completed_matches_data = [
  {
    yellow: [players[0].id, players[1].id],
    black: [players[2].id, players[3].id],
    scores: [[10, 7], [8, 10], [10, 5]]  # Yellow wins 2-1
  },
  {
    yellow: [players[4].id, players[5].id],
    black: [players[6].id, players[7].id],
    scores: [[10, 4], [10, 6], [0, 0]]  # Yellow wins 2-0
  },
  {
    yellow: [players[8].id, players[9].id],
    black: [players[10].id, players[11].id],
    scores: [[7, 10], [10, 8], [6, 10]]  # Black wins 2-1
  },
  {
    yellow: [players[12].id, players[13].id],
    black: [players[14].id, players[15].id],
    scores: [[10, 3], [10, 5], [0, 0]]  # Yellow wins 2-0
  },
  {
    yellow: [players[0].id, players[2].id],
    black: [players[1].id, players[3].id],
    scores: [[5, 10], [10, 7], [8, 10]]  # Black wins 2-1
  },
  {
    yellow: [players[4].id, players[6].id],
    black: [players[5].id, players[7].id],
    scores: [[10, 8], [7, 10], [10, 6]]  # Yellow wins 2-1
  },
  {
    yellow: [players[8].id, players[10].id],
    black: [players[9].id, players[11].id],
    scores: [[10, 2], [10, 4], [0, 0]]  # Yellow wins 2-0
  },
  {
    yellow: [players[12].id, players[14].id],
    black: [players[13].id, players[15].id],
    scores: [[4, 10], [5, 10], [0, 0]]  # Black wins 2-0
  }
]

completed_matches_data.each_with_index do |match_data, idx|
  # Check if similar match already exists
  existing_match = DataModel::Match.first(
    division_id: division.id,
    pl1: match_data[:yellow][0],
    pl2: match_data[:yellow][1],
    pl3: match_data[:black][0],
    pl4: match_data[:black][1],
    status: 2
  )

  if existing_match
    puts "  Match already exists: #{players.find { |p| p.id == match_data[:yellow][0] }.name} & #{players.find { |p| p.id == match_data[:yellow][1] }.name} vs #{players.find { |p| p.id == match_data[:black][0] }.name} & #{players.find { |p| p.id == match_data[:black][1] }.name}"
  else
    match = DataModel::Match.create(
      division_id: division.id,
      round: 1,
      pl1: match_data[:yellow][0],
      pl2: match_data[:yellow][1],
      pl3: match_data[:black][0],
      pl4: match_data[:black][1],
      score1a: match_data[:scores][0][0],
      score1b: match_data[:scores][0][1],
      score2a: match_data[:scores][1][0],
      score2b: match_data[:scores][1][1],
      score3a: match_data[:scores][2][0],
      score3b: match_data[:scores][2][1],
      status: 2,  # played
      time: Time.now - (86400 * (8 - idx)),  # Spread over last 8 days
      duration: 600 + rand(300),  # 10-15 minutes
      quick_match: false,
      mode: 'doubles'
    )
    puts "  Created completed match #{idx + 1}: #{players.find { |p| p.id == match_data[:yellow][0] }.name} & #{players.find { |p| p.id == match_data[:yellow][1] }.name} vs #{players.find { |p| p.id == match_data[:black][0] }.name} & #{players.find { |p| p.id == match_data[:black][1] }.name}"
  end
end

# Create some open matches
puts "Creating open matches..."
open_matches_data = [
  {
    yellow: [players[0].id, players[4].id],
    black: [players[8].id, players[12].id]
  },
  {
    yellow: [players[1].id, players[5].id],
    black: [players[9].id, players[13].id]
  },
  {
    yellow: [players[2].id, players[6].id],
    black: [players[10].id, players[14].id]
  },
  {
    yellow: [players[3].id, players[7].id],
    black: [players[11].id, players[15].id]
  }
]

open_matches_data.each_with_index do |match_data, idx|
  # Check if similar open match already exists
  existing_match = DataModel::Match.first(
    division_id: division.id,
    pl1: match_data[:yellow][0],
    pl2: match_data[:yellow][1],
    pl3: match_data[:black][0],
    pl4: match_data[:black][1],
    status: 0
  )

  if existing_match
    puts "  Open match already exists: #{players.find { |p| p.id == match_data[:yellow][0] }.name} & #{players.find { |p| p.id == match_data[:yellow][1] }.name} vs #{players.find { |p| p.id == match_data[:black][0] }.name} & #{players.find { |p| p.id == match_data[:black][1] }.name}"
  else
    match = DataModel::Match.create(
      division_id: division.id,
      round: 2,
      pl1: match_data[:yellow][0],
      pl2: match_data[:yellow][1],
      pl3: match_data[:black][0],
      pl4: match_data[:black][1],
      status: 0,  # pending
      time: Time.now,
      quick_match: false,
      mode: 'doubles'
    )
    puts "  Created open match #{idx + 1}: #{players.find { |p| p.id == match_data[:yellow][0] }.name} & #{players.find { |p| p.id == match_data[:yellow][1] }.name} vs #{players.find { |p| p.id == match_data[:black][0] }.name} & #{players.find { |p| p.id == match_data[:black][1] }.name}"
  end
end

# Create a few quick matches (completed)
puts "Creating quick matches..."
quick_matches_data = [
  {
    yellow: [players[0].id, players[1].id],
    black: [players[4].id, players[5].id],
    yellow_score: 10,
    black_score: 7
  },
  {
    yellow: [players[2].id, players[3].id],
    black: [players[6].id, players[7].id],
    yellow_score: 8,
    black_score: 10
  }
]

quick_matches_data.each_with_index do |match_data, idx|
  existing_match = DataModel::Match.first(
    division_id: division.id,
    pl1: match_data[:yellow][0],
    pl2: match_data[:yellow][1],
    pl3: match_data[:black][0],
    pl4: match_data[:black][1],
    quick_match: true,
    status: 2
  )

  if existing_match
    puts "  Quick match already exists"
  else
    match = DataModel::Match.create(
      division_id: division.id,
      round: 0,
      pl1: match_data[:yellow][0],
      pl2: match_data[:yellow][1],
      pl3: match_data[:black][0],
      pl4: match_data[:black][1],
      score1a: match_data[:yellow_score],
      score1b: match_data[:black_score],
      status: 2,  # played
      time: Time.now - (3600 * (idx + 1)),  # Last few hours
      duration: 180 + rand(120),  # 3-5 minutes
      quick_match: true,
      mode: 'doubles',
      win_condition: 'score_limit',
      target_score: 10
    )
    puts "  Created quick match #{idx + 1}: #{players.find { |p| p.id == match_data[:yellow][0] }.name} & #{players.find { |p| p.id == match_data[:yellow][1] }.name} vs #{players.find { |p| p.id == match_data[:black][0] }.name} & #{players.find { |p| p.id == match_data[:black][1] }.name}"
  end
end

puts ""
puts "==================================="
puts "Database seeding completed!"
puts "==================================="
puts ""
puts "Summary:"
puts "  Players: #{players.length}"
puts "  Completed matches: #{DataModel::Match.all(division_id: division.id, status: 2).count}"
puts "  Open matches: #{DataModel::Match.all(division_id: division.id, status: 0).count}"
puts "  Quick matches: #{DataModel::Match.all(division_id: division.id, quick_match: true).count}"
puts ""
puts "You can now test the UI with real data!"
puts "Start the backend: bundle exec ruby web_router.rb"
puts "Start the frontend: cd frontend && npm run dev"
