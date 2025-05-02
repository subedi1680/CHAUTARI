"use client"

import { useEffect, useState } from "react"
import { toggleTheme, getInitialTheme } from "../utils/themeUtils"

const ThemeToggle = () => {
  const [theme, setTheme] = useState(getInitialTheme())

  useEffect(() => {
    // Set initial theme
    document.documentElement.setAttribute("data-theme", theme)

    // Listen for theme changes
    const handleThemeChange = (e) => {
      setTheme(e.detail.theme)
    }

    window.addEventListener("themechange", handleThemeChange)

    return () => {
      window.removeEventListener("themechange", handleThemeChange)
    }
  }, [])

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <i className="bi bi-moon-fill"></i> : <i className="bi bi-sun-fill"></i>}
    </button>
  )
}

export default ThemeToggle
