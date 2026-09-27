import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChatSocket } from "../../context/SocketContext";
import { api } from "../../services/api";
import {
  Hash,
  HeartPulse,
  Coffee,
  MessageSquare,
  Users,
  User as UserIcon,
  RefreshCw
} from "lucide-react";

const PUBLIC_CHANNELS = [
  { id: "general", name: "General Support", icon: Hash, desc: "Campus-wide community chat" },
  { id: "study-lounge", name: "Study Lounge", icon: Coffee, desc: "Peer discussions & study tips" },
  { id: "wellness-hub", name: "Wellness Hub", icon: HeartPulse, desc: "Counseling & check-ins" },
  { id: "campus-chat", name: "Campus Life", icon: MessageSquare, desc: "Casual student banter" }
];

export default function Sidebar() {
  const { user, token } = useAuth();
  const { activeRoom, joinRoom, onlineUsers } = useChatSocket();
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const fetchUsers = React.useCallback(async () => {
    if (!token) return;
    try {
      setIsLoadingUsers(true);
      const data = await api.getUsers(token);
      setUsersList(data || []);
    } catch (err) {
      console.error("Failed to load user list:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getDmRoomId = (otherUserId) => {
    if (!user || !otherUserId) return "general";
    return [user._id, otherUserId].sort().join("_");
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some((u) => u.userId === userId);
  };

  return (
    <aside className="w-72 border-r border-[#263026] bg-[#0C0F0C] flex flex-col h-full select-none">
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {/* Channels Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-medium text-[#788078]">
              Channels
            </span>
          </div>
          <div className="space-y-1">
            {PUBLIC_CHANNELS.map((channel) => {
              const Icon = channel.icon;
              const isActive = activeRoom === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => joinRoom(channel.id, channel.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer text-left ${
                    isActive
                      ? "bg-[#B8FF5A]/15 border-l-2 border-l-[#B8FF5A] border-y border-r border-[#B8FF5A]/30 text-[#F4F7EE] font-semibold shadow-[inset_0_1px_1px_rgba(184,255,90,0.15)]"
                      : "text-[#788078] hover:bg-[#111511] hover:text-[#F4F7EE] border border-transparent"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isActive ? "bg-[#B8FF5A]/20 text-[#B8FF5A]" : "bg-[#111511] text-[#788078]"}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="block truncate text-xs font-semibold">{channel.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-medium text-[#788078] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#69E86C]" /> Direct messages
            </span>
            <button
              onClick={fetchUsers}
              title="Refresh users"
              className="p-1 text-[#788078] hover:text-[#F4F7EE] hover:bg-[#111511] transition rounded-lg"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingUsers ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="space-y-1">
            {usersList.length === 0 ? (
              <p className="px-2 py-3 text-xs text-[#788078] italic">
                {isLoadingUsers ? "Finding campus peers..." : "No peers registered yet — your campus network is quiet."}
              </p>
            ) : (
              usersList.map((otherUser) => {
                const dmRoomId = getDmRoomId(otherUser._id);
                const isActive = activeRoom === dmRoomId;
                const online = isUserOnline(otherUser._id);

                return (
                  <button
                    key={otherUser._id}
                    onClick={() => joinRoom(dmRoomId, `@${otherUser.username}`)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition cursor-pointer text-left ${
                      isActive
                        ? "bg-[#B8FF5A]/15 border-l-2 border-l-[#B8FF5A] border-y border-r border-[#B8FF5A]/30 text-[#F4F7EE] font-semibold shadow-[inset_0_1px_1px_rgba(184,255,90,0.15)]"
                        : "text-[#788078] hover:bg-[#111511] hover:text-[#F4F7EE] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-[#111511] border border-[#263026] flex items-center justify-center text-[#788078]">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0C0F0C] ${
                            online ? "bg-[#69E86C] shadow-[0_0_6px_rgba(105,232,108,0.8)]" : "bg-[#788078]/30"
                          }`}
                        />
                      </div>
                      <span className="truncate font-medium text-xs text-[#F4F7EE]">{otherUser.username}</span>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider shrink-0 border ${
                        otherUser.role === "counselor"
                          ? "bg-[#69E86C]/15 border-[#69E86C]/30 text-[#69E86C]"
                          : otherUser.role === "admin"
                          ? "bg-[#B8FF5A]/15 border-[#B8FF5A]/30 text-[#B8FF5A]"
                          : "bg-[#111511] border-[#263026] text-[#788078]"
                      }`}
                    >
                      {otherUser.role}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
