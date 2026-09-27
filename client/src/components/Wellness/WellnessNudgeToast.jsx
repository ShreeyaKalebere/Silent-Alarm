import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChatSocket } from "../../context/SocketContext";
import { api } from "../../services/api";
import { X, Phone, Wind, ExternalLink, ShieldCheck, HeartHandshake } from "lucide-react";
import Logo from "../Common/Logo";

export default function WellnessNudgeToast() {
  const { token } = useAuth();
  const { socket } = useChatSocket();
  const [currentNudge, setCurrentNudge] = useState(null);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleNudge = (nudgeData) => {
      console.log("[Wellness Nudge Received]:", nudgeData);
      setCurrentNudge(nudgeData);
    };

    socket.on("wellness_nudge", handleNudge);

    return () => {
      socket.off("wellness_nudge", handleNudge);
    };
  }, [socket]);

  const handleDismiss = async () => {
    if (!currentNudge) return;
    try {
      setIsResolving(true);
      if (currentNudge.alertId && token) {
        await api.resolveWellnessAlert(currentNudge.alertId, "dismissed_by_user", token);
      }
    } catch (err) {
      console.error("Failed to resolve alert as dismissed:", err);
    } finally {
      setIsResolving(false);
      setCurrentNudge(null);
    }
  };

  const handleOpenResources = async () => {
    setShowResourcesModal(true);
    try {
      if (currentNudge?.alertId && token) {
        await api.resolveWellnessAlert(currentNudge.alertId, "resource_viewed", token);
      }
    } catch (err) {
      console.error("Failed to resolve alert as resource viewed:", err);
    }
  };

  const handleCloseResources = () => {
    setShowResourcesModal(false);
    setCurrentNudge(null);
  };

  if (!currentNudge && !showResourcesModal) return null;

  return (
    <>
      {/* Non-blocking Warm Nudge Toast in Bottom-Right Corner (~320px wide) */}
      {currentNudge && !showResourcesModal && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 w-[320px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="bg-[#161B16] border border-[#263026] border-l-2 border-l-[#9BEF8A] rounded-[12px] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-start justify-between gap-2 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#111511] border border-[#263026] flex items-center justify-center shrink-0">
                  <Logo size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#F4F7EE]">
                    Gentle check-in
                  </h4>
                  <p className="text-[11px] text-[#788078]">Silent Alarm companion</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                disabled={isResolving}
                className="text-[#788078] hover:text-[#F4F7EE] p-1 rounded-lg hover:bg-[#111511] transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-sm text-[#F4F7EE] leading-relaxed relative z-10">
              Hey, just checking in — everything okay?
            </p>

            <div className="flex items-center gap-2 pt-1 relative z-10">
              <button
                onClick={handleDismiss}
                disabled={isResolving}
                className="flex-1 px-3 py-2 rounded-xl bg-[#111511] border border-[#263026] hover:border-[#9BEF8A]/30 text-[#788078] hover:text-[#F4F7EE] text-xs font-medium transition cursor-pointer"
              >
                I&apos;m good
              </button>
              <button
                onClick={handleOpenResources}
                className="flex-1 px-3 py-2 rounded-xl bg-[#9BEF8A]/15 border border-[#9BEF8A]/30 hover:bg-[#9BEF8A]/25 text-xs font-medium text-[#9BEF8A] transition cursor-pointer"
              >
                Take a moment
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Low-Pressure Campus Supportive Resources Dialog */}
      {showResourcesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="rounded-3xl max-w-md w-full p-6 shadow-2xl text-[#F4F7EE] flex flex-col gap-4 relative overflow-hidden bg-[#161B16] border border-[#263026]">
            {/* Top soft green shimmer accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9BEF8A]/35 to-transparent" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#9BEF8A]/15 border border-[#9BEF8A]/30 flex items-center justify-center text-[#9BEF8A] shadow-inner">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#F4F7EE]">Campus Wellness Resources</h3>
                  <p className="text-xs text-[#788078]">Confidential, calm, and always available</p>
                </div>
              </div>
              <button
                onClick={handleCloseResources}
                className="text-[#788078] hover:text-[#F4F7EE] p-1.5 rounded-xl hover:bg-[#111511] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#788078] leading-relaxed bg-[#111511] p-3.5 rounded-xl border border-[#263026] flex items-center gap-2.5 shadow-inner">
              <ShieldCheck className="w-4 h-4 text-[#9BEF8A] shrink-0" />
              <span>
                Your privacy is guaranteed. Exploring these resources is strictly confidential.
              </span>
            </div>

            {/* Resource Cards */}
            <div className="flex flex-col gap-2.5">
              {/* Resource 1 */}
              <div className="p-3.5 rounded-2xl bg-[#111511] border border-[#263026] hover:border-[#9BEF8A]/30 flex items-start gap-3 transition">
                <div className="p-2.5 rounded-xl bg-[#9BEF8A]/15 border border-[#9BEF8A]/30 text-[#9BEF8A] shrink-0 shadow-inner">
                  <Wind className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-[#F4F7EE]">4-7-8 Guided Breathing Reset</h4>
                  <p className="text-[11px] text-[#788078] mt-0.5 leading-relaxed">
                    Inhale through nose for 4s, hold for 7s, exhale completely for 8s. Repeat 4 times to regulate cadence.
                  </p>
                </div>
              </div>

              {/* Resource 2 */}
              <div className="p-3.5 rounded-2xl bg-[#111511] border border-[#263026] hover:border-[#69E86C]/30 flex items-start gap-3 transition">
                <div className="p-2.5 rounded-xl bg-[#69E86C]/15 border border-[#69E86C]/30 text-[#69E86C] shrink-0 shadow-inner">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-[#F4F7EE]">Student Crisis &amp; Support Line</h4>
                  <p className="text-[11px] text-[#788078] mt-0.5 leading-relaxed">
                    Free 24/7 confidential support: Text <span className="text-[#9BEF8A] font-mono font-semibold">HOME</span> to <span className="text-[#9BEF8A] font-mono font-semibold">741741</span> or call <span className="text-[#9BEF8A] font-mono font-semibold">988</span>.
                  </p>
                </div>
              </div>

              {/* Resource 3 */}
              <div className="p-3.5 rounded-2xl bg-[#111511] border border-[#263026] hover:border-[#9BEF8A]/30 flex items-start gap-3 transition">
                <div className="p-2.5 rounded-xl bg-[#9BEF8A]/15 border border-[#9BEF8A]/30 text-[#9BEF8A] shrink-0 shadow-inner">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-[#F4F7EE]">Campus Counseling Appointment</h4>
                  <p className="text-[11px] text-[#788078] mt-0.5 leading-relaxed">
                    Book a free, confidential 1-on-1 session with campus counselors during regular semester hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleCloseResources}
                className="px-4 py-2 rounded-xl bg-[#111511] border border-[#263026] hover:border-[#9BEF8A]/30 text-xs font-medium text-[#788078] hover:text-[#F4F7EE] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
