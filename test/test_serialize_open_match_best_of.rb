require_relative 'test_helper'

describe 'serialize_open_match for best-of-3 quick match' do
  before do
    @match_repo = MatchRepository.new
    @player_repo = PlayerRepository.new
    
    # Create test players
    @player1 = create_test_player('Alice')
    @player2 = create_test_player('Bob')
    @player3 = create_test_player('Carol')
    @player4 = create_test_player('Dave')
    
    # Create a best-of-3 doubles quick match
    @match_doubles = @match_repo.create_quick_match(
      division_id: 1,
      players: [@player1.id, @player2.id, @player3.id, @player4.id],
      mode: 'doubles',
      win_condition: 'best_of',
      target_score: 5
    )
    
    # Create a best-of-3 singles quick match
    @match_singles = @match_repo.create_quick_match(
      division_id: 1,
      players: [@player1.id, nil, @player2.id, nil],
      mode: 'singles',
      win_condition: 'best_of',
      target_score: 5
    )
    
    # Build players_by_id hash
    @players_by_id = {
      @player1.id => @player1,
      @player2.id => @player2,
      @player3.id => @player3,
      @player4.id => @player4
    }
  end
  
  it 'generates 3 submatches for best-of-3 doubles match' do
    result = serialize_open_match(@match_doubles, @players_by_id)
    
    # Assert submatches length
    assert_equal 3, result[:submatches].length,
      'Best-of-3 match should have 3 submatches'
    
    # Verify each submatch has the same structure
    result[:submatches].each_with_index do |submatch, index|
      assert_equal 2, submatch.length,
        "Submatch #{index + 1} should have 2 teams"
      
      assert_equal ['Alice', 'Bob'], submatch[0],
        "Submatch #{index + 1} yellow team should contain Alice and Bob"
      
      assert_equal ['Carol', 'Dave'], submatch[1],
        "Submatch #{index + 1} black team should contain Carol and Dave"
    end
  end
  
  it 'generates 3 submatches for best-of-3 singles match' do
    result = serialize_open_match(@match_singles, @players_by_id)
    
    # Assert submatches length
    assert_equal 3, result[:submatches].length,
      'Best-of-3 singles match should have 3 submatches'
    
    # Verify each submatch has the singles structure
    result[:submatches].each_with_index do |submatch, index|
      assert_equal 2, submatch.length,
        "Submatch #{index + 1} should have 2 teams"
      
      assert_equal ['Alice'], submatch[0],
        "Submatch #{index + 1} yellow team should contain only Alice"
      
      assert_equal ['Bob'], submatch[1],
        "Submatch #{index + 1} black team should contain only Bob"
    end
  end
  
  it 'marks match as quick_match' do
    result = serialize_open_match(@match_doubles, @players_by_id)
    
    assert_equal true, result[:quick_match],
      'Match should be marked as quick_match'
  end
  
  it 'includes target_score' do
    result = serialize_open_match(@match_doubles, @players_by_id)
    
    assert_equal 5, result[:target_score],
      'Target score should be 5'
  end
  
  it 'all submatches are identical' do
    result = serialize_open_match(@match_doubles, @players_by_id)
    
    # All three submatches should be identical
    first_submatch = result[:submatches][0]
    
    result[:submatches].each_with_index do |submatch, index|
      assert_equal first_submatch, submatch,
        "Submatch #{index + 1} should be identical to submatch 1"
    end
  end
end
