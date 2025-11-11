import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { motion } from "motion/react";

interface PlayerCardProps {
  position: number;
  name: string;
  avatar?: string;
  points: number;
  wins: number;
  losses: number;
  positionChange?: "up" | "down" | "same";
  onClick?: () => void;
}

export function PlayerCard({
  position,
  name,
  avatar,
  points,
  wins,
  losses,
  positionChange = "same",
  onClick,
}: PlayerCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getMedalEmoji = (pos: number) => {
    if (pos === 1) return "🥇";
    if (pos === 2) return "🥈";
    if (pos === 3) return "🥉";
    return null;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer border border-border bg-card/50 backdrop-blur-sm"
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-2xl">{getMedalEmoji(position) || position}</span>
              {positionChange === "up" && (
                <ArrowUp className="w-4 h-4 text-secondary" />
              )}
              {positionChange === "down" && (
                <ArrowDown className="w-4 h-4 text-destructive" />
              )}
              {positionChange === "same" && (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1">
            <h4 className="font-semibold">{name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {wins}W - {losses}L
              </Badge>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-semibold text-primary">{points}</div>
            <div className="text-xs text-muted-foreground">ELO</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
