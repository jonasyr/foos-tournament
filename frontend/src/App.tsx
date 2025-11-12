import { useState, useEffect, useRef } from "react";
import { Navigation } from "./components/Navigation";
import { Dashboard, DashboardHandle } from "./components/Dashboard";
import { QuickMatchCreator } from "./components/QuickMatchCreator";
import { DivisionView } from "./components/DivisionView";
import { PlayerProfile } from "./components/PlayerProfile";
import { StatsHub } from "./components/StatsHub";
import { ComponentLibrary } from "./components/ComponentLibrary";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [quickMatchOpen, setQuickMatchOpen] = useState(false);
  const dashboardRef = useRef<DashboardHandle>(null);

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

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard ref={dashboardRef} onCreateMatch={() => setQuickMatchOpen(true)} />;
      case "divisions":
        return <DivisionView />;
      case "stats":
        return <StatsHub />;
      case "profile":
        return <PlayerProfile />;
      case "components":
        return <ComponentLibrary />;
      default:
        return <Dashboard ref={dashboardRef} onCreateMatch={() => setQuickMatchOpen(true)} />;
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
        onMatchCreated={() => dashboardRef.current?.refresh()}
      />

      <Toaster position="top-right" />
    </div>
  );
}
