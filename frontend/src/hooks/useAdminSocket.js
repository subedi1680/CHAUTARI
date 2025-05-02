"use client"

import { useEffect } from "react"
import { io } from "socket.io-client"

export const useAdminSocket = (onNewPost, onPostStatusChange, onNewReport) => {
  useEffect(() => {
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) return

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
    const socket = io(API_BASE_URL, {
      withCredentials: true,
      auth: {
        token: adminToken,
      },
    })

    socket.on("connect", () => {
      console.log("Admin socket connected")
      socket.emit("joinAdminRoom")
    })

    socket.on("newPost", (data) => {
      if (onNewPost) onNewPost(data)
      fetchPendingCount()
    })

    socket.on("postStatusChanged", (data) => {
      if (onPostStatusChange) onPostStatusChange(data)
      fetchPendingCount()
    })

    socket.on("newReport", (data) => {
      if (onNewReport) onNewReport(data)
      fetchReportCount()
    })

    socket.on("disconnect", () => {
      console.log("Admin socket disconnected")
    })

    return () => {
      socket.disconnect()
    }
  }, [onNewPost, onPostStatusChange, onNewReport])
}

export const fetchPendingCount = async () => {
  try {
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) return

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
    const response = await fetch(`${API_BASE_URL}/api/admin/posts/pending`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      const count = data.length
      sessionStorage.setItem("adminPendingCount", count.toString())
      return count
    }
  } catch (error) {
    console.error("Error fetching pending count:", error)
  }
  return 0
}

export const fetchReportCount = async () => {
  try {
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) return

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
    const response = await fetch(`${API_BASE_URL}/api/admin/reports/count`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      sessionStorage.setItem("adminReportCount", data.count.toString())
      return data.count
    }
  } catch (error) {
    console.error("Error fetching report count:", error)
  }
  return 0
}

export default useAdminSocket
