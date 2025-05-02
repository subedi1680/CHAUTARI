// Theme utility functions

/**
 * Get the current theme from localStorage or system preference
 * @returns {string} 'light' or 'dark'
 */
export const getInitialTheme = () => {
  // Check if theme is stored in localStorage
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme) {
    return savedTheme
  }

  // Check system preference
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }

  // Default to light theme
  return "light"
}

/**
 * Set the theme and update localStorage and document attributes
 * @param {string} theme - 'light' or 'dark'
 */
export const setTheme = (theme) => {
  // Update localStorage
  localStorage.setItem("theme", theme)

  // Update document attribute
  document.documentElement.setAttribute("data-theme", theme)

  // Dispatch event for components to react to theme change
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }))
}

/**
 * Toggle between light and dark themes
 */
export const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light"
  const newTheme = currentTheme === "light" ? "dark" : "light"
  setTheme(newTheme)
}
