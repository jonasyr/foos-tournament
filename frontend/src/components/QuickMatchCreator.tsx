import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { toast } from "sonner";
import { playerApi, matchApi } from "../lib/api";
import type { Player, QuickMatchPayload } from "../lib/types";

interface QuickMatchCreatorProps {
  open: boolean;
  onClose: () => void;
  onMatchCreated?: () => void;
}

export function QuickMatchCreator({ open, onClose, onMatchCreated }: QuickMatchCreatorProps) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"singles" | "doubles">("doubles");
  const [yellowPlayer1, setYellowPlayer1] = useState<number | null>(null);
  const [yellowPlayer2, setYellowPlayer2] = useState<number | null>(null);
  const [blackPlayer1, setBlackPlayer1] = useState<number | null>(null);
  const [blackPlayer2, setBlackPlayer2] = useState<number | null>(null);
  const [targetScore, setTargetScore] = useState([10]);
  const [bestOf, setBestOf] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load players when dialog opens
  useEffect(() => {
    if (open) {
      loadPlayers();
    }
  }, [open]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const playersData = await playerApi.getAllPlayers();
      setPlayers(playersData);
    } catch (err: any) {
      console.error('Failed to load players:', err);
      setError(err.message || 'Failed to load players');
      toast.error('Failed to load players', {
        description: 'Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setMode("doubles");
    setYellowPlayer1(null);
    setYellowPlayer2(null);
    setBlackPlayer1(null);
    setBlackPlayer2(null);
    setTargetScore([10]);
    setBestOf(false);
    setError(null);
    onClose();
  };

  const handleCreateMatchClick = async () => {
    try {
      setCreating(true);

      // Build player IDs array based on mode
      const playerIds: number[] = mode === "singles"
        ? [yellowPlayer1!, blackPlayer1!]
        : [yellowPlayer1!, yellowPlayer2!, blackPlayer1!, blackPlayer2!];

      // Create match payload
      const payload: QuickMatchPayload = {
        division_id: 1, // TODO: Get from current season/division context
        player_ids: playerIds,
        mode,
        win_condition: bestOf ? 'best_of' : 'score_limit',
        target_score: targetScore[0],
      };

      await matchApi.createQuickMatch(payload);

      toast.success("Match created successfully!", {
        description: "Match is ready to start. Check the dashboard.",
      });

      handleClose();

      // Notify parent to refresh data
      if (onMatchCreated) {
        onMatchCreated();
      }
    } catch (err: any) {
      console.error('Failed to create match:', err);
      toast.error('Failed to create match', {
        description: err.message || 'Please try again.',
      });
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quick Match</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 py-4"
            >
              <div>
                <h3 className="mb-4">Select Match Mode</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card
                    className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                      mode === "singles"
                        ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary"
                        : "border-border"
                    }`}
                    onClick={() => setMode("singles")}
                  >
                    <div className="text-center space-y-3">
                      <div className="text-4xl">🏓</div>
                      <h4>Singles</h4>
                      <p className="text-sm text-muted-foreground">
                        One-on-one competition
                      </p>
                    </div>
                  </Card>

                  <Card
                    className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                      mode === "doubles"
                        ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary"
                        : "border-border"
                    }`}
                    onClick={() => setMode("doubles")}
                  >
                    <div className="text-center space-y-3">
                      <div className="text-4xl">🎯</div>
                      <h4>Doubles</h4>
                      <p className="text-sm text-muted-foreground">
                        Team-based matches
                      </p>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} className="gap-2">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 py-4"
            >
              <div>
                <h3 className="mb-4">Select Players</h3>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-destructive mb-4">{error}</p>
                    <Button onClick={loadPlayers} variant="outline">Retry</Button>
                  </div>
                ) : (
                  <>
                    {/* Yellow Team */}
                    <Card className="p-4 mb-4 bg-accent/10 border-accent/20">
                      <Label className="mb-3 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-accent"></div>
                        Yellow Team
                      </Label>
                      <div className="space-y-3">
                        <Select value={yellowPlayer1?.toString()} onValueChange={(val) => setYellowPlayer1(Number(val))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Player 1" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
                                      {getInitials(player.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {player.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {mode === "doubles" && (
                          <Select value={yellowPlayer2?.toString()} onValueChange={(val) => setYellowPlayer2(Number(val))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Player 2" />
                            </SelectTrigger>
                            <SelectContent>
                              {players
                                .filter((p) => p.id !== yellowPlayer1)
                                .map((player) => (
                                  <SelectItem key={player.id} value={player.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
                                          {getInitials(player.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      {player.name}
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </Card>

                    {/* Black Team */}
                    <Card className="p-4 bg-muted/30 border-border">
                      <Label className="mb-3 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-foreground"></div>
                        Black Team
                      </Label>
                      <div className="space-y-3">
                        <Select value={blackPlayer1?.toString()} onValueChange={(val) => setBlackPlayer1(Number(val))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Player 1" />
                          </SelectTrigger>
                          <SelectContent>
                            {players
                              .filter(
                                (p) => p.id !== yellowPlayer1 && p.id !== yellowPlayer2
                              )
                              .map((player) => (
                                <SelectItem key={player.id} value={player.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
                                        {getInitials(player.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    {player.name}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        {mode === "doubles" && (
                          <Select value={blackPlayer2?.toString()} onValueChange={(val) => setBlackPlayer2(Number(val))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Player 2" />
                            </SelectTrigger>
                            <SelectContent>
                              {players
                                .filter(
                                  (p) =>
                                    p.id !== yellowPlayer1 &&
                                    p.id !== yellowPlayer2 &&
                                    p.id !== blackPlayer1
                                )
                                .map((player) => (
                                  <SelectItem key={player.id} value={player.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
                                          {getInitials(player.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      {player.name}
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </Card>
                  </>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="gap-2">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 py-4"
            >
              <div>
                <h3 className="mb-4">Match Settings</h3>

                <div className="space-y-6">
                  {/* Target Score */}
                  <div>
                    <Label className="mb-3 block">Target Score</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={targetScore}
                        onValueChange={setTargetScore}
                        min={5}
                        max={50}
                        step={1}
                        className="flex-1"
                      />
                      <div className="w-16 text-center">
                        <span className="text-3xl font-semibold text-primary">
                          {targetScore[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Win Condition */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <Label>Best of 3</Label>
                      <p className="text-sm text-muted-foreground">
                        First to win 2 matches
                      </p>
                    </div>
                    <Switch checked={bestOf} onCheckedChange={setBestOf} />
                  </div>

                  {/* Preview Card */}
                  <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                    <h4 className="mb-3">Match Preview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mode:</span>
                        <span className="font-semibold capitalize">{mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Score:</span>
                        <span className="font-semibold">{targetScore[0]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Format:</span>
                        <span className="font-semibold">
                          {bestOf ? "Best of 3" : "Single Match"}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2" disabled={creating}>
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={handleCreateMatchClick}
                  className="gap-2 bg-gradient-to-r from-primary to-secondary"
                  disabled={creating || (mode === "singles" ? (!yellowPlayer1 || !blackPlayer1) : (!yellowPlayer1 || !yellowPlayer2 || !blackPlayer1 || !blackPlayer2))}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Match
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 pt-4 border-t border-border">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${
                s === step
                  ? "bg-primary w-8"
                  : s < step
                  ? "bg-secondary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
