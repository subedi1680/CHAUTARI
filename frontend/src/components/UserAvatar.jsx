/* eslint-disable react/prop-types */
"use client"

import { useState } from "react"

const UserAvatar = ({ user, size = "md", className = "", onClick }) => {
  const [imageError, setImageError] = useState(false)

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
      {user?.avatar && !imageError ? (
        <img src={user.avatar || "/placeholder.svg"} alt={user.username || "User"} onError={handleError} />
      ) : (
        <span>{getInitials(user?.username)}</span>
      )}
    </div>
  )
}

export default UserAvatar
