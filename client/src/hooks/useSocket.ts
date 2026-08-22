import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

/**
 * Custom hook for subscribing to Socket.io events from the HRMS server.
 *
 * Creates a socket connection on mount and disconnects on unmount.
 * Each event callback is memoized via useCallback to prevent unnecessary re-subscriptions.
 *
 * Usage:
 *   const { socket, isConnected } = useSocket({
 *     "attendance:new": (data) => console.log("New attendance:", data),
 *     "leave:new": (data) => console.log("New leave request:", data),
 *   });
 *
 * @param eventHandlers - Map of event name → handler function
 */

type EventHandlers = Record<string, (data: unknown) => void>;

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data?: unknown) => void;
}

export const useSocket = (eventHandlers?: EventHandlers): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      auth: {
        token: accessToken,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      connectedRef.current = true;
      console.log("🔌 Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      connectedRef.current = false;
      console.log("🔌 Socket disconnected:", reason);
    });

    // Register event handlers
    if (eventHandlers) {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.on(event, handler);
      });
    }

    return () => {
      if (eventHandlers) {
        Object.entries(eventHandlers).forEach(([event, handler]) => {
          socket.off(event, handler);
        });
      }
      socket.disconnect();
      socketRef.current = null;
      connectedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return {
    socket: socketRef.current,
    isConnected: connectedRef.current,
    emit,
  };
};
