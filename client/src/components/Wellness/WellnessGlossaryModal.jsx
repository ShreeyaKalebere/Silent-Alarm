import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Clock,
  Zap,
  Activity,
  Delete,
  AlertTriangle,
  Brain,
  Sparkles,
  Lock
} from "lucide-react";
import Logo from "../Common/Logo";

export default function WellnessGlossaryModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("metrics"); // "metrics" | "how-it-works" | "privacy"

  if (!isOpen) return null;

  const metrics = [
    {
      name: "Dwell Time (Key Hold Duration)",
      icon: <Clock className="w-4 h-4 text-[#69E86C]" />,
      tag: "Physical Metric",
      tagColor: "border-[#69E86C]/30 text-[#69E86C] bg-[#69E86C]/10",
      normal: "60 ms – 110 ms",
      meaning: "How long your finger physically holds down each individual key before letting go.",
      distressIndicator:
        "Jumping to 200ms+ happens during extreme fatigue, numbness, depressive lethargy, or the psychological 'freeze' response."
    },
    {
      name: "Flight Time (Rhythm Between Keys)",
      icon: <Zap className="w-4 h-4 text-[#69E86C]" />,
      tag: "Tempo Metric",
      tagColor: "border-[#69E86C]/30 text-[#69E86C] bg-[#69E86C]/10",
      normal: "90 ms – 150 ms",
      meaning: "The millisecond gap between releasing one key and pressing the next key.",
      distressIndicator:
        "Irregular, choppy flight times (300ms–500ms) indicate cognitive overload, anxiety, hesitation, or emotional distraction."
    },
    {
      name: "Hesitation Pauses (>750ms)",
      icon: <Activity className="w-4 h-4 text-[#69E86C]" />,
      tag: "Cognitive Metric",
      tagColor: "border-[#69E86C]/30 text-[#69E86C] bg-[#69E86C]/10",
      normal: "1 – 3 pauses per paragraph",
      meaning: "Unusual pauses longer than 750 milliseconds that occur in the middle of sentences or thoughts.",
      distressIndicator:
        "Frequent unexpected pauses in a single message reflect struggling to articulate words, crying, or intense stress."
    },
    {
      name: "Backspace & Correction Rate",
      icon: <Delete className="w-4 h-4 text-[#69E86C]" />,
      tag: "Behavioral Metric",
      tagColor: "border-[#69E86C]/30 text-[#69E86C] bg-[#69E86C]/10",
      normal: "3% – 8% of keystrokes",
      meaning: "The percentage of your total keystrokes dedicated to deleting, correcting, and re-typing words.",
      distressIndicator:
        "Spiking over 25% reveals second-guessing, extreme self-criticism, nervousness, or agitation."
    },
    {
      name: "Distress Anomaly Score (0.00 – 1.00)",
      icon: <Brain className="w-4 h-4 text-[#B8FF5A]" />,
      tag: "AI Ensemble Output",
      tagColor: "border-[#B8FF5A]/30 text-[#B8FF5A] bg-[#B8FF5A]/10",
      normal: "< 0.40 (Calm & Fluid)",
      meaning:
        "A composite score combining an Isolation Forest (point anomaly) and a PyTorch LSTM Autoencoder (temporal drift).",
      distressIndicator:
        "Scores >= 0.70 mean your current typing rhythm deviates noticeably from your personal established baseline."
    },
    {
      name: "Personal Baseline Calibration",
      icon: <Sparkles className="w-4 h-4 text-[#69E86C]" />,
      tag: "Safeguard Standard",
      tagColor: "border-[#69E86C]/30 text-[#69E86C] bg-[#69E86C]/10",
      normal: "Requires ~50 chat messages",
      meaning:
        "Calculates your personal mean and standard deviations so you are never judged against arbitrary campus averages.",
      distressIndicator:
        "Prevents false positives. A fast typist and slow typist are evaluated purely against their own habitual tempos."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="tech-card-glow rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[#F4F7EE] relative bg-[#161B16] border border-[#263026]">
        {/* Top neon lime shimmer bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B8FF5A]/40 to-transparent" />

        {/* Modal Header */}
        <div className="p-5 border-b border-[#263026] flex items-center justify-between bg-[#0C0F0C] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#111511] border border-[#263026] flex items-center justify-center shrink-0 shadow-inner">
              <Logo size={24} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#F4F7EE]">Silent Alarm Rhythm Guide</h3>
              <p className="text-xs text-[#788078]">
                How keystroke cadence translates into emotional wellness insights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#788078] hover:text-[#F4F7EE] p-1.5 rounded-xl hover:bg-[#111511] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-[#263026] bg-[#0C0F0C]/80 flex gap-2 flex-shrink-0">
          {[
            { id: "metrics", label: "Typing Metrics Glossary" },
            { id: "how-it-works", label: "How It Works" },
            { id: "privacy", label: "Privacy Safeguards" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 -mb-[1px] cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#B8FF5A] text-[#F4F7EE] bg-[#111511] shadow-sm"
                  : "border-transparent text-[#788078] hover:text-[#F4F7EE]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: METRICS GLOSSARY */}
          {activeTab === "metrics" && (
            <div className="space-y-3">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#111511] border border-[#263026] hover:border-[#69E86C]/40 transition flex flex-col gap-2 shadow-inner"
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#0C0F0C] border border-[#263026]">
                        {m.icon}
                      </div>
                      <h4 className="text-xs font-semibold text-[#F4F7EE]">{m.name}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${m.tagColor}`}
                    >
                      {m.tag}
                    </span>
                  </div>

                  <p className="text-xs text-[#788078] leading-relaxed">{m.meaning}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pt-2 border-t border-[#263026] text-[11px]">
                    <div className="p-2 rounded-lg bg-[#0C0F0C] border border-[#263026]">
                      <span className="text-[#788078] block font-mono">Normal Baseline:</span>
                      <span className="text-[#69E86C] font-medium">{m.normal}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0C0F0C] border border-[#263026]">
                      <span className="text-[#788078] block font-mono">Distress Indicator:</span>
                      <span className="text-[#788078] font-medium leading-snug">{m.distressIndicator}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: HOW IT WORKS */}
          {activeTab === "how-it-works" && (
            <div className="space-y-3 text-xs text-[#788078] leading-relaxed">
              <div className="p-4 rounded-xl bg-[#111511] border border-[#263026]">
                <h4 className="text-sm font-medium text-[#F4F7EE] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#69E86C]/20 text-[#69E86C] flex items-center justify-center font-mono text-xs">
                    1
                  </span>
                  <span>Continuous Background Rhythm Calculation</span>
                </h4>
                <p className="mt-2 text-[#788078] pl-7">
                  While you type in everyday chat, a browser hook measures the microscopic time differences between
                  your key presses. It completely ignores what letters or words you type and captures strictly
                  arithmetic millisecond intervals.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111511] border border-[#263026]">
                <h4 className="text-sm font-medium text-[#F4F7EE] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#69E86C]/20 text-[#69E86C] flex items-center justify-center font-mono text-xs">
                    2
                  </span>
                  <span>Personal Baseline Matching (Not General Rules)</span>
                </h4>
                <p className="mt-2 text-[#788078] pl-7">
                  A fast typist has a different rhythm than someone typing slowly. The system stores
                  your historical mean and standard deviations in a private database. Distress is only detected when{" "}
                  <strong className="text-[#F4F7EE]">your own rhythm deviates from yourself</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111511] border border-[#263026]">
                <h4 className="text-sm font-medium text-[#F4F7EE] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#69E86C]/20 text-[#69E86C] flex items-center justify-center font-mono text-xs">
                    3
                  </span>
                  <span>Dual AI Cross-Validation</span>
                </h4>
                <p className="mt-2 text-[#788078] pl-7">
                  Two AI models evaluate every message: an <strong>Isolation Forest</strong> checks for sudden spikes,
                  while an <strong>LSTM Autoencoder</strong> evaluates multi-sentence temporal drift. Both models must
                  corroborate an anomaly before an elevated score is issued.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111511] border border-[#263026]">
                <h4 className="text-sm font-medium text-[#F4F7EE] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#69E86C]/20 text-[#69E86C] flex items-center justify-center font-mono text-xs">
                    4
                  </span>
                  <span>The 3-Consecutive-Event Safeguard</span>
                </h4>
                <p className="mt-2 text-[#788078] pl-7">
                  Having a single typo, a bad minute, or answering a phone call will <strong>never</strong> trigger a
                  wellness alert. The system requires <strong className="text-[#F4F7EE]">3 consecutive messages</strong> of
                  sustained distress before delivering a private self-care prompt.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & SAFEGUARDS */}
          {activeTab === "privacy" && (
            <div className="space-y-3 text-xs text-[#788078] leading-relaxed">
              <div className="p-4 rounded-xl bg-[#111511] border border-[#263026]">
                <h4 className="text-sm font-medium text-[#F4F7EE] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#69E86C]" />
                  <span>The Zero-Content Privacy Guarantee</span>
                </h4>
                <p className="mt-2 text-[#788078]">
                  We believe mental health support should never require surveillance. The backend actively blocks and
                  rejects any incoming network payload containing letters, words, keys, or message text. The system
                  has no ability to reconstruct what you typed.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111511] border border-[#263026]">
                <h4 className="text-sm font-medium text-[#F4F7EE] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#69E86C]" />
                  <span>30-Day Auto-Expiring Data (TTL Index)</span>
                </h4>
                <p className="mt-2 text-[#788078]">
                  Typing vectors are automatically destroyed by the database after 30 days. No permanent lifetime
                  profiles are maintained.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111511] border border-[#263026]">
                <h4 className="text-sm font-medium text-[#F4F7EE] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#69E86C]" />
                  <span>Dual-Threshold Counselor Safeguard</span>
                </h4>
                <p className="mt-2 text-[#788078]">
                  Counselors only see anonymous campus graphs. A student&apos;s identity is protected unless BOTH of the
                  following conditions are satisfied:
                </p>
                <ul className="mt-2 space-y-1 list-disc list-inside text-[#F4F7EE] font-medium">
                  <li>The student has 3 or more unresolved high-severity distress sessions.</li>
                  <li>The student has repeatedly dismissed self-care nudges without improvement.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#111511] border border-[#263026]">
                <h4 className="text-sm font-medium text-[#F4F7EE] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#69E86C]" />
                  <span>GDPR Right to Erasure &amp; Instant Opt-Out</span>
                </h4>
                <p className="mt-2 text-[#788078]">
                  Students retain 100% ownership of their experience. At any second, a student can toggle monitoring off
                  or hit the &ldquo;Purge My Data&rdquo; button to immediately wipe every stored metric from the database.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#263026] bg-[#0C0F0C] flex items-center justify-between text-xs text-[#788078] flex-shrink-0">
          <span>Silent Alarm • Reading rhythm, not words</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl tech-btn-primary text-[#070807] font-semibold transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
