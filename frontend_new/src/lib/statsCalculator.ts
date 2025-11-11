import { mockPlayers } from "./mockData";
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
  // Start with mock players as base
  const statsMap = new Map<string, PlayerStats>();
  
  mockPlayers.forEach(player => {
    statsMap.set(player.id, {
      id: player.id,
      name: player.name,
      elo: player.elo,
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
  });

  // Calculate stats from finished matches
  matches.forEach(match => {
    // Only count finished matches (where someone reached 10 or more points)
    if (match.yellowScore >= 10 || match.blackScore >= 10) {
      const yellowWon = match.yellowScore > match.blackScore;
      
      // Update yellow team stats
      match.yellowTeam.forEach(player => {
        const stats = statsMap.get(player.id);
        if (stats) {
          stats.gamesPlayed++;
          stats.goalsFor += match.yellowScore;
          stats.goalsAgainst += match.blackScore;
          if (yellowWon) {
            stats.wins++;
            stats.elo += 15;
          } else {
            stats.losses++;
            stats.elo -= 10;
          }
        }
      });

      // Update black team stats
      match.blackTeam.forEach(player => {
        const stats = statsMap.get(player.id);
        if (stats) {
          stats.gamesPlayed++;
          stats.goalsFor += match.blackScore;
          stats.goalsAgainst += match.yellowScore;
          if (!yellowWon) {
            stats.wins++;
            stats.elo += 15;
          } else {
            stats.losses++;
            stats.elo -= 10;
          }
        }
      });
    }
  });

  return Array.from(statsMap.values()).sort((a, b) => b.elo - a.elo);
}

export function getPlayerById(playerId: string): PlayerStats {
  const player = mockPlayers.find(p => p.id === playerId);
  return {
    id: player?.id || playerId,
    name: player?.name || "Unknown",
    elo: player?.elo || 1500,
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };
}
