"use client"

import { createContext, useState, useEffect } from "react"
import PropTypes from "prop-types"

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [categorySetupCompleted, setCategorySetupCompleted] = useState(null)
  const userId = sessionStorage.getItem("userId")
  const [userAvatar, setUserAvatar] = useState("")

  // Load avatar from storage whenever userId changes
  useEffect(() => {
    if (userId) {
      const storedAvatar = sessionStorage.getItem(`userAvatar_${userId}`)
      setUserAvatar(storedAvatar || "")
    } else {
      setUserAvatar("")
    }

    const setupCompleted = sessionStorage.getItem("categorySetupCompleted")
    if (setupCompleted !== null) {
      setCategorySetupCompleted(JSON.parse(setupCompleted))
    }

    // Listen for avatar updates
    const handleAvatarUpdate = (event) => {
      if (event.detail && event.detail.avatar && event.detail.userId) {
        // Only update avatar if it's for the current user
        const currentUserId = sessionStorage.getItem("userId")
        if (event.detail.userId === currentUserId) {
          setUserAvatar(event.detail.avatar)
        }
      }
    }

    window.addEventListener("avatarUpdated", handleAvatarUpdate)

    return () => {
      window.removeEventListener("avatarUpdated", handleAvatarUpdate)
    }
  }, [userId]) // Re-run when userId changes

  // Set category setup completion flag in sessionStorage
  const markCategorySetupCompleted = () => {
    setCategorySetupCompleted(true)
    sessionStorage.setItem("categorySetupCompleted", true)
  }

  // Update avatar with user-specific storage
  const updateAvatar = (avatarUrl) => {
    const currentUserId = sessionStorage.getItem("userId")
    if (!currentUserId) return

    setUserAvatar(avatarUrl)
    sessionStorage.setItem(`userAvatar_${currentUserId}`, avatarUrl)

    // Dispatch event for other components with userId
    window.dispatchEvent(
      new CustomEvent("avatarUpdated", {
        detail: {
          avatar: avatarUrl,
          userId: currentUserId,
        },
      }),
    )
  }

  // Reset avatar state (used during logout)
  const resetAvatar = () => {
    setUserAvatar("")
  }

  return (
    <UserContext.Provider
      value={{
        categorySetupCompleted,
        markCategorySetupCompleted,
        userAvatar,
        updateAvatar,
        resetAvatar,
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
