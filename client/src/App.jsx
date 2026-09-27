import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import Navbar from "./components/Chat/Navbar";
import Sidebar from "./components/Chat/Sidebar";
import ChatArea from "./components/Chat/ChatArea";
import WellnessConsentModal from "./components/Wellness/WellnessConsentModal";
import WellnessNudgeToast from "./components/Wellness/WellnessNudgeToast";
import MyWellnessPage from "./pages/MyWellnessPage";
import CounselorDashboardPage from "./pages/CounselorDashboardPage";
import WellnessChatbot from "./components/Wellness/WellnessChatbot";
import { Bot } from "lucide-react";

import Logo from "./components/Common/Logo";

function MainApp() {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState("login"); // "login" | "register"
  const [currentView, setCurrentView] = useState("chat"); // "chat" | "wellness" | "counselor"
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showGlobalChatbot, setShowGlobalChatbot] = useState(false);

  useEffect(() => {
    if (user) {
      const hasSeenModal = localStorage.getItem("silent_alarm_wellness_modal_seen");
      if (!hasSeenModal) {
        queueMicrotask(() => setShowConsentModal(true));
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#070807] text-[#788078] gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-[at_50%_50%] from-[#B8FF5A]/08 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <div className="absolute inset-0 bg-[#B8FF5A]/15 rounded-full blur-xl scale-150 animate-pulse" />
          <Logo size={52} className="relative z-10 animate-pulse drop-shadow-[0_4px_16px_rgba(184,255,90,0.4)]" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-[#F4F7EE] font-heading relative z-10">
          Loading Silent Alarm...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#070807] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle Neon Lime to Tech Green Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-br from-[#B8FF5A]/08 via-[#69E86C]/05 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/6 right-1/4 w-[420px] h-[420px] bg-gradient-to-tl from-[#69E86C]/07 via-[#B8FF5A]/04 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-2/3 left-1/5 w-72 h-72 bg-[#B8FF5A]/04 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          {authView === "login" ? (
            <LoginForm onSwitchToRegister={() => setAuthView("register")} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setAuthView("login")} />
          )}
        </div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <div className="h-screen w-screen flex flex-col bg-[#070807] text-[#F4F7EE] overflow-hidden">
        <Navbar currentView={currentView} onSelectView={setCurrentView} />

        {currentView === "chat" && (
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <ChatArea />
          </div>
        )}

        {currentView === "wellness" && (
          <MyWellnessPage onBackToChat={() => setCurrentView("chat")} />
        )}

        {currentView === "counselor" && (
          <CounselorDashboardPage onBackToChat={() => setCurrentView("chat")} />
        )}

        {/* Global Wellness Nudge Toast */}
        <WellnessNudgeToast />

        {/* First-time Wellness Onboarding Consent Modal */}
        <WellnessConsentModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
        />

        {/* Floating AI Wellness Assistant Button */}
        <button
          onClick={() => setShowGlobalChatbot(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4.5 py-3 rounded-full tech-card-glow hover:border-[#B8FF5A]/50 text-[#F4F7EE] font-semibold text-xs shadow-[0_12px_28px_-6px_rgba(0,0,0,0.85),0_0_20px_-4px_rgba(184,255,90,0.25)] hover:scale-105 active:scale-95 transition cursor-pointer select-none group"
          title="Ask Wellness AI Chatbot about any metric or how it works"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-[#B8FF5A] group-hover:rotate-12 transition drop-shadow-[0_0_6px_rgba(184,255,90,0.6)]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#B8FF5A] animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#B8FF5A]" />
          </div>
          <span className="text-[#F4F7EE] font-semibold font-heading">Ask Wellness AI</span>
        </button>

        {/* Global Wellness Chatbot Modal */}
        <WellnessChatbot
          isOpen={showGlobalChatbot}
          onClose={() => setShowGlobalChatbot(false)}
        />
      </div>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
