import { MatchCard } from "./MatchCard";
import { FAB } from "./FAB";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Trophy, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import { useState } from "react";
import { MatchSimulator } from "./MatchSimulator";
import type { Match } from "../App";
import { calculatePlayerStats } from "../lib/statsCalculator";

interface DashboardProps {
  onCreateMatch: () => void;
  matches: Match[];
  onUpdateMatch: (match: Match) => void;
}

export function Dashboard({ onCreateMatch, matches, onUpdateMatch }: DashboardProps) {
  const [filter, setFilter] = useState<"all" | "league" | "quick">("all");
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const filteredMatches = matches.filter((match) => {
    if (filter === "league") return !match.isQuickMatch;
    if (filter === "quick") return match.isQuickMatch;
    return true;
  });

  const playerStats = calculatePlayerStats(matches);
  const topPlayers = playerStats.slice(0, 5);

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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <MatchCard {...match} onClick={() => {
                    setSelectedMatch(match);
                    setSimulatorOpen(true);
                  }} />
                </motion.div>
              ))}
            </div>
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

              <div className="space-y-3">
                {topPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.wins}W - {player.losses}L
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{player.elo}</p>
                      <p className="text-xs text-muted-foreground">ELO</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Mobile Leaderboard - Bottom Section */}
          <div className="md:hidden">
            <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3>Top Players</h3>
                <Trophy className="w-5 h-5 text-primary" />
              </div>

              <div className="space-y-3">
                {topPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p>{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.wins}W - {player.losses}L
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{player.elo}</p>
                      <p className="text-xs text-muted-foreground">ELO</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <FAB onClick={onCreateMatch} />
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
