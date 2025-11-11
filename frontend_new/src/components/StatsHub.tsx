import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, Trophy, Medal, Flame, Users } from "lucide-react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Progress } from "./ui/progress";
import type { Match } from "../App";
import { calculatePlayerStats } from "../lib/statsCalculator";

interface StatsHubProps {
  matches: Match[];
}

export function StatsHub({ matches }: StatsHubProps) {
  const playerStats = calculatePlayerStats(matches);
  const topPlayers = playerStats.slice(0, 10);
  const hotStreakPlayers = playerStats.filter(p => p.wins > p.losses).slice(0, 3);
  
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  className="pl-10"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
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
              {hotStreakPlayers.map((player, index) => (
                <div
                  key={player.id}
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

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Global Leaderboard</h3>
              <Select defaultValue="elo">
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elo">Sort by ELO</SelectItem>
                  <SelectItem value="wins">Sort by Wins</SelectItem>
                  <SelectItem value="winrate">Sort by Win Rate</SelectItem>
                  <SelectItem value="games">Sort by Games</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                      key={player.id}
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
                        {player.gamesPlayed}
                      </td>
                      <td className="text-center py-4 px-2">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold">
                            {player.gamesPlayed > 0 ? ((player.wins / player.gamesPlayed) * 100).toFixed(0) : 0}%
                          </span>
                          <Progress
                            value={player.gamesPlayed > 0 ? (player.wins / player.gamesPlayed) * 100 : 0}
                            className="w-16 h-1"
                          />
                        </div>
                      </td>
                      <td className="text-center py-4 px-2">
                        <Badge variant="outline">
                          {player.wins}W - {player.losses}L
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
                  key={player.id}
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
                          {player.gamesPlayed} games played
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
                          {player.gamesPlayed > 0 ? ((player.wins / player.gamesPlayed) * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Record</p>
                        <p className="font-semibold">
                          {player.wins}W - {player.losses}L
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Partnership Chemistry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-secondary" />
              <h3>Best Partnerships</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { p1: playerStats[0], p2: playerStats[1], wins: 15, games: 18 },
                { p1: playerStats[2], p2: playerStats[3], wins: 12, games: 16 },
                { p1: playerStats[4], p2: playerStats[5], wins: 10, games: 15 },
                { p1: playerStats[6], p2: playerStats[7], wins: 8, games: 12 },
              ].filter(p => p.p1 && p.p2).map((partnership, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex -space-x-3">
                    <Avatar className="w-12 h-12 border-2 border-card">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                        {getInitials(partnership.p1.name)}
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="w-12 h-12 border-2 border-card">
                      <AvatarFallback className="bg-gradient-to-br from-secondary to-accent text-white">
                        {getInitials(partnership.p2.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm">
                      {partnership.p1.name} & {partnership.p2.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {partnership.wins}W - {partnership.games - partnership.wins}L
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-semibold text-secondary">
                      {((partnership.wins / partnership.games) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
