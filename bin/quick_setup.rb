#!/usr/bin/env ruby
# Quick setup script to add players and create a test match

$LOAD_PATH << '..'
require 'season_repository'
require 'player_repository'
require 'division_repository'
require 'match_repository'
require 'conf'
require 'division'
require 'match'

puts "=" * 60
puts "Foos Tournament - Quick Setup"
puts "=" * 60
puts ""

# Get active season
season_repo = SeasonRepository.new
season = season_repo.get_most_recent_season
if !season
  puts "ERROR: No season found!"
  puts "Run: ruby bin/create_season.rb 'Season 2025' --active"
  exit 1
end

puts "Using season: #{season.title} (ID: #{season.id})"
puts ""

# Add some test players if none exist
player_repo = PlayerRepository.new
player_names = ['Alice', 'Bob', 'Carol', 'Dave']
players = []

puts "Creating/finding players..."
player_names.each do |name|
  all_players = player_repo.get_all_players
  player = all_players.find { |p| p.name == name }
  if !player
    player = Player.new(nil, name)
    player_repo.add(player)
    puts "  ✓ Created player: #{name} (ID: #{player.id})"
  else
    puts "  ✓ Found existing player: #{name} (ID: #{player.id})"
  end
  players << player
end

puts ""

# Get division or create one
division_repo = DivisionRepository.new
divisions = season.divisions
if divisions.empty?
  puts "Creating a test division..."
  division = Division.create(
    :season_id => season.id,
    :name => 'Test Division',
    :start => Time.now,
    :kind => 1
  )
  puts "✓ Created division: #{division.name}"
else
  division = divisions.first
  puts "✓ Using existing division: #{division.name}"
end

# Add players to division
puts "Adding players to division..."
players.each do |p|
  unless division.players.include?(p)
    division.players << p
    puts "  ✓ Added #{p.name}"
  end
end
division.save

puts ""

# Create a test match using foos league.json format
puts "Creating league match file..."

# Match data in the format that league.py expects
match_data = {
  'id' => 1001 + rand(1000),  # Random ID
  'division' => division.name,
  'players' => [players[0].name, players[1].name, players[2].name, players[3].name],
  'submatches' => [
    [[players[0].name, players[1].name], [players[2].name, players[3].name]]
  ]
}

# Write to league.json in foos directory
league_file = '/home/pi/foos-project/foos/league/league.json'
require 'json'
require 'fileutils'

# Read existing or create empty array
league_data = if File.exist?(league_file)
  JSON.parse(File.read(league_file))
else
  []
end

# Remove old test division if exists
league_data.reject! { |d| d['name'] == division.name }

# Add our division with the match
league_data << {
  'name' => division.name,
  'matches' => [match_data]
}

# Write back
File.write(league_file, JSON.pretty_generate(league_data))

puts "✓ Created match in league.json:"
puts "  Yellow: #{players[0].name} & #{players[1].name}"
puts "  Black:  #{players[2].name} & #{players[3].name}"

puts ""
puts "=" * 60
puts "Setup complete!"
puts "=" * 60
puts ""
puts "Next steps:"
puts "1. Restart foos.py"
puts "2. Navigate to League menu"
puts "3. Select the match"
puts "4. Play and test stats logging!"
puts ""
