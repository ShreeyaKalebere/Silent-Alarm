import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { api } from "../services/api";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeRoom, setActiveRoom] = useState("general");
  const [activeRoomName, setActiveRoomName] = useState("General Support");
  const [messages, setMessages] = useState([]);
  const [isRoomLoading, setIsRoomLoading] = useState(false);
  const activeRoomRef = useRef(activeRoom);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Connect socket when user is logged in
  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5
    });

    newSocket.on("connect", () => {
      console.log("[Socket Connected]:", newSocket.id);
      newSocket.emit("register_user", {
        userId: user._id,
        username: user.username,
        role: user.role
      });
      // Join initial room
      newSocket.emit("join_room", { roomId: activeRoomRef.current });
    });

    newSocket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    newSocket.on("receive_message", (message) => {
      if (message.roomId === activeRoomRef.current) {
        setMessages((prev) => {
          // Avoid duplicate keys if already added
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Load message history when activeRoom or token changes
  useEffect(() => {
    if (!token || !activeRoom) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) setIsRoomLoading(true);
    });

    api.getMessages(activeRoom, token)
      .then((history) => {
        if (isMounted) {
          setMessages(history || []);
          setIsRoomLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load message history:", err);
        if (isMounted) setIsRoomLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeRoom, token]);

  const joinRoom = (roomId, displayName) => {
    if (activeRoom === roomId) return;

    if (socket) {
      socket.emit("leave_room", { roomId: activeRoom });
      socket.emit("join_room", { roomId });
    }

    setActiveRoom(roomId);
    setActiveRoomName(displayName || roomId);
  };

  const sendMessage = (text) => {
    if (!socket || !text || !text.trim() || !user) return;

    const payload = {
      roomId: activeRoom,
      text: text.trim(),
      sender: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    };

    socket.emit("send_message", payload, (response) => {
      if (response && !response.success) {
        console.error("Failed to send message:", response.error);
      }
    });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        activeRoom,
        activeRoomName,
        messages,
        isRoomLoading,
        joinRoom,
        sendMessage
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useChatSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useChatSocket must be used within a SocketProvider");
  return context;
};
