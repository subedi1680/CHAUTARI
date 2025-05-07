"use client"

import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import { SOCKET_URL } from "../config"
import { userSession } from "../utils/sessionManager"

let socket = null

export function initSocket() {
  // Only create a socket if we're in a browser environment and the user is authenticated
  if (typeof window !== "undefined" && userSession.isAuthenticated()) {
    try {
      if (!socket) {
        const token = userSession.getToken()
        const userId = userSession.getUserId()

        // Create socket connection with proper configuration
        socket = io(SOCKET_URL, {
          withCredentials: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ["websocket", "polling"], // Try websocket first, then polling
          query: {
            userId,
            token,
          },
          autoConnect: true,
        })

        // Add error handling
        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err.message)
        })

        socket.on("connect_timeout", () => {
          console.error("Socket connection timeout")
        })

        socket.on("error", (err) => {
          console.error("Socket error:", err.message)
        })

        socket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason)
        })

        socket.on("reconnect", (attemptNumber) => {
          console.log("Socket reconnected after", attemptNumber, "attempts")
        })

        socket.on("reconnect_error", (err) => {
          console.error("Socket reconnection error:", err.message)
        })

        socket.on("reconnect_failed", () => {
          console.error("Socket failed to reconnect")
        })

        // Add a connected event handler
        socket.on("connected", (data) => {
          console.log("Socket connected with ID:", data.socketId)
        })
      }
    } catch (err) {
      console.error("Error initializing socket:", err)
      return null
    }
  }

  return socket
}

export function useSocketStatus() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const sock = initSocket()

    if (!sock) return () => {}

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    sock.on("connect", onConnect)
    sock.on("disconnect", onDisconnect)

    // Set initial state
    setIsConnected(sock.connected)

    return () => {
      sock.off("connect", onConnect)
      sock.off("disconnect", onDisconnect)
    }
  }, [])

  return isConnected
}

export function usePostReactions(onUpdate) {
  useEffect(() => {
    const sock = initSocket()

    if (!sock) return () => {}

    sock.on("postReaction", onUpdate)

    return () => {
      sock.off("postReaction", onUpdate)
    }
  }, [onUpdate])
}

export function useSocketEvent(event, callback) {
  useEffect(() => {
    const sock = initSocket()

    if (!sock) return () => {}

    sock.on(event, callback)

    return () => {
      sock.off(event, callback)
    }
  }, [event, callback])
}

export function emitSocketEvent(event, data) {
  const sock = initSocket()

  if (sock && sock.connected) {
    sock.emit(event, data)
    return true
  }

  return false
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
