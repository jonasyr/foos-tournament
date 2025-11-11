import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PlayerCard } from "./PlayerCard";
import { MatchCard } from "./MatchCard";
import { Card } from "./ui/card";
import { mockDivisions } from "../lib/mockData";
import { Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type { Match } from "../App";
import { useState } from "react";
import { MatchSimulator } from "./MatchSimulator";
import { calculatePlayerStats } from "../lib/statsCalculator";

interface DivisionViewProps {
  matches: Match[];
  onUpdateMatch: (match: Match) => void;
}

export function DivisionView({ matches, onUpdateMatch }: DivisionViewProps) {
  const division = mockDivisions[0];
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Filter league matches only
  const leagueMatches = matches.filter(m => !m.isQuickMatch);
  
  const pendingMatches = leagueMatches.filter(m => m.yellowScore === 0 && m.blackScore === 0);
  const playingMatches = leagueMatches.filter(m => (m.yellowScore > 0 || m.blackScore > 0) && m.yellowScore < 10 && m.blackScore < 10);
  const finishedMatches = leagueMatches.filter(m => m.yellowScore >= 10 || m.blackScore >= 10);

  const playerStats = calculatePlayerStats(matches);

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
                  <h1>{division.name}</h1>
                  <Badge className="bg-gradient-to-r from-primary to-secondary">
                    {division.level}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Round {division.currentRound} of {division.totalRounds}
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
          onUpdateMatch={onUpdateMatch}
        />
      )}
    </div>
  );
}
