"use client"

import { createContext, useState, useEffect } from "react"
import PropTypes from "prop-types"

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [categorySetupCompleted, setCategorySetupCompleted] = useState(null)
  const [userAvatar, setUserAvatar] = useState(sessionStorage.getItem("userAvatar") || "")

  // Load categorySetupCompleted status from sessionStorage on app load
  useEffect(() => {
    const setupCompleted = sessionStorage.getItem("categorySetupCompleted")
    if (setupCompleted !== null) {
      setCategorySetupCompleted(JSON.parse(setupCompleted))
    }

    // Listen for avatar updates
    const handleAvatarUpdate = (event) => {
      if (event.detail && event.detail.avatar) {
        setUserAvatar(event.detail.avatar)
      }
    }

    window.addEventListener("avatarUpdated", handleAvatarUpdate)

    return () => {
      window.removeEventListener("avatarUpdated", handleAvatarUpdate)
    }
  }, [])

  // Set category setup completion flag in sessionStorage
  const markCategorySetupCompleted = () => {
    setCategorySetupCompleted(true)
    sessionStorage.setItem("categorySetupCompleted", true)
  }

  // Update avatar
  const updateAvatar = (avatarUrl) => {
    setUserAvatar(avatarUrl)
    sessionStorage.setItem("userAvatar", avatarUrl)

    // Dispatch event for other components
    window.dispatchEvent(
      new CustomEvent("avatarUpdated", {
        detail: { avatar: avatarUrl },
      }),
    )
  }

  return (
    <UserContext.Provider
      value={{
        categorySetupCompleted,
        markCategorySetupCompleted,
        userAvatar,
        updateAvatar,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export default UserContext
