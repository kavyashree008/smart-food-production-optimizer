import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";
import toast from "react-hot-toast";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      if (user?.role) {
        socketInstance.emit("join", `role:${user.role}`);
      }
    });

    socketInstance.on("alert:new", (alert) => {
      toast(alert.message, {
        icon: alert.severity === "critical" ? "🚨" : "⚠️",
        duration: 5000
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
