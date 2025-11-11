import { useState, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { QuickMatchCreator } from "./components/QuickMatchCreator";
import { DivisionView } from "./components/DivisionView";
import { PlayerProfile } from "./components/PlayerProfile";
import { StatsHub } from "./components/StatsHub";
import { ComponentLibrary } from "./components/ComponentLibrary";
import { Toaster } from "./components/ui/sonner";
import { mockMatches, mockPlayers } from "./lib/mockData";

export interface Match {
  id: string;
  timestamp: string;
  yellowTeam: typeof mockPlayers;
  blackTeam: typeof mockPlayers;
  yellowScore: number;
  blackScore: number;
  duration: string;
  isQuickMatch: boolean;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [quickMatchOpen, setQuickMatchOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>(mockMatches);

  useEffect(() => {
    // Check system preference on mount
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleCreateMatch = (newMatch: Match) => {
    setMatches([newMatch, ...matches]);
    setQuickMatchOpen(false);
  };

  const handleUpdateMatch = (updatedMatch: Match) => {
    setMatches(matches.map(match => 
      match.id === updatedMatch.id ? updatedMatch : match
    ));
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onCreateMatch={() => setQuickMatchOpen(true)} matches={matches} onUpdateMatch={handleUpdateMatch} />;
      case "divisions":
        return <DivisionView matches={matches} onUpdateMatch={handleUpdateMatch} />;
      case "stats":
        return <StatsHub matches={matches} />;
      case "profile":
        return <PlayerProfile matches={matches} />;
      case "components":
        return <ComponentLibrary />;
      default:
        return <Dashboard onCreateMatch={() => setQuickMatchOpen(true)} matches={matches} onUpdateMatch={handleUpdateMatch} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main>{renderPage()}</main>

      <QuickMatchCreator
        open={quickMatchOpen}
        onClose={() => setQuickMatchOpen(false)}
        onCreateMatch={handleCreateMatch}
      />

      <Toaster position="top-right" />
    </div>
  );
}
