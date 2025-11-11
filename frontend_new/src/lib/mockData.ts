export const mockPlayers = [
  { id: "1", name: "Alex Johnson", elo: 1850, wins: 42, losses: 18, gamesPlayed: 60 },
  { id: "2", name: "Jordan Lee", elo: 1820, wins: 38, losses: 22, gamesPlayed: 60 },
  { id: "3", name: "Sam Wilson", elo: 1790, wins: 35, losses: 25, gamesPlayed: 60 },
  { id: "4", name: "Casey Martinez", elo: 1750, wins: 32, losses: 28, gamesPlayed: 60 },
  { id: "5", name: "Morgan Davis", elo: 1720, wins: 30, losses: 30, gamesPlayed: 60 },
  { id: "6", name: "Riley Brown", elo: 1680, wins: 28, losses: 32, gamesPlayed: 60 },
  { id: "7", name: "Taylor Smith", elo: 1650, wins: 25, losses: 35, gamesPlayed: 60 },
  { id: "8", name: "Drew Anderson", elo: 1620, wins: 23, losses: 37, gamesPlayed: 60 },
];

export const mockMatches = [
  {
    id: "m1",
    timestamp: "2h ago",
    yellowTeam: [mockPlayers[0], mockPlayers[1]],
    blackTeam: [mockPlayers[2], mockPlayers[3]],
    yellowScore: 10,
    blackScore: 7,
    duration: "12m 34s",
    isQuickMatch: true,
  },
  {
    id: "m2",
    timestamp: "5h ago",
    yellowTeam: [mockPlayers[4]],
    blackTeam: [mockPlayers[5]],
    yellowScore: 10,
    blackScore: 8,
    duration: "8m 12s",
    isQuickMatch: true,
  },
  {
    id: "m3",
    timestamp: "1d ago",
    yellowTeam: [mockPlayers[6], mockPlayers[7]],
    blackTeam: [mockPlayers[0], mockPlayers[2]],
    yellowScore: 8,
    blackScore: 10,
    duration: "15m 48s",
    isQuickMatch: false,
  },
  {
    id: "m4",
    timestamp: "1d ago",
    yellowTeam: [mockPlayers[1], mockPlayers[3]],
    blackTeam: [mockPlayers[4], mockPlayers[5]],
    yellowScore: 10,
    blackScore: 6,
    duration: "9m 23s",
    isQuickMatch: true,
  },
  {
    id: "m5",
    timestamp: "2d ago",
    yellowTeam: [mockPlayers[6]],
    blackTeam: [mockPlayers[7]],
    yellowScore: 10,
    blackScore: 9,
    duration: "11m 05s",
    isQuickMatch: true,
  },
  {
    id: "m6",
    timestamp: "2d ago",
    yellowTeam: [mockPlayers[0], mockPlayers[4]],
    blackTeam: [mockPlayers[1], mockPlayers[5]],
    yellowScore: 10,
    blackScore: 5,
    duration: "7m 42s",
    isQuickMatch: false,
  },
];

export const mockDivisions = [
  {
    id: "d1",
    name: "Premier League",
    level: "Elite",
    currentRound: 8,
    totalRounds: 12,
  },
  {
    id: "d2",
    name: "Championship",
    level: "Advanced",
    currentRound: 6,
    totalRounds: 10,
  },
];

export const mockEloHistory = [
  { date: "Week 1", elo: 1500 },
  { date: "Week 2", elo: 1550 },
  { date: "Week 3", elo: 1580 },
  { date: "Week 4", elo: 1620 },
  { date: "Week 5", elo: 1650 },
  { date: "Week 6", elo: 1680 },
  { date: "Week 7", elo: 1720 },
  { date: "Week 8", elo: 1780 },
  { date: "Week 9", elo: 1820 },
  { date: "Week 10", elo: 1850 },
];

export const mockRadarData = [
  { metric: "Win Rate", player: 85, average: 65 },
  { metric: "Goals", player: 78, average: 60 },
  { metric: "Partnerships", player: 92, average: 70 },
  { metric: "Consistency", player: 88, average: 65 },
  { metric: "Activity", player: 90, average: 75 },
];

export const mockMatchHistory = [
  {
    id: "mh1",
    date: "Nov 5, 2025",
    opponent: "Jordan Lee",
    result: "win",
    score: "10-7",
  },
  {
    id: "mh2",
    date: "Nov 4, 2025",
    opponent: "Sam Wilson",
    result: "win",
    score: "10-8",
  },
  {
    id: "mh3",
    date: "Nov 3, 2025",
    opponent: "Casey Martinez",
    result: "loss",
    score: "8-10",
  },
  {
    id: "mh4",
    date: "Nov 2, 2025",
    opponent: "Morgan Davis",
    result: "win",
    score: "10-6",
  },
  {
    id: "mh5",
    date: "Nov 1, 2025",
    opponent: "Riley Brown",
    result: "win",
    score: "10-9",
  },
];
