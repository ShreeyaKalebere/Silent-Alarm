import React from "react";
import { useChatSocket } from "../../context/SocketContext";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { Hash, AtSign } from "lucide-react";

export default function ChatArea() {
  const { activeRoom, activeRoomName } = useChatSocket();
  const isDirectMessage = activeRoom.startsWith("@") || activeRoom.includes("_");

  return (
    <main className="flex-1 flex flex-col h-full bg-[#070807]">
      {/* Room Header */}
      <header className="h-14 border-b border-[#263026] px-6 flex items-center justify-between bg-[#0C0F0C]/80 backdrop-blur-sm select-none">
        <div className="flex items-center gap-2.5">
          {isDirectMessage ? (
            <div className="w-8 h-8 rounded-lg bg-[#111511] border border-[#263026] flex items-center justify-center text-[#69E86C]">
              <AtSign className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#111511] border border-[#263026] flex items-center justify-center text-[#788078]">
              <Hash className="w-4 h-4" />
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-[#F4F7EE] flex items-center gap-2">
              {activeRoomName}
            </h2>
            <p className="text-[11px] text-[#788078]">
              {isDirectMessage
                ? "Private 1-on-1 direct conversation"
                : "Public channel • Messages visible to all members"}
            </p>
          </div>
        </div>
      </header>

      {/* Messages Feed */}
      <MessageList />

      {/* Input Form */}
      <MessageInput />
    </main>
  );
}
