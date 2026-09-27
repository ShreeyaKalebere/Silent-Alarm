import React, { useState } from "react";
import { useChatSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useKeystrokeCapture } from "../../hooks/useKeystrokeCapture";
import { Send } from "lucide-react";

export default function MessageInput() {
  const { sendMessage, activeRoom, activeRoomName } = useChatSocket();
  const { user } = useAuth();
  const [text, setText] = useState("");

  const isWellnessMonitoringActive = Boolean(user?.optedIntoWellnessMonitoring);

  // Hook handles completely invisible anonymous numeric cadence telemetry (zero key identity, zero text)
  const {
    handleKeyDown: captureKeyDown,
    handleKeyUp: captureKeyUp,
    handleInputChange: captureInputChange,
    handleMessageSent: captureMessageSent
  } = useKeystrokeCapture({
    roomId: activeRoom,
    enabled: isWellnessMonitoringActive
  });

  const handleSend = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;

    // Trigger anonymous timing feature packaging and dispatch
    captureMessageSent();

    sendMessage(text);
    setText("");
  };

  const handleKeyDown = (e) => {
    captureKeyDown(e);

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    captureInputChange(val.length);
  };

  return (
    <footer className="p-4 border-t border-[#263026] bg-[#0C0F0C]/80 backdrop-blur-md shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.5)]">
      <form onSubmit={handleSend} className="relative flex items-center">
        {/* Keystroke tracking is completely invisible during typing */}
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={captureKeyUp}
          placeholder={`Message ${activeRoomName}...`}
          className="w-full pl-5 pr-14 py-3.5 tech-input rounded-2xl text-sm placeholder-[#788078]/50 text-[#F4F7EE]"
        />

        <div className="absolute right-2.5 flex items-center">
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 tech-btn-primary disabled:bg-[#111511] disabled:shadow-none disabled:border-[#263026] disabled:text-[#788078]/40 text-[#070807] rounded-xl transition cursor-pointer disabled:cursor-not-allowed"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </footer>
  );
}
