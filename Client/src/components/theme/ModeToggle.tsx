"use client";
import { useTheme } from "next-themes";
import { Button } from "@Client/components/ui/button";
import { Moon, Sun } from "lucide-react";
import React from "react";

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === "dark";
  return (
    <Button variant="outline" size="sm" onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme" className="inline-flex items-center gap-2">
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {isDark ? 'Light' : 'Dark'}
    </Button>
  );
}


