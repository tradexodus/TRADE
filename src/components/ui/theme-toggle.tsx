import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useEffect, useState } from "react";
import { setThemePreference, getThemePreference } from "@/lib/cookies";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Get theme from cookie first, then localStorage as fallback, or default to dark
    const cookieTheme = getThemePreference();
    const localStorageTheme = localStorage.getItem("theme") as
      | "dark"
      | "light"
      | null;
    const initialTheme = cookieTheme || localStorageTheme || "dark";

    setTheme(initialTheme);
    applyTheme(initialTheme);

    // If we got theme from localStorage but not cookie, migrate to cookie
    if (localStorageTheme && !cookieTheme) {
      setThemePreference(localStorageTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    applyTheme(newTheme);

    // Store in both cookie (primary) and localStorage (fallback)
    setThemePreference(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const applyTheme = (currentTheme: "dark" | "light") => {
    const htmlElement = document.documentElement;
    if (currentTheme === "dark") {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
