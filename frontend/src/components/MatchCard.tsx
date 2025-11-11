import { Clock, Zap } from "lucide-react";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";

interface Player {
  id: string;
  name: string;
  avatar?: string;
}

interface MatchCardProps {
  id: string;
  timestamp: string;
  yellowTeam: Player[];
  blackTeam: Player[];
  yellowScore: number;
  blackScore: number;
  duration: string;
  isQuickMatch?: boolean;
  onClick?: () => void;
}

export function MatchCard({
  timestamp,
  yellowTeam,
  blackTeam,
  yellowScore,
  blackScore,
  duration,
  isQuickMatch = false,
  onClick,
}: MatchCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-border bg-card/50 backdrop-blur-sm"
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            {isQuickMatch && (
              <Badge variant="secondary" className="gap-1 bg-accent/20 text-accent-foreground">
                <Zap className="w-3 h-3" />
                Quick
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {duration}
          </div>
        </div>

        {/* Yellow Team */}
        <div className="flex items-center justify-between mb-2 p-2 rounded-lg bg-accent/10">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {yellowTeam.map((player) => (
                <Avatar key={player.id} className="w-8 h-8 border-2 border-card">
                  <AvatarFallback className="bg-accent text-white text-xs">
                    {getInitials(player.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="flex flex-col">
              {yellowTeam.map((player, idx) => (
                <span key={player.id} className="text-sm">
                  {player.name}
                  {idx < yellowTeam.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
          <span className="text-2xl font-semibold">{yellowScore}</span>
        </div>

        {/* Black Team */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {blackTeam.map((player) => (
                <Avatar key={player.id} className="w-8 h-8 border-2 border-card">
                  <AvatarFallback className="bg-foreground text-background text-xs">
                    {getInitials(player.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="flex flex-col">
              {blackTeam.map((player, idx) => (
                <span key={player.id} className="text-sm">
                  {player.name}
                  {idx < blackTeam.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
          <span className="text-2xl font-semibold">{blackScore}</span>
        </div>
      </Card>
    </motion.div>
  );
}
