"use client";
import { useEffect, useState } from "react";

const getInitialDarkMode = () => {
  if (typeof window === "undefined") return false;

  const userPreference = localStorage.getItem("theme");
  const userPreferenceIsDark = userPreference === "dark";
  const systemPreferenceIsDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  return userPreferenceIsDark || (!userPreference && systemPreferenceIsDark);
};

const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    const userPreference = localStorage.getItem("theme");
    const userPreferenceIsDark = userPreference === "dark";
    const systemPreferenceIsDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (userPreferenceIsDark || (!userPreference && systemPreferenceIsDark)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
      return;
    }
    document.documentElement.classList.remove("dark");
    setIsDarkMode(false);
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
      return;
    }
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
    setIsDarkMode(true);
  };

  return [isDarkMode, toggleDarkMode] as const;
};

export default useDarkMode;
