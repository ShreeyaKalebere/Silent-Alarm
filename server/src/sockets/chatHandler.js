const Message = require("../models/Message");

const onlineUsers = new Map(); // socketId -> { userId, username, role }

const registerChatHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket Connected]: ${socket.id}`);

    // User identification upon connection
    socket.on("register_user", (userData) => {
      if (userData && userData.userId) {
        onlineUsers.set(socket.id, {
          socketId: socket.id,
          userId: userData.userId,
          username: userData.username,
          role: userData.role
        });

        // Join private user-scoped room for targeted personal alerts
        socket.join(`user_${userData.userId}`);

        // Broadcast active users list (deduplicated by userId)
        const uniqueUsers = Array.from(
          new Map(Array.from(onlineUsers.values()).map(u => [u.userId, u])).values()
        );
        io.emit("online_users", uniqueUsers);
        console.log(`[User Registered]: ${userData.username} (${userData.role})`);
      }
    });

    // Join room / DM channel
    socket.on("join_room", ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);
      console.log(`[Socket ${socket.id}] joined room: ${roomId}`);
      socket.emit("room_joined", { roomId });
    });

    // Leave room
    socket.on("leave_room", ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);
      console.log(`[Socket ${socket.id}] left room: ${roomId}`);
    });

    // Send and persist message
    socket.on("send_message", async (data, ackCallback) => {
      try {
        const { roomId, text, sender } = data;
        if (!roomId || !text || !text.trim() || !sender || !sender._id) {
          if (ackCallback) ackCallback({ success: false, error: "Missing required fields" });
          return;
        }

        const newMessage = await Message.create({
          roomId,
          sender: {
            _id: sender._id,
            username: sender.username,
            role: sender.role || "student"
          },
          text: text.trim(),
          createdAt: new Date()
        });

        // Emit to all sockets in the room
        io.to(roomId).emit("receive_message", newMessage);

        if (ackCallback) ackCallback({ success: true, message: newMessage });
      } catch (error) {
        console.error("Socket send_message error:", error);
        if (ackCallback) ackCallback({ success: false, error: error.message });
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`[Socket Disconnected]: ${socket.id}`);
      onlineUsers.delete(socket.id);

      const uniqueUsers = Array.from(
        new Map(Array.from(onlineUsers.values()).map(u => [u.userId, u])).values()
      );
      io.emit("online_users", uniqueUsers);
    });
  });
};

const emitToUser = (io, userId, eventName, data) => {
  if (io && userId) {
    io.to(`user_${userId}`).emit(eventName, data);
  }
};

module.exports = { registerChatHandlers, emitToUser };