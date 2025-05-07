"use client"

import { useEffect } from "react"
import { io } from "socket.io-client"
import { SOCKET_URL } from "../config"

let socket

export function initSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
    })
  }
  return socket
}

export function usePostReactions(onUpdate) {
  useEffect(() => {
    const sock = initSocket()
    sock.on("postReaction", onUpdate)
    return () => {
      sock.off("postReaction", onUpdate)
    }
  }, [onUpdate])
}
