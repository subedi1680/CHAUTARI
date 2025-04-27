import { useEffect } from 'react';
import { io } from 'socket.io-client';

let socket;

export function initSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true
    });
  }
  return socket;
}

export function usePostReactions(onUpdate) {
  useEffect(() => {
    const sock = initSocket();
    sock.on('postReaction', onUpdate);
    return () => { sock.off('postReaction', onUpdate); };
  }, [onUpdate]);
}
