"use client";

import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-1.5 sm:p-2 rounded-md border transition-colors flex items-center justify-center cursor-pointer ${
        theme === "dark"
          ? "border-neutral-800 bg-neutral-900 text-amber-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-700"
          : "border-neutral-300 bg-neutral-100 text-neutral-800 hover:text-black hover:bg-neutral-200 hover:border-neutral-400 shadow-sm"
      } ${className}`}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle dark/light theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
