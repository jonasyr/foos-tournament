import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, CheckCircle, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { matchApi } from "../lib/api";
import { toast } from "sonner";
import type { OpenMatch, MatchResultPayload } from "../lib/types";

interface MatchSimulatorProps {
  open: boolean;
  onClose: () => void;
  match: OpenMatch;
  onResultSubmitted?: () => void;
}

export function MatchSimulator({ open, onClose, match, onResultSubmitted }: MatchSimulatorProps) {
  const [yellowScore, setYellowScore] = useState(0);
  const [blackScore, setBlackScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Reset scores and start time when match changes or dialog opens
  useEffect(() => {
    if (open) {
      setYellowScore(0);
      setBlackScore(0);
      setStartTime(Math.floor(Date.now() / 1000));
    }
  }, [match.id, open]);

  const yellowPlayers = match.teams?.yellow?.names || [];
  const blackPlayers = match.teams?.black?.names || [];
  const targetScore = match.target_score || 10;

  const incrementYellow = () => setYellowScore((prev) => Math.min(prev + 1, 50));
  const decrementYellow = () => setYellowScore((prev) => Math.max(prev - 1, 0));
  const incrementBlack = () => setBlackScore((prev) => Math.min(prev + 1, 50));
  const decrementBlack = () => setBlackScore((prev) => Math.max(prev - 1, 0));

  const setYellowWin = () => {
    setYellowScore(targetScore);
    setBlackScore(Math.floor(targetScore * 0.7)); // Lose with 70% of target
  };

  const setBlackWin = () => {
    setBlackScore(targetScore);
    setYellowScore(Math.floor(targetScore * 0.7));
  };

  const handleSubmitResult = async () => {
    try {
      setSubmitting(true);

      const endTime = Math.floor(Date.now() / 1000);
      const payload: MatchResultPayload = {
        id: match.id,
        results: [[yellowScore, blackScore]],
        start: startTime || undefined,
        end: endTime,
      };

      await matchApi.setResult(payload);

      toast.success("Match result submitted!", {
        description: `${yellowScore > blackScore ? 'Yellow' : 'Black'} team wins ${Math.max(yellowScore, blackScore)}-${Math.min(yellowScore, blackScore)}`,
      });

      onClose();

      // Notify parent to refresh data
      if (onResultSubmitted) {
        onResultSubmitted();
      }
    } catch (err: any) {
      console.error('Failed to submit result:', err);
      toast.error('Failed to submit result', {
        description: err.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Simulate standings based on score - simplified version
  const allPlayers = [...yellowPlayers, ...blackPlayers];
  const simulatedStandings = allPlayers.map((playerName, idx) => {
    const isYellowTeam = idx < yellowPlayers.length;
    const isWinning = isYellowTeam ? yellowScore > blackScore : blackScore > yellowScore;
    const eloChange = isWinning ? 15 : -10;
    const baseElo = 1000 + (10 - idx) * 20; // Mock base ELO

    return {
      id: idx,
      name: playerName,
      points: baseElo + eloChange,
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
                      {yellowPlayers.join(", ")}
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
                      {blackPlayers.join(", ")}
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
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-secondary to-secondary/80"
                onClick={handleSubmitResult}
                disabled={submitting || (yellowScore === 0 && blackScore === 0)}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Result
                  </>
                )}
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
