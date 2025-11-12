import { useEffect, useState } from "react";
import { MatchCard } from "./MatchCard";
import { FAB } from "./FAB";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Trophy, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { MatchSimulator } from "./MatchSimulator";
import { statsApi, matchApi, playerApi } from "../lib/api";
import type { LeaderboardEntry, OpenMatch, PlayersResponse } from "../lib/types";

interface DashboardProps {
  onCreateMatch: () => void;
}

// Frontend match representation for display
interface DisplayMatch {
  id: string;
  timestamp: string;
  yellowTeam: Array<{ id: string; name: string; elo: number }>;
  blackTeam: Array<{ id: string; name: string; elo: number }>;
  yellowScore: number;
  blackScore: number;
  duration: string;
  isQuickMatch: boolean;
  mode?: string;
  target_score?: number;
}

export function Dashboard({ onCreateMatch }: DashboardProps) {
  const [filter, setFilter] = useState<"all" | "league" | "quick">("all");
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<DisplayMatch | null>(null);
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load players, top players, and open matches in parallel
      const [playersData, leaderboardData, matchesData] = await Promise.all([
        playerApi.getAllPlayers(),
        statsApi.leaderboard('all', 5),
        matchApi.getOpenMatches(),
      ]);

      setTopPlayers(leaderboardData);

      // Transform backend matches to frontend format
      const allMatches: DisplayMatch[] = [];
      matchesData.forEach(division => {
        division.matches.forEach(match => {
          allMatches.push(transformMatch(match, playersData));
        });
      });

      setMatches(allMatches);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Transform backend OpenMatch to frontend DisplayMatch
  function transformMatch(match: OpenMatch, playersData: PlayersResponse): DisplayMatch {
    const yellowTeam = match.teams.yellow.ids.map((id, idx) => ({
      id: String(id),
      name: match.teams.yellow.names[idx] || 'Unknown',
      elo: 1500, // Default ELO
    }));

    const blackTeam = match.teams.black.ids.map((id, idx) => ({
      id: String(id),
      name: match.teams.black.names[idx] || 'Unknown',
      elo: 1500, // Default ELO
    }));

    return {
      id: String(match.id),
      timestamp: 'Pending',
      yellowTeam,
      blackTeam,
      yellowScore: 0,
      blackScore: 0,
      duration: '0m',
      isQuickMatch: match.quick_match,
      mode: match.mode,
      target_score: match.target_score,
    };
  }

  const filteredMatches = matches.filter((match) => {
    if (filter === "league") return !match.isQuickMatch;
    if (filter === "quick") return match.isQuickMatch;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <Trophy className="w-12 h-12 text-destructive mx-auto" />
            <h3 className="text-xl font-semibold">Failed to Load Dashboard</h3>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Make sure the backend server is running on port 4567
            </p>
            <Button onClick={loadData}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              <h1 className="text-3xl md:text-4xl">Fall Championship 2025</h1>
            </div>
            <p className="text-muted-foreground">
              Season runs: Sept 1 - Dec 15, 2025
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid md:grid-cols-[1fr,320px] gap-6">
          {/* Main Content */}
          <div>
            {/* Filter Chips */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                className="rounded-full whitespace-nowrap"
                size="sm"
              >
                All Matches
              </Button>
              <Button
                variant={filter === "league" ? "default" : "outline"}
                onClick={() => setFilter("league")}
                className="rounded-full whitespace-nowrap"
                size="sm"
              >
                League
              </Button>
              <Button
                variant={filter === "quick" ? "default" : "outline"}
                onClick={() => setFilter("quick")}
                className="rounded-full whitespace-nowrap"
                size="sm"
              >
                Quick
              </Button>
            </div>

            {/* Match Cards Grid */}
            {filteredMatches.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Matches Available</h3>
                <p className="text-muted-foreground mb-6">
                  Create a quick match to get started!
                </p>
                <Button onClick={onCreateMatch}>Create Match</Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMatches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <MatchCard
                      {...match}
                      onClick={() => {
                        setSelectedMatch(match);
                        setSimulatorOpen(true);
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Mini Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:block"
          >
            <Card className="p-6 sticky top-20 border border-border bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3>Top Players</h3>
                <Trophy className="w-5 h-5 text-primary" />
              </div>

              {topPlayers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No player data available yet
                </p>
              ) : (
                <div className="space-y-3">
                  {topPlayers.map((player, index) => (
                    <div
                      key={player.player_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.wins}W - {player.games - player.wins}L
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{player.elo}</p>
                        <p className="text-xs text-muted-foreground">ELO</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      <FAB onClick={onCreateMatch} />
      {selectedMatch && (
        <MatchSimulator
          open={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
          match={selectedMatch}
          onUpdateMatch={(updatedMatch) => {
            setMatches(matches.map(m =>
              m.id === updatedMatch.id ? updatedMatch : m
            ));
          }}
        />
      )}
    </div>
  );
}
