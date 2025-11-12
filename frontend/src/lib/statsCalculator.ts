import type { Match } from "../App";

export interface PlayerStats {
  id: string;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
}

export function calculatePlayerStats(matches: Match[]): PlayerStats[] {
  // Calculate stats from matches, building player list dynamically
  const statsMap = new Map<string, PlayerStats>();

  // Calculate stats from finished matches
  matches.forEach(match => {
    // Only count finished matches (where someone reached 10 or more points)
    if (match.yellowScore >= 10 || match.blackScore >= 10) {
      const yellowWon = match.yellowScore > match.blackScore;

      // Update yellow team stats
      match.yellowTeam.forEach(player => {
        let stats = statsMap.get(player.id);
        if (!stats) {
          // Create new player entry
          stats = {
            id: player.id,
            name: player.name,
            elo: player.elo || 1500,
            wins: 0,
            losses: 0,
            gamesPlayed: 0,
            goalsFor: 0,
            goalsAgainst: 0,
          };
          statsMap.set(player.id, stats);
        }

        stats.gamesPlayed++;
        stats.goalsFor += match.yellowScore;
        stats.goalsAgainst += match.blackScore;
        if (yellowWon) {
          stats.wins++;
        } else {
          stats.losses++;
        }
      });

      // Update black team stats
      match.blackTeam.forEach(player => {
        let stats = statsMap.get(player.id);
        if (!stats) {
          // Create new player entry
          stats = {
            id: player.id,
            name: player.name,
            elo: player.elo || 1500,
            wins: 0,
            losses: 0,
            gamesPlayed: 0,
            goalsFor: 0,
            goalsAgainst: 0,
          };
          statsMap.set(player.id, stats);
        }

        stats.gamesPlayed++;
        stats.goalsFor += match.blackScore;
        stats.goalsAgainst += match.yellowScore;
        if (!yellowWon) {
          stats.wins++;
        } else {
          stats.losses++;
        }
      });
    }
  });

  return Array.from(statsMap.values()).sort((a, b) => b.elo - a.elo);
}
