import React, { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChatSocket } from "../../context/SocketContext";
import { MessageSquare } from "lucide-react";

export default function MessageList() {
  const { user } = useAuth();
  const { messages, isRoomLoading, activeRoomName } = useChatSocket();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isRoomLoading]);

  const formatTimestamp = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const roleStyles = {
    counselor: "text-[#69E86C] bg-[#69E86C]/15 border-[#69E86C]/30",
    admin: "text-[#B8FF5A] bg-[#B8FF5A]/15 border-[#B8FF5A]/30",
    student: "text-[#788078] bg-[#111511] border-[#263026]"
  };

  if (isRoomLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#788078]">
          <div className="w-8 h-8 border-2 border-[#B8FF5A]/30 border-t-[#B8FF5A] rounded-full animate-spin" />
          <p className="text-sm">Loading message history...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm flex flex-col items-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-[#B8FF5A]/15 rounded-full blur-xl scale-150 pointer-events-none" />
            <div className="w-14 h-14 rounded-2xl bg-[#111511] flex items-center justify-center text-[#69E86C] relative z-10 shadow-lg border border-[#263026]">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-base font-semibold text-[#F4F7EE]">Welcome to {activeRoomName}</h3>
          <p className="text-xs text-[#788078] mt-1.5 leading-relaxed">
            This room is quiet right now — start the conversation whenever you&apos;re ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((msg, index) => {
        const isOwn = msg.sender?._id === user?._id;
        const senderRole = msg.sender?.role || "student";

        return (
          <div
            key={msg._id || index}
            className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
          >
            {/* Sender header for incoming messages */}
            {!isOwn && (
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-xs font-semibold text-[#F4F7EE]">
                  {msg.sender?.username}
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full border font-mono uppercase tracking-wider ${
                    roleStyles[senderRole] || roleStyles.student
                  }`}
                >
                  {senderRole}
                </span>
                <span className="text-[10px] text-[#788078]">
                  {formatTimestamp(msg.createdAt)}
                </span>
              </div>
            )}

            {/* Bubble with Dark Tech palette */}
            <div
              className={`max-w-[75%] sm:max-w-md rounded-2xl px-4 py-2.5 text-sm break-words transition-all ${
                isOwn
                  ? "bg-[#B8FF5A] text-[#070807] font-semibold rounded-tr-xs shadow-md shadow-[#B8FF5A]/20 border border-[#D7FF7A]/30"
                  : "bg-[#111511] rounded-tl-xs text-[#F4F7EE] border border-[#263026] hover:border-[#263026]/90 shadow-sm"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              {isOwn && (
                <span className="block text-right text-[10px] text-[#070807]/75 font-mono font-medium mt-1">
                  {formatTimestamp(msg.createdAt)}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
