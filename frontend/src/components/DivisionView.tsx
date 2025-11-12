import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PlayerCard } from "./PlayerCard";
import { MatchCard } from "./MatchCard";
import { Card } from "./ui/card";
import { Loader2, Zap } from "lucide-react";
import { motion } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useState, useEffect } from "react";
import { MatchSimulator } from "./MatchSimulator";
import { calculatePlayerStats } from "../lib/statsCalculator";
import { matchApi, playerApi, statsApi } from "../lib/api";
import type { OpenMatch, PlayersResponse } from "../lib/types";

// DisplayMatch interface - matches Dashboard's structure
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
  played?: boolean;
}

interface Division {
  id: number;
  name: string;
  level: string;
  currentRound: number;
  totalRounds: number;
}

export function DivisionView() {
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<DisplayMatch | null>(null);
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [division, setDivision] = useState<Division | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [playersData, openMatchesData, playedMatchesData] = await Promise.all([
        playerApi.getAllPlayers(),
        matchApi.getOpenMatches(),
        matchApi.getPlayedMatches(),
      ]);

      // Transform backend matches to frontend format
      const allMatches: DisplayMatch[] = [];

      // Add open matches
      openMatchesData.forEach(divisionData => {
        // Set division info from first division with matches
        if (!division && divisionData.matches.length > 0) {
          setDivision({
            id: divisionData.division_id,
            name: divisionData.name,
            level: 'Premier', // Default since backend doesn't provide this
            currentRound: 1, // Default
            totalRounds: 10, // Default
          });
        }

        divisionData.matches.forEach(match => {
          allMatches.push(transformMatch(match, playersData, false));
        });
      });

      // Add played (completed) matches
      playedMatchesData.forEach(divisionData => {
        divisionData.matches.forEach(match => {
          allMatches.push(transformMatch(match, playersData, true));
        });
      });

      setMatches(allMatches);
    } catch (err: any) {
      console.error('Failed to load division data:', err);
      setError(err.message || 'Failed to load division');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Transform backend OpenMatch to frontend DisplayMatch
  function transformMatch(match: OpenMatch, playersData: PlayersResponse, played: boolean): DisplayMatch {
    const yellowTeam = match.teams.yellow.ids.map((id, idx) => ({
      id: String(id),
      name: match.teams.yellow.names[idx] || 'Unknown',
      elo: 1500,
    }));

    const blackTeam = match.teams.black.ids.map((id, idx) => ({
      id: String(id),
      name: match.teams.black.names[idx] || 'Unknown',
      elo: 1500,
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
      played,
    };
  }

  // Filter league matches only
  const leagueMatches = matches.filter(m => !m.isQuickMatch);

  const pendingMatches = leagueMatches.filter(m => m.yellowScore === 0 && m.blackScore === 0);
  const playingMatches = leagueMatches.filter(m => (m.yellowScore > 0 || m.blackScore > 0) && m.yellowScore < 10 && m.blackScore < 10);
  const finishedMatches = leagueMatches.filter(m => m.yellowScore >= 10 || m.blackScore >= 10);

  const playerStats = calculatePlayerStats(matches);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading division data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Failed to Load Division</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Default division data if none is found
  const displayDivision = division || {
    id: 1,
    name: 'League Division',
    level: 'Premier',
    currentRound: 1,
    totalRounds: 10,
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-b border-border sticky top-[57px] md:top-[73px] z-40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1>{displayDivision.name}</h1>
                  <Badge className="bg-gradient-to-r from-primary to-secondary">
                    {displayDivision.level}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Round {displayDivision.currentRound} of {displayDivision.totalRounds}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
          </TabsList>

          {/* Standings Tab */}
          <TabsContent value="standings" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3>League Standings</h3>
              <Select defaultValue="points">
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Sort by Points</SelectItem>
                  <SelectItem value="wins">Sort by Wins</SelectItem>
                  <SelectItem value="winrate">Sort by Win Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {playerStats.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <PlayerCard
                    position={index + 1}
                    name={player.name}
                    points={player.elo}
                    wins={player.wins}
                    losses={player.losses}
                    positionChange={
                      index < 2 ? "up" : index > 5 ? "down" : "same"
                    }
                  />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Pending */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                  <h4>Pending</h4>
                  <Badge variant="secondary">{pendingMatches.length}</Badge>
                </div>
                <div className="space-y-4">
                  {pendingMatches.map((match) => (
                    <Card
                      key={match.id}
                      className="p-4 border-l-4 border-l-accent"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          Scheduled
                        </span>
                        {match.isQuickMatch && (
                          <Badge variant="secondary" className="gap-1">
                            <Zap className="w-3 h-3" />
                            Quick
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-accent"></div>
                          <span className="text-sm">
                            {match.yellowTeam.map((p) => p.name).join(", ")}
                          </span>
                        </div>
                        <div className="text-center text-xs text-muted-foreground">
                          vs
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-foreground"></div>
                          <span className="text-sm">
                            {match.blackTeam.map((p) => p.name).join(", ")}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Playing */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                  <h4>Playing</h4>
                  <Badge variant="secondary">{playingMatches.length}</Badge>
                </div>
                <div className="space-y-4">
                  {playingMatches.map((match) => (
                    <Card
                      key={match.id}
                      className="p-4 border-l-4 border-l-secondary"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          Live
                        </span>
                        {match.isQuickMatch && (
                          <Badge variant="secondary" className="gap-1">
                            <Zap className="w-3 h-3" />
                            Quick
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded bg-accent/10">
                          <span className="text-sm">
                            {match.yellowTeam.map((p) => p.name).join(", ")}
                          </span>
                          <span className="font-semibold">{match.yellowScore}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                          <span className="text-sm">
                            {match.blackTeam.map((p) => p.name).join(", ")}
                          </span>
                          <span className="font-semibold">{match.blackScore}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Finished */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <h4>Finished</h4>
                  <Badge variant="secondary">{finishedMatches.length}</Badge>
                </div>
                <div className="space-y-4">
                  {finishedMatches.map((match) => (
                    <MatchCard key={match.id} {...match} />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playerStats.map((player, index) => (
                <Card key={player.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                      {player.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4>{player.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Rank #{index + 1}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xl font-semibold text-primary">
                        {player.elo}
                      </div>
                      <div className="text-xs text-muted-foreground">ELO</div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-secondary">
                        {player.wins}
                      </div>
                      <div className="text-xs text-muted-foreground">Wins</div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold">
                        {player.gamesPlayed > 0 ? ((player.wins / player.gamesPlayed) * 100).toFixed(0) : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
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
}
