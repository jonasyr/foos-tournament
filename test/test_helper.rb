require 'minitest/autorun'
require 'minitest/spec'
require_relative '../web_router'
require_relative '../match_repository'
require_relative '../player_repository'
require_relative '../division_repository'

# Set up test database
ENV['RACK_ENV'] = 'test'

# Helper method to create a test player
def create_test_player(name, nick = nil)
  player_repo = PlayerRepository.new
  nick = nick || name[0..2].upcase  # Default nick is first 3 letters
  player = Player.new(nil, name, nick)
  player_repo.add(player)
  # Return the player with ID assigned
  player
end

# Helper method to create a test division
def create_test_division(name)
  DivisionRepository.new.create(name: name, season_id: 1)
end

# Clean up database between tests
class Minitest::Test
  def setup
    # Create a clean test environment if needed
  end
  
  def teardown
    # Clean up after tests if needed
  end
end
