import React, { createContext, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Vite exposes runtime env vars through import.meta.env
// use VITE_API_URL to point to your backend (set in Vercel/Render environments)
const API = import.meta.env.VITE_API_URL || '/';

// lightweight helper — prefer using localStorage token for handshake
function getTokenFromStorage() {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    return null;
  }
}

export const socket = io(API, {
  autoConnect: false,
  // If you want to use auth token with socket handshake:
  auth: { token: getTokenFromStorage() }
});

// React context
export const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // connect after verifying token or user loaded
    socket.connect();

    // identify to join personal room:
    const currentUserId = localStorage.getItem('userId'); // or from your user store
    if (currentUserId) {
      socket.emit('identify', currentUserId);
    }

    // cleanup
    return () => {
      socket.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
