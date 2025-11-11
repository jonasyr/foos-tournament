#!/usr/bin/env ruby
# Simulates a match result submission for testing without physical hardware
# Usage: ruby simulate_match_result.rb <match_id> [score1] [score2]

require_relative '../web_router'
require_relative '../match_repository'
require_relative '../result_processor'
require 'json'

def simulate_match_result(match_id, score1 = nil, score2 = nil)
  puts "=" * 60
  puts "Simulating Match Result Submission"
  puts "=" * 60
  
  # Get the match from database
  match_repo = MatchRepository.new
  match = match_repo.get(match_id)
  
  unless match
    puts "❌ Error: Match #{match_id} not found"
    exit 1
  end
  
  puts "\n📋 Match Details:"
  puts "   ID: #{match.id}"
  puts "   Mode: #{match.mode || 'standard'}"
  puts "   Win Condition: #{match.win_condition}"
  puts "   Target Score: #{match.target_score || 10}"
  puts "   Quick Match: #{match.quick_match?}"
  
  # Determine how many results to submit based on win_condition
  expected_results = case match.win_condition
  when 'best_of'
    3
  when 'score_limit', 'time_limit'
    1
  else
    1
  end
  
  puts "\n🎯 Expected Results: #{expected_results} submatch(es)"
  
  # Generate results
  results = []
  target = match.target_score || 10
  
  if score1 && score2
    # User provided specific scores
    results << [score1.to_i, score2.to_i]
    puts "\n📊 Using provided scores: #{score1}-#{score2}"
  else
    # Generate random scores
    expected_results.times do |i|
      # Random winner and score within target
      if rand(2) == 0
        # Yellow wins
        yellow_score = target
        black_score = rand(target)
      else
        # Black wins
        yellow_score = rand(target)
        black_score = target
      end
      
      results << [yellow_score, black_score]
      puts "\n📊 Generated Game #{i + 1}: Yellow #{yellow_score} - #{black_score} Black"
    end
  end
  
  # If single score provided but best_of match, repeat it
  if results.length == 1 && expected_results > 1
    puts "\n⚠️  Best-of-3 match but only 1 score provided. Generating #{expected_results - 1} more..."
    (expected_results - 1).times do |i|
      if rand(2) == 0
        yellow_score = target
        black_score = rand(target)
      else
        yellow_score = rand(target)
        black_score = target
      end
      results << [yellow_score, black_score]
      puts "📊 Generated Game #{i + 2}: Yellow #{yellow_score} - #{black_score} Black"
    end
  end
  
  # Build result payload (mimics what foos/ client sends)
  result_data = {
    'id' => match_id,
    'results' => results,
    'duration' => 300 + rand(600),  # 5-15 minutes in seconds
    'timestamp' => Time.now.to_i
  }
  
  puts "\n📤 Submitting Result:"
  puts JSON.pretty_generate(result_data)
  
  # Process the result
  begin
    ResultProcessor.parse_result(result_data)
    puts "\n✅ Result processed successfully!"
    
    # Reload match to show updated state
    match = match_repo.get(match_id)
    puts "\n🏆 Match Status:"
    puts "   Status: #{match.status == 2 ? 'Completed' : 'Pending'}"
    puts "   Scores: #{match.scores.inspect}"
    
    if match.win_condition == 'best_of'
      # Calculate winner
      yellow_wins = match.scores.count { |s| s[0] > s[1] }
      black_wins = match.scores.count { |s| s[1] > s[0] }
      winner = yellow_wins > black_wins ? 'Yellow' : 'Black'
      puts "   Winner: #{winner} (#{[yellow_wins, black_wins].max}-#{[yellow_wins, black_wins].min})"
    else
      winner = results[0][0] > results[0][1] ? 'Yellow' : 'Black'
      puts "   Winner: #{winner} (#{results[0][0]}-#{results[0][1]})"
    end
    
  rescue => e
    puts "\n❌ Error processing result: #{e.message}"
    puts e.backtrace.first(5).join("\n")
    exit 1
  end
  
  puts "\n" + "=" * 60
  puts "✅ Simulation Complete!"
  puts "=" * 60
end

# Main execution
if __FILE__ == $0
  if ARGV.empty?
    puts "Usage: ruby simulate_match_result.rb <match_id> [score1] [score2]"
    puts ""
    puts "Examples:"
    puts "  ruby simulate_match_result.rb 1005           # Auto-generate scores"
    puts "  ruby simulate_match_result.rb 1005 5 3       # Yellow wins 5-3"
    puts "  ruby simulate_match_result.rb 1006 3 5       # Black wins 3-5"
    puts ""
    puts "For best-of-3 matches without scores, random games will be generated"
    exit 1
  end
  
  match_id = ARGV[0].to_i
  score1 = ARGV[1]
  score2 = ARGV[2]
  
  simulate_match_result(match_id, score1, score2)
end
