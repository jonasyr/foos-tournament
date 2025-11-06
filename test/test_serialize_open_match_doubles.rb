require_relative 'test_helper'

describe 'serialize_open_match for doubles quick match' do
  before do
    @match_repo = MatchRepository.new
    @player_repo = PlayerRepository.new
    
    # Create test players
    @player1 = create_test_player('Alice')
    @player2 = create_test_player('Bob')
    @player3 = create_test_player('Carol')
    @player4 = create_test_player('Dave')
    
    # Create a doubles quick match (player1+player2 vs player3+player4)
    @match = @match_repo.create_quick_match(
      division_id: 1,
      players: [@player1.id, @player2.id, @player3.id, @player4.id],
      mode: 'doubles',
      win_condition: 'score_limit',
      target_score: 10
    )
    
    # Build players_by_id hash
    @players_by_id = {
      @player1.id => @player1,
      @player2.id => @player2,
      @player3.id => @player3,
      @player4.id => @player4
    }
  end
  
  it 'generates submatches with two-element arrays for each team' do
    result = serialize_open_match(@match, @players_by_id)
    
    # Assert submatches structure: [[[p1,p2], [p3,p4]]]
    assert_equal 1, result[:submatches].length,
      'Doubles match should have 1 submatch'
    
    submatch = result[:submatches][0]
    assert_equal 2, submatch.length,
      'Submatch should have 2 teams'
    
    # Yellow team (positions 0-1)
    assert_equal ['Alice', 'Bob'], submatch[0],
      'Yellow team should contain Alice and Bob'
    
    # Black team (positions 2-3)
    assert_equal ['Carol', 'Dave'], submatch[1],
      'Black team should contain Carol and Dave'
  end
  
  it 'marks the match as quick_match' do
    result = serialize_open_match(@match, @players_by_id)
    
    assert_equal true, result[:quick_match],
      'Match should be marked as quick_match'
  end
  
  it 'includes mode as doubles' do
    result = serialize_open_match(@match, @players_by_id)
    
    assert_equal 'doubles', result[:mode],
      'Match mode should be doubles'
  end
  
  it 'includes target_score' do
    result = serialize_open_match(@match, @players_by_id)
    
    assert_equal 10, result[:target_score],
      'Target score should be 10'
  end
  
  it 'includes player_ids in correct positions' do
    result = serialize_open_match(@match, @players_by_id)
    
    assert_equal [@player1.id, @player2.id, @player3.id, @player4.id], 
      result[:player_ids],
      'Player IDs should be in the correct order'
  end
end
