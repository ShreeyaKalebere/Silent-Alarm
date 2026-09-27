import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, Check, EyeOff } from "lucide-react";
import Logo from "../Common/Logo";

export default function WellnessConsentModal({ isOpen, onClose }) {
  const { updateWellnessConsent } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleChoice = async (optedIn) => {
    try {
      setIsUpdating(true);
      await updateWellnessConsent(optedIn);
      localStorage.setItem("silent_alarm_wellness_modal_seen", "true");
      onClose();
    } catch (err) {
      console.error("Consent update failed:", err);
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg tech-card-glow rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-[#161B16] border border-[#263026]">
        {/* Top neon lime shimmer bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B8FF5A]/40 to-transparent" />

        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8FF5A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#69E86C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-[#B8FF5A]/25 rounded-2xl blur-md" />
              <div className="w-13 h-13 rounded-2xl bg-[#111511] border border-[#263026] flex items-center justify-center shrink-0 relative z-10 shadow-inner">
                <Logo size={30} />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#F4F7EE] tracking-tight">
                Wellness Rhythm Monitoring
              </h3>
              <p className="text-xs text-[#788078]">Zero-content empathetic typing check-ins</p>
            </div>
          </div>

          {/* Plain English Core Notice */}
          <div className="p-4 bg-[#111511] border border-[#263026] rounded-2xl mb-5 shadow-inner">
            <p className="text-sm text-[#F4F7EE] leading-relaxed">
              &ldquo;We analyze typing rhythm patterns, never message content, to gently check in if you seem stressed. You can opt out anytime.&rdquo;
            </p>
          </div>

          {/* Privacy breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="p-4 bg-[#111511] border border-[#263026] rounded-2xl hover:border-[#69E86C]/40 transition">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#69E86C] mb-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>What We Measure</span>
              </div>
              <ul className="text-xs text-[#788078] space-y-1.5 pl-6 list-disc">
                <li>Key hold durations (ms)</li>
                <li>Rhythm pauses (&gt;750ms)</li>
                <li>Cadence &amp; rolling speed</li>
              </ul>
            </div>

            <div className="p-4 bg-[#111511] border border-[#263026] rounded-2xl hover:border-[#B8FF5A]/40 transition">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#B8FF5A] mb-2">
                <EyeOff className="w-4 h-4 shrink-0" />
                <span>What We Never See</span>
              </div>
              <ul className="text-xs text-[#788078] space-y-1.5 pl-6 list-disc">
                <li>No letters or keys pressed</li>
                <li>No message text or words</li>
                <li>No character logs</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleChoice(false)}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-medium text-[#788078] hover:text-[#F4F7EE] bg-[#111511] border border-[#263026] hover:border-[#263026]/80 transition cursor-pointer"
            >
              No thanks, keep standard
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleChoice(true)}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold tech-btn-primary transition cursor-pointer flex items-center justify-center gap-2 text-[#070807]"
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Accept &amp; opt in
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-[#788078]/80 text-center mt-4">
            You can change your consent preference at any time in the top right navbar.
          </p>
        </div>
      </div>
    </div>
  );
}
