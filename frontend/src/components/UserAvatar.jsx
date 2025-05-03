/* eslint-disable react/prop-types */
"use client"

import { useState, useEffect } from "react"

const UserAvatar = ({ user, size = "md", className = "", onClick }) => {
  const [imageError, setImageError] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("")

  // Get initials from username
  const getInitials = (username) => {
    if (!username) return "?"
    return username
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Handle image load error
  const handleError = () => {
    setImageError(true)
  }

  // Effect to handle avatar URL
  useEffect(() => {
    if (user?.avatar) {
      // Check if avatar is a base64 string
      if (typeof user.avatar === "string" && user.avatar.startsWith("data:image")) {
        setAvatarUrl(user.avatar)
      }
      // Check if avatar is a URL
      else if (typeof user.avatar === "string" && (user.avatar.startsWith("http") || user.avatar.startsWith("/"))) {
        setAvatarUrl(user.avatar)
      }
      // Otherwise, assume it's a filename or path
      else {
        setAvatarUrl(user.avatar)
      }
      setImageError(false)
    } else {
      setImageError(true)
    }
  }, [user?.avatar])

  // Determine avatar size class
  const sizeClass =
    {
      sm: "avatar-sm",
      md: "avatar-md",
      lg: "avatar-lg",
      xl: "avatar-xl",
    }[size] || "avatar-md"

  return (
    <div
      className={`avatar ${sizeClass} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl || "/placeholder.svg"}
          alt={user?.username || "User"}
          onError={handleError}
          className="avatar-image"
        />
      ) : (
        <span className="avatar-initials">{getInitials(user?.username)}</span>
      )}
    </div>
  )
}

export default UserAvatar
