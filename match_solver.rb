# Heuristic solver that generates fair match combinations for a round.
#
# The solver explores random solutions and hill-climbs to a local optimum while
# respecting the one-to-one confrontation matrix passed in by
# {MatchAssigner#assign_matches}. The algorithm avoids repeated pairings within
# the same round and attempts to minimise imbalance in player confrontations.
class Solver

  @debug = false

  @@max_attempts = 20

  @@scores_nplayed = {
    0 => 0,
    1 => 1000,
    2 => 600,
    3 => 400,
    4 => 300,
    5 => 200,
    6 => 100,
  }

  # @param one2one [Hash{Integer=>Hash{Integer=>Integer}}] confrontation matrix
  #   describing how many times each pair of players has faced each other
  def initialize(one2one)
    @one2one = one2one
  end

  # Returns the heuristic score for a number of confrontations.
  #
  # @param confrontations [Integer]
  # @return [Integer]
  def get_one2one_score(confrontations)
    if @@scores_nplayed.key?(confrontations)
      return @@scores_nplayed[confrontations]
    else
      return 0
    end
  end

  # Computes the score of a proposed match based on confrontation history.
  #
  # @param players [Array<Integer>] four player identifiers forming a match
  # @param one2one [Hash] confrontation matrix
  # @param one2one_diff [Hash] temporary adjustments for local search
  # @return [Integer] accumulated score favouring less frequent pairings
  def match_score(players, one2one, one2one_diff = {})
    score = 0
    for p in 0..2
      player = players[p]
      for r in p+1..3
        rival = players[r]
        confrontations = one2one[player][rival]
        if one2one_diff.include?(player) and one2one_diff[player].include?(rival)
          confrontations += one2one_diff[player][rival]
        end
        score += get_one2one_score(confrontations)
      end
    end
    return score
  end

  # Builds a random, valid solution without duplicate players per match.
  #
  # @param player_list [Array<Integer>]
  # @return [Array<Integer>] flattened list of players grouped by four
  # @raise [RuntimeError] if no valid combination is found after many attempts
  def get_random_solution(player_list)
    nmatches = player_list.length / 4
    for i in 0..500000
      solution = player_list.shuffle
      wrong = false
      for m in 0...nmatches
        players = solution[m*4..m*4+3]
        if players.uniq.length < 4
          wrong = true
        end
      end
      if wrong == false
        return solution
      end
    end
    raise 'Too many attempts to find a random solution with no repeated players'
  end

  # Searches for a near-optimal arrangement of players into matches.
  #
  # The solver starts from random shuffles and iteratively improves the
  # configuration via neighbour swaps while keeping track of the best score.
  #
  # @param player_list [Array<Integer>] flattened list of players (multiple of 4)
  # @return [Array<Integer>, Integer, Hash] best solution, score, and resulting
  #   confrontation matrix
  # @raise [RuntimeError] if the player list size is not divisible by four or if
  #   no feasible solution exists
  def solve(player_list)
    if player_list.length % 4 != 0
      raise 'The list of players to solve a solution is not multiple of 4'
    end

    nmatches = player_list.length / 4

    attempts = 1
    while attempts <= @@max_attempts
      begin
        solution = get_random_solution(player_list)
      rescue Exception => e
        raise 'No possible solution with this combination of players'
      end
      one2one = Marshal.load(Marshal.dump(@one2one))
      for m in 0...nmatches
        players = solution[m*4..m*4+3]
        pl1 = players[0]
        pl2 = players[1]
        pl3 = players[2]
        pl4 = players[3]
    	one2one[pl1][pl2] += 1
    	one2one[pl1][pl3] += 1
    	one2one[pl1][pl4] += 1
    	one2one[pl2][pl1] += 1
    	one2one[pl2][pl3] += 1
    	one2one[pl2][pl4] += 1
    	one2one[pl3][pl1] += 1
    	one2one[pl3][pl2] += 1
    	one2one[pl3][pl4] += 1
    	one2one[pl4][pl1] += 1
    	one2one[pl4][pl2] += 1
    	one2one[pl4][pl3] += 1
      end
      score = 0
      for m in 0...nmatches
        players = solution[m*4..m*4+3]
        score += match_score(players, one2one)
      end

      if attempts == 1
        best_solution = solution.dup
        best_score = score
        best_one2one = Marshal.load(Marshal.dump(one2one))
        puts "Initial random solution with score #{score}" if @debug
      else
        puts "Shuffling for a new random solution" if @debug
      end

      while true

        found_best = false

        for match_to_change1 in (0...nmatches).to_a.shuffle
          orig_match1 = solution[match_to_change1*4..match_to_change1*4+3]
          for match_to_change2 in ((0...nmatches).to_a - [match_to_change1]).shuffle
            orig_match2 = solution[match_to_change2*4..match_to_change2*4+3]
            for position_to_swap1 in (0..3).to_a.shuffle
              player_to_swap1 = orig_match1[position_to_swap1]
              if orig_match2.include?(player_to_swap1)
                next
              end
              for position_to_swap2 in (0..3).to_a.shuffle
                player_to_swap2 = orig_match2[position_to_swap2]
                if orig_match1.include?(player_to_swap2)
                  next
                end
                new_solution = solution.dup
                position1 = match_to_change1*4 + position_to_swap1
                position2 = match_to_change2*4 + position_to_swap2
                new_solution[position1] = player_to_swap2
                new_solution[position2] = player_to_swap1

                one2one_diff = {}
                for p in orig_match1 + orig_match2
                  one2one_diff[p] = {}
                  for q in orig_match1 + orig_match2
                    one2one_diff[p][q] = 0
                  end
                end

                for r in 0..3
                  if r != position_to_swap1
                    rival = orig_match1[r]
                    one2one_diff[player_to_swap1][rival] -= 1
                    one2one_diff[rival][player_to_swap1] -= 1
                    one2one_diff[player_to_swap2][rival] += 1
                    one2one_diff[rival][player_to_swap2] += 1
                  end
                  if r != position_to_swap2
                    rival = orig_match2[r]
                    one2one_diff[player_to_swap2][rival] -= 1
                    one2one_diff[rival][player_to_swap2] -= 1
                    one2one_diff[player_to_swap1][rival] += 1
                    one2one_diff[rival][player_to_swap1] += 1
                  end
                end

                new_score = 0
                for m in 0...nmatches
                  players = new_solution[m*4..m*4+3]
                  new_score += match_score(players, one2one, one2one_diff)
                end

                if new_score > score
                  found_best = true
                  break
                end
              end
              break if found_best
            end
            break if found_best
          end
          break if found_best
        end

        if not found_best
          puts "No best neighbour, found a local maximum" if @debug
          break
        end

        score = new_score
        solution = new_solution
        for p in 0..3
          if p != position_to_swap1
            rival = orig_match1[p]
            one2one[player_to_swap1][rival] -= 1
            one2one[rival][player_to_swap1] -= 1
            one2one[player_to_swap2][rival] += 1
            one2one[rival][player_to_swap2] += 1
          end
          if p != position_to_swap2
            rival = orig_match2[p]
            one2one[player_to_swap2][rival] -= 1
            one2one[rival][player_to_swap2] -= 1
            one2one[player_to_swap1][rival] += 1
            one2one[rival][player_to_swap1] += 1
          end
        end

        if score > best_score
          best_solution = solution.dup
          best_score = score
          best_one2one = Marshal.load(Marshal.dump(one2one))
          puts "Found a better solution (score #{best_score})" if @debug
        end

      end

      attempts += 1

    end

    puts "Score for the best solution is #{best_score}" if @debug
    return best_solution, best_score, best_one2one
  end

end
