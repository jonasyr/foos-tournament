import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { mockEloHistory, mockRadarData } from "../lib/mockData";
import {
  Trophy,
  Target,
  Flame,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { calculatePlayerStats } from "../lib/statsCalculator";
import { useState, useEffect } from "react";
import { matchApi, playerApi } from "../lib/api";
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
}

export function PlayerProfile() {
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [playersData, matchesData] = await Promise.all([
        playerApi.getAllPlayers(),
        matchApi.getOpenMatches(),
      ]);

      // Transform backend matches to frontend format
      const allMatches: DisplayMatch[] = [];
      matchesData.forEach(division => {
        division.matches.forEach(match => {
          allMatches.push(transformMatch(match, playersData));
        });
      });

      setMatches(allMatches);
    } catch (err: any) {
      console.error('Failed to load player profile data:', err);
      setError(err.message || 'Failed to load profile');
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
      elo: 1500,
    }));

    const blackTeam = match.teams.black.ids.map((id, idx) => ({
      id: String(id),
      name: match.teams.black.names[idx] || 'Unknown',
      elo: 1500,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Failed to Load Profile</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  const playerStats = calculatePlayerStats(matches);
  const player = playerStats[0]; // Top player

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">No Player Data</h3>
            <p className="text-muted-foreground">No player statistics available yet.</p>
          </div>
        </Card>
      </div>
    );
  }
  const winRate =
    player.gamesPlayed > 0
      ? (player.wins / player.gamesPlayed) * 100
      : 0;

  // Calculate streak from recent matches
  const playerMatches = matches
    .filter(
      (m) =>
        m.yellowTeam.some((p) => p.id === player.id) ||
        m.blackTeam.some((p) => p.id === player.id),
    )
    .filter((m) => m.yellowScore >= 10 || m.blackScore >= 10);

  let currentStreak = 0;
  for (let i = playerMatches.length - 1; i >= 0; i--) {
    const match = playerMatches[i];
    const isYellowTeam = match.yellowTeam.some(
      (p) => p.id === player.id,
    );
    const won = isYellowTeam
      ? match.yellowScore > match.blackScore
      : match.blackScore > match.yellowScore;
    if (won) currentStreak++;
    else break;
  }

  // Build match history
  const matchHistory = playerMatches
    .slice(-5)
    .reverse()
    .map((match, i) => {
      const isYellowTeam = match.yellowTeam.some(
        (p) => p.id === player.id,
      );
      const won = isYellowTeam
        ? match.yellowScore > match.blackScore
        : match.blackScore > match.yellowScore;
      const opponent = isYellowTeam
        ? match.blackTeam
        : match.yellowTeam;

      return {
        id: match.id,
        date: match.timestamp,
        opponent: opponent.map((p) => p.name).join(" & "),
        result: won ? "win" : "loss",
        score: `${isYellowTeam ? match.yellowScore : match.blackScore}-${isYellowTeam ? match.blackScore : match.yellowScore}`,
      };
    });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center gap-6"
          >
            <Avatar className="w-24 h-24 md:w-32 md:h-32">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-4xl">
                {getInitials(player.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1>{player.name}</h1>
                <Badge className="bg-gradient-to-r from-primary to-secondary w-fit mx-auto md:mx-0">
                  Rank #1
                </Badge>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="text-3xl font-semibold text-primary">
                  {player.elo}
                </span>
                <span className="text-muted-foreground">
                  ELO Rating
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <div className="mb-2">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-muted"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - winRate / 100)}`}
                      className="text-secondary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-semibold">
                      {winRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
              <h4>Win Rate</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {player.wins}/{player.gamesPlayed} matches
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <div className="mb-2">
                <Target className="w-12 h-12 text-primary mx-auto" />
              </div>
              <div className="text-3xl font-semibold text-primary">
                {player.gamesPlayed}
              </div>
              <h4>Games Played</h4>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <div className="mb-2">
                <Flame
                  className={`w-12 h-12 mx-auto ${currentStreak > 3 ? "text-accent animate-pulse" : "text-muted-foreground"}`}
                />
              </div>
              <div className="text-3xl font-semibold text-accent">
                {currentStreak}
              </div>
              <h4>Current Streak</h4>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="p-4 text-center hover:shadow-lg transition-shadow">
              <div className="mb-2">
                <TrendingUp className="w-12 h-12 text-secondary mx-auto" />
              </div>
              <div className="text-3xl font-semibold text-secondary">
                +{player.wins - player.losses}
              </div>
              <h4>Goal Differential</h4>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* ELO Progression */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="p-6">
              <h3 className="mb-4">ELO Progression</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={mockEloHistory}>
                  <defs>
                    <linearGradient
                      id="colorElo"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3B82F6"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3B82F6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="elo"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorElo)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="p-6">
              <h3 className="mb-4">Performance vs Average</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={mockRadarData}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis
                    dataKey="metric"
                    className="text-xs"
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    className="text-xs"
                  />
                  <Radar
                    name="Player"
                    dataKey="player"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Average"
                    dataKey="average"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.3}
                  />
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Match History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="p-6">
            <h3 className="mb-4">Recent Match History</h3>
            <div className="space-y-3">
              {matchHistory.length > 0 ? (
                matchHistory.map((match, index) => (
                  <div
                    key={match.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary">
                      {match.result === "win" ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <XCircle className="w-6 h-6 text-white" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          vs {match.opponent}
                        </span>
                        <Badge
                          variant={
                            match.result === "win"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            match.result === "win"
                              ? "bg-secondary"
                              : ""
                          }
                        >
                          {match.result === "win" ? "W" : "L"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {match.date}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold">
                        {match.score}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No matches played yet
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}