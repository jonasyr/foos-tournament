require_relative 'test_helper'

describe 'serialize_open_match for singles quick match' do
  before do
    @match_repo = MatchRepository.new
    @player_repo = PlayerRepository.new
    
    # Create test players
    @player1 = create_test_player('Alice')
    @player2 = create_test_player('Bob')
    
    # Create a singles quick match (player1 vs player2)
    # For singles: [p1, nil, p2, nil]
    @match = @match_repo.create_quick_match(
      division_id: 1,
      players: [@player1.id, nil, @player2.id, nil],
      mode: 'singles',
      win_condition: 'score_limit',
      target_score: 5
    )
    
    # Build players_by_id hash
    @players_by_id = {
      @player1.id => @player1,
      @player2.id => @player2
    }
  end
  
  it 'generates submatches with single-element arrays for each team' do
    result = serialize_open_match(@match, @players_by_id)
    
    # Assert submatches structure: [[[p1], [p2]]]
    assert_equal 1, result[:submatches].length, 
      'Singles match should have 1 submatch'
    
    submatch = result[:submatches][0]
    assert_equal 2, submatch.length,
      'Submatch should have 2 teams'
    
    # Yellow team (position 0-1, only position 0 filled)
    assert_equal ['Alice'], submatch[0],
      'Yellow team should contain only Alice'
    
    # Black team (position 2-3, only position 2 filled)
    assert_equal ['Bob'], submatch[1],
      'Black team should contain only Bob'
  end
  
  it 'marks the match as quick_match' do
    result = serialize_open_match(@match, @players_by_id)
    
    assert_equal true, result[:quick_match],
      'Match should be marked as quick_match'
  end
  
  it 'includes mode as singles' do
    result = serialize_open_match(@match, @players_by_id)
    
    assert_equal 'singles', result[:mode],
      'Match mode should be singles'
  end
  
  it 'includes target_score' do
    result = serialize_open_match(@match, @players_by_id)
    
    assert_equal 5, result[:target_score],
      'Target score should be 5'
  end
end
