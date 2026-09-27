import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChatSocket } from "../../context/SocketContext";
import { LogOut, ToggleLeft, ToggleRight, MessageSquare, Users, Sparkles } from "lucide-react";
import Logo from "../Common/Logo";

export default function Navbar({ currentView = "chat", onSelectView }) {
  const { user, logout, updateWellnessConsent } = useAuth();
  const { socket, onlineUsers } = useChatSocket();
  const [isTogglingConsent, setIsTogglingConsent] = useState(false);

  const isConnected = !!socket?.connected;
  const isCounselorOrAdmin = user?.role === "counselor" || user?.role === "admin";

  const roleBadgeStyles = {
    student: "bg-[#B8FF5A]/15 text-[#B8FF5A] border-[#B8FF5A]/30",
    counselor: "bg-[#69E86C]/20 text-[#69E86C] border-[#69E86C]/40",
    admin: "bg-[#5DE4FF]/20 text-[#5DE4FF] border-[#5DE4FF]/40"
  };

  const handleToggleConsent = async () => {
    if (!user || isTogglingConsent) return;
    try {
      setIsTogglingConsent(true);
      await updateWellnessConsent(!user.optedIntoWellnessMonitoring);
    } catch (err) {
      console.error("Toggle wellness consent failed:", err);
    } finally {
      setIsTogglingConsent(false);
    }
  };

  return (
    <header className="h-16 border-b border-[#263026] bg-[#070807]/95 backdrop-blur-xl px-6 flex items-center justify-between z-10 select-none shadow-[0_4px_24px_-4px_rgba(0,0,0,0.8),0_1px_0_0_rgba(38,48,38,0.5)]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[#B8FF5A]/20 rounded-full blur-md" />
            <Logo size={32} className="relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-[#F4F7EE] font-heading">Silent Alarm</h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#B8FF5A]/15 text-[#B8FF5A] border border-[#B8FF5A]/30">
                LIVE
              </span>
            </div>
            <p className="text-xs text-[#788078]">Reading rhythm, not words</p>
          </div>
        </div>

        {/* View Switcher Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-[#111511] border border-[#263026] shadow-inner">
          <button
            onClick={() => onSelectView?.("chat")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer font-heading ${
              currentView === "chat"
                ? "tech-btn-primary text-[#070807] shadow-sm"
                : "text-[#788078] hover:text-[#F4F7EE] hover:bg-[#161B16]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => onSelectView?.("wellness")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer font-heading ${
              currentView === "wellness"
                ? "tech-btn-primary text-[#070807] shadow-sm"
                : "text-[#788078] hover:text-[#F4F7EE] hover:bg-[#161B16]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>My Wellness</span>
          </button>

          {isCounselorOrAdmin && (
            <button
              onClick={() => onSelectView?.("counselor")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer font-heading ${
                currentView === "counselor"
                  ? "bg-[#69E86C] text-[#070807] shadow-md shadow-[#69E86C]/25"
                  : "text-[#788078] hover:text-[#F4F7EE] hover:bg-[#161B16]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Counselor Hub</span>
            </button>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Status */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111511] border border-[#263026] shadow-inner text-xs">
          <span className="relative flex h-2 w-2">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#69E86C] opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? "bg-[#69E86C] shadow-[0_0_8px_#69E86C]" : "bg-[#788078]/50"
              }`}
            ></span>
          </span>
          <span className="text-[#788078] font-medium font-mono text-[11px]">
            {isConnected ? `ONLINE (${onlineUsers.length})` : "CONNECTING..."}
          </span>
        </div>

        {/* User Info & Wellness Consent Toggle */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-[#263026]">
            {/* Interactive Wellness Monitoring Consent Toggle */}
            <button
              type="button"
              onClick={handleToggleConsent}
              disabled={isTogglingConsent}
              title={`Click to ${user.optedIntoWellnessMonitoring ? "pause" : "enable"} wellness rhythm monitoring`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                user.optedIntoWellnessMonitoring
                  ? "bg-[#161B16] border-[#69E86C]/40 text-[#F4F7EE] shadow-sm shadow-[#69E86C]/10 hover:border-[#69E86C]/60"
                  : "tech-input border-[#263026] text-[#788078] hover:text-[#F4F7EE] hover:border-[#69E86C]/40"
              }`}
            >
              <Logo
                size={16}
                className={user.optedIntoWellnessMonitoring ? "opacity-90 drop-shadow-[0_0_4px_#B8FF5A]" : "opacity-30 grayscale"}
              />
              <span className="hidden lg:inline font-mono text-[11px]">
                Rhythm: {user.optedIntoWellnessMonitoring ? "Active" : "Off"}
              </span>
              {user.optedIntoWellnessMonitoring ? (
                <ToggleRight className="w-4 h-4 text-[#69E86C]" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-[#788078]" />
              )}
            </button>

            <div className="text-right hidden md:block">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium text-[#F4F7EE]">{user.username}</span>
                {user.optedIntoWellnessMonitoring && (
                  <span title="Wellness rhythm monitoring is active" className="flex items-center">
                    <Logo size={14} className="opacity-40 hover:opacity-90 transition drop-shadow-[0_0_4px_#B8FF5A]" />
                  </span>
                )}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-semibold uppercase tracking-wider ${
                    roleBadgeStyles[user.role] || roleBadgeStyles.student
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-[#788078] hover:text-[#FF5C5C] hover:bg-[#161B16] border border-transparent hover:border-[#263026] transition cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
