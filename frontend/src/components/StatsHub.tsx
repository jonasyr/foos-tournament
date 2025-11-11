import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, Trophy, Flame, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { statsApi } from "../lib/api";
import type { LeaderboardEntry, MatchScope } from "../lib/types";

export function StatsHub() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<MatchScope>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await statsApi.leaderboard(scope, 50);
        setPlayers(data);
      } catch (err: any) {
        console.error('Failed to load stats:', err);
        setError(err.message || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [scope]);

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topPlayers = filteredPlayers.slice(0, 10);
  const hotStreakPlayers = filteredPlayers
    .filter(p => p.win_rate > 0.5 && p.wins > 5)
    .slice(0, 3);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getMedalIcon = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return position;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading statistics...</p>
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
            <h3 className="text-xl font-semibold">Failed to Load Statistics</h3>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Make sure the backend server is running on port 4567
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              <h1>Statistics Hub</h1>
            </div>
            <p className="text-muted-foreground">
              Complete rankings and player statistics
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Filter Bar */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={scope} onValueChange={(v) => setScope(v as MatchScope)}>
              <SelectTrigger>
                <SelectValue placeholder="Match Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                <SelectItem value="league">League Only</SelectItem>
                <SelectItem value="quick">Quick Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Hot Streaks Widget */}
        {hotStreakPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-6 h-6 text-accent animate-pulse" />
                <h3>Hot Streaks</h3>
                <Badge className="bg-accent">Live</Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {hotStreakPlayers.map((player) => (
                  <div
                    key={player.player_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-accent/30"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-br from-accent to-accent/60 text-white">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4>{player.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {player.wins} wins 🔥
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Global Leaderboard</h3>
            </div>

            {topPlayers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No players found matching your criteria
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2">Rank</th>
                        <th className="text-left py-3 px-2">Player</th>
                        <th className="text-center py-3 px-2">Games</th>
                        <th className="text-center py-3 px-2">Win Rate</th>
                        <th className="text-center py-3 px-2">Record</th>
                        <th className="text-right py-3 px-2">ELO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPlayers.map((player, index) => (
                        <motion.tr
                          key={player.player_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getMedalIcon(index + 1)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                                  {getInitials(player.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold">{player.name}</span>
                            </div>
                          </td>
                          <td className="text-center py-4 px-2">
                            {player.games}
                          </td>
                          <td className="text-center py-4 px-2">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold">
                                {(player.win_rate * 100).toFixed(0)}%
                              </span>
                              <Progress
                                value={player.win_rate * 100}
                                className="w-16 h-1"
                              />
                            </div>
                          </td>
                          <td className="text-center py-4 px-2">
                            <Badge variant="outline">
                              {player.wins}W - {player.games - player.wins}L
                            </Badge>
                          </td>
                          <td className="text-right py-4 px-2">
                            <span className="text-xl font-semibold text-primary">
                              {player.elo}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {topPlayers.map((player, index) => (
                    <motion.div
                      key={player.player_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getMedalIcon(index + 1)}</span>
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                              {getInitials(player.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4>{player.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {player.games} games played
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-semibold text-primary">
                              {player.elo}
                            </div>
                            <div className="text-xs text-muted-foreground">ELO</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                          <div>
                            <p className="text-xs text-muted-foreground">Win Rate</p>
                            <p className="font-semibold">
                              {(player.win_rate * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Record</p>
                            <p className="font-semibold">
                              {player.wins}W - {player.games - player.wins}L
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
