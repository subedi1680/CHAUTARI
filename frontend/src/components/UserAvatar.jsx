"use client"

import PropTypes from "prop-types"

const UserAvatar = ({ user, size = "md", className = "", onClick }) => {
  // Get the first letter of username for fallback
  const firstLetter = user?.username ? user.username.charAt(0).toUpperCase() : "?"

  // Determine size class
  let sizeClass = "avatar"
  let dimensions = "40px"

  switch (size) {
    case "sm":
      sizeClass += " avatar-sm"
      dimensions = "32px"
      break
    case "lg":
      sizeClass += " avatar-lg"
      dimensions = "64px"
      break
    case "xl":
      sizeClass += " avatar-xl"
      dimensions = "100px"
      break
    default:
      // Default is medium size
      dimensions = "40px"
      break
  }

  // Function to handle image error
  const handleImageError = (e) => {
    e.target.onerror = null
    e.target.style.display = "none"
    const fallbackElement = e.target.parentNode.querySelector(".avatar-fallback")
    if (fallbackElement) {
      fallbackElement.style.display = "flex"
    }
  }

  // Determine avatar source
  const avatarSrc = user?.avatar
    ? user.avatar.startsWith("data:")
      ? user.avatar
      : `data:image/jpeg;base64,${user.avatar}`
    : null

  return (
    <div
      className={`${sizeClass} ${className}`}
      style={{ width: dimensions, height: dimensions, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      {avatarSrc ? (
        <>
          <img
            src={avatarSrc || "/placeholder.svg"}
            alt={`${user.username}'s avatar`}
            className="w-100 h-100 rounded-circle"
            style={{ objectFit: "cover" }}
            onError={handleImageError}
          />
          <div className="avatar-fallback bg-primary rounded-circle d-none align-items-center justify-content-center w-100 h-100">
            <span className="text-white fw-bold">{firstLetter}</span>
          </div>
        </>
      ) : (
        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center w-100 h-100">
          <span className="text-white fw-bold">{firstLetter}</span>
        </div>
      )}
    </div>
  )
}

UserAvatar.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    avatar: PropTypes.string,
  }),
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  className: PropTypes.string,
  onClick: PropTypes.func,
}

export default UserAvatar
