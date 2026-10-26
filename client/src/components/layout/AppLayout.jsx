import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { TopBar } from "./TopBar.jsx";
import { CommandPalette } from "./CommandPalette.jsx";
import { AIAssistantPanel } from "../ai/AIAssistantPanel.jsx";
import { motion, AnimatePresence } from "framer-motion";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    const handleToggleAI = () => setAiOpen((prev) => !prev);
    window.addEventListener("toggle-ai-assistant", handleToggleAI);

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setAiOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("toggle-ai-assistant", handleToggleAI);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <TopBar
          onOpenCommand={() => setCommandOpen(true)}
          onOpenAI={() => setAiOpen(true)}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} setOpen={setCommandOpen} />

      {/* AI Assistant Slide-over Drawer */}
      <AIAssistantPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}