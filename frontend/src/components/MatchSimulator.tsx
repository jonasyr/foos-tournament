import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, CheckCircle, ArrowUp, ArrowDown } from "lucide-react";
import { mockPlayers } from "../lib/mockData";
import { Separator } from "./ui/separator";
import type { Match } from "../App";

interface MatchSimulatorProps {
  open: boolean;
  onClose: () => void;
  match: Match;
  onUpdateMatch: (match: Match) => void;
}

export function MatchSimulator({ open, onClose, match, onUpdateMatch }: MatchSimulatorProps) {
  const [yellowScore, setYellowScore] = useState(match.yellowScore);
  const [blackScore, setBlackScore] = useState(match.blackScore);

  // Reset scores when match changes
  useEffect(() => {
    setYellowScore(match.yellowScore);
    setBlackScore(match.blackScore);
  }, [match.id]);

  const yellowPlayers = match.yellowTeam;
  const blackPlayers = match.blackTeam;

  const incrementYellow = () => setYellowScore((prev) => Math.min(prev + 1, 50));
  const decrementYellow = () => setYellowScore((prev) => Math.max(prev - 1, 0));
  const incrementBlack = () => setBlackScore((prev) => Math.min(prev + 1, 50));
  const decrementBlack = () => setBlackScore((prev) => Math.max(prev - 1, 0));

  const setYellowWin = () => {
    setYellowScore(10);
    setBlackScore(0);
  };

  const setBlackWin = () => {
    setBlackScore(10);
    setYellowScore(0);
  };

  // Simulate standings based on score
  const allPlayers = [...yellowPlayers, ...blackPlayers];
  const simulatedStandings = allPlayers.map((player) => {
    const isYellowTeam = yellowPlayers.some(p => p.id === player.id);
    const isWinning = isYellowTeam ? yellowScore > blackScore : blackScore > yellowScore;
    const eloChange = isWinning ? 15 : -10;
    
    return {
      id: player.id,
      name: player.name,
      points: player.elo + eloChange,
      change: isWinning ? "up" : "down",
    };
  }).sort((a, b) => b.points - a.points);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Match Scorer</DialogTitle>
          <DialogDescription>
            Enter match scores and preview live classification changes
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[40%,60%] gap-6 py-4">
          {/* Score Input Section */}
          <div className="space-y-4">
            <div>
              <h3 className="mb-4">Score Input</h3>

              {/* Yellow Team */}
              <Card className="p-4 mb-4 bg-accent/10 border-accent/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-accent"></div>
                      Yellow Team
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {yellowPlayers.map((p) => p.name).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementYellow}
                    className="h-12 w-12 rounded-full"
                    disabled={yellowScore === 0}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>

                  <motion.div
                    key={yellowScore}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-6xl font-bold text-accent min-w-[100px] text-center"
                  >
                    {yellowScore}
                  </motion.div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementYellow}
                    className="h-12 w-12 rounded-full hover:bg-accent hover:text-white transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full mt-3"
                  onClick={setYellowWin}
                  size="sm"
                >
                  Quick Win (10-0)
                </Button>
              </Card>

              {/* Black Team */}
              <Card className="p-4 bg-muted/30 border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-foreground"></div>
                      Black Team
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {blackPlayers.map((p) => p.name).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementBlack}
                    className="h-12 w-12 rounded-full"
                    disabled={blackScore === 0}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>

                  <motion.div
                    key={blackScore}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-6xl font-bold min-w-[100px] text-center"
                  >
                    {blackScore}
                  </motion.div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementBlack}
                    className="h-12 w-12 rounded-full hover:bg-foreground hover:text-background transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full mt-3"
                  onClick={setBlackWin}
                  size="sm"
                >
                  Quick Win (10-0)
                </Button>
              </Card>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-secondary to-secondary/80"
                onClick={() => {
                  const updatedMatch = {
                    ...match,
                    yellowScore,
                    blackScore,
                    timestamp: yellowScore === 0 && blackScore === 0 ? match.timestamp : new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                  };
                  onUpdateMatch(updatedMatch);
                  onClose();
                }}
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Result
              </Button>
            </div>
          </div>

          {/* Classification Preview Section */}
          <div>
            <h3 className="mb-4">Live Classification Preview</h3>

            <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Projected standings after this match
                </p>
                <Badge variant="secondary" className="animate-pulse">
                  Live
                </Badge>
              </div>

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {simulatedStandings.map((player, index) => (
                    <motion.div
                      key={player.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      <Card
                        className={`p-3 ${
                          yellowScore !== blackScore
                            ? "shadow-lg shadow-primary/10"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-sm">
                            {index + 1}
                          </div>

                          <div className="flex-1">
                            <h4 className="text-sm">{player.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              ELO: {player.points}
                            </p>
                          </div>

                          {yellowScore !== blackScore && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {player.change === "up" ? (
                                <div className="flex items-center gap-1 text-secondary">
                                  <ArrowUp className="w-4 h-4" />
                                  <span className="text-xs">Up</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-destructive">
                                  <ArrowDown className="w-4 h-4" />
                                  <span className="text-xs">Down</span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <h4 className="text-sm mb-2">Impact Analysis</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    • Winner gains:{" "}
                    <span className="text-secondary font-semibold">+15 ELO</span>
                  </p>
                  <p>
                    • Loser loses:{" "}
                    <span className="text-destructive font-semibold">-10 ELO</span>
                  </p>
                  <p>
                    • Expected ranking changes:{" "}
                    <span className="font-semibold">
                      {yellowScore !== blackScore ? "2 positions" : "None"}
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
