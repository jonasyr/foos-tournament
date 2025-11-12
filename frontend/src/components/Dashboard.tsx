import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
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

export interface DashboardHandle {
  refresh: () => void;
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

export const Dashboard = forwardRef<DashboardHandle, DashboardProps>(({ onCreateMatch }, ref) => {
  const [filter, setFilter] = useState<"all" | "league" | "quick">("all");
  const [viewMode, setViewMode] = useState<"open" | "completed">("open");
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

      // Load players and top players
      const [playersData, leaderboardData] = await Promise.all([
        playerApi.getAllPlayers(),
        statsApi.leaderboard('all', 5),
      ]);

      setTopPlayers(leaderboardData);

      // Load matches based on view mode
      let matchesData;
      if (viewMode === "open") {
        matchesData = await matchApi.getOpenMatches();
      } else {
        matchesData = await matchApi.getPlayedMatches();
      }

      // Transform backend matches to frontend format
      const allMatches: DisplayMatch[] = [];
      matchesData.forEach(division => {
        division.matches.forEach(match => {
          allMatches.push(transformMatch(match, playersData, viewMode === "completed"));
        });
      });

      // If completed view, limit to last 10 matches
      const displayMatches = viewMode === "completed"
        ? allMatches.slice(-10).reverse()
        : allMatches;

      setMatches(displayMatches);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Expose loadData to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: loadData
  }));

  useEffect(() => {
    loadData();
  }, [viewMode]); // Reload when view mode changes

  // Transform backend OpenMatch to frontend DisplayMatch
  function transformMatch(match: OpenMatch, playersData: PlayersResponse, played: boolean): DisplayMatch {
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

    // For played matches, extract scores from submatches
    let yellowScore = 0;
    let blackScore = 0;
    if (played && match.submatches && match.submatches.length > 0) {
      // Get the final score from the last submatch
      const lastSubmatch = match.submatches[match.submatches.length - 1];
      if (lastSubmatch.scores && lastSubmatch.scores.length > 0) {
        const finalScore = lastSubmatch.scores[lastSubmatch.scores.length - 1];
        yellowScore = finalScore[0] || 0;
        blackScore = finalScore[1] || 0;
      }
    }

    return {
      id: String(match.id),
      timestamp: played ? 'Completed' : 'Pending',
      yellowTeam,
      blackTeam,
      yellowScore,
      blackScore,
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
            {/* View Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button
                  variant={viewMode === "open" ? "default" : "outline"}
                  onClick={() => setViewMode("open")}
                  className="rounded-full whitespace-nowrap"
                  size="sm"
                >
                  Open Matches
                </Button>
                <Button
                  variant={viewMode === "completed" ? "default" : "outline"}
                  onClick={() => setViewMode("completed")}
                  className="rounded-full whitespace-nowrap"
                  size="sm"
                >
                  Recent Completed
                </Button>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  className="rounded-full whitespace-nowrap"
                  size="sm"
                >
                  All
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
          onResultSubmitted={loadData}
        />
      )}
    </div>
  );
});
