import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  RotateCcw
} from "lucide-react";

const INITIAL_MESSAGES = [
  {
    sender: "bot",
    text: "👋 Hi! I'm your **Silent Alarm AI Wellness Assistant**. I can explain what any typing metric means, how our machine learning detects distress, how your privacy is guarded, or guide you through a live test. What would you like to know?"
  }
];

const SUGGESTED_QUESTIONS = [
  "What is Dwell Time?",
  "What is Flight Time?",
  "How does AI detect distress?",
  "Are my chat messages private?",
  "What is Dual-Threshold escalation?",
  "How do I test accuracy live?",
  "Guide me through breathing"
];

function getBotReply(userQuery) {
  const q = userQuery.toLowerCase().trim();

  // Dwell Time
  if (q.includes("dwell") || q.includes("hold key") || q.includes("key press")) {
    return `🕒 **Dwell Time (Key Hold Duration)**
- **What it is**: The exact milliseconds your finger physically holds down a key before releasing it.
- **Normal Baseline**: **70ms – 110ms** for natural fluent typing.
- **When Distressed**: Spikes to **200ms – 350ms+**. This occurs during physical exhaustion, depressive lethargy, crying, or psychological 'freezing' where your motor system slows down.`;
  }

  // Flight Time
  if (q.includes("flight") || q.includes("speed between") || q.includes("tempo") || q.includes("rhythm")) {
    return `⚡ **Flight Time (Rhythm Between Keys)**
- **What it is**: The millisecond gap between releasing one key and pressing down the next key.
- **Normal Baseline**: **90ms – 140ms** during steady, confident typing.
- **When Distressed**: Jumps to **350ms – 500ms+** with irregular variance. This reveals cognitive overload, stuttered cadence, severe anxiety, or distraction.`;
  }

  // Pauses / Hesitations
  if (q.includes("pause") || q.includes("hesitat") || q.includes("stop")) {
    return `🛑 **Hesitation Pauses (>750ms)**
- **What it is**: Unusually long interruptions (longer than three-quarters of a second) in the middle of sentences or thoughts.
- **Normal Baseline**: **0 to 2 pauses** per message.
- **When Distressed**: Spikes to **8 – 15+ pauses** in a single short message. It reflects struggling to articulate thoughts, fighting back tears, or severe distress.`;
  }

  // Backspaces / Corrections
  if (q.includes("backspace") || q.includes("delet") || q.includes("correct") || q.includes("error rate")) {
    return `⌫ **Backspace & Revision Frequency**
- **What it is**: The percentage of your keystrokes dedicated to deleting, editing, or correcting letters.
- **Normal Baseline**: **3% – 8%** of total strokes.
- **When Distressed**: Surpasses **25% – 40%**. High deletion rates indicate intense second-guessing, nervousness, self-doubt, panic, or agitated typing.`;
  }

  // AI Distress Score
  if (q.includes("score") || q.includes("distress") || q.includes("anomaly") || q.includes("model")) {
    return `🧠 **AI Distress Score (0.00 – 1.00)**
- **What it is**: A combined output of two independent neural models:
  1. **Isolation Forest**: Catches sharp, instantaneous outliers in dwell time and pauses.
  2. **PyTorch LSTM Autoencoder**: Reconstructs your sequence timing to detect multi-sentence fatigue or emotional drift.
- **Scale**:
  - \`< 0.40\`: **Calm & Natural Cadence** (Normal).
  - \`0.40 – 0.69\`: **Moderate Strain** (Monitored, no alerts).
  - \`≥ 0.70\`: **Elevated Distress Anomaly**.
- **Safeguard**: 1 typo will never sound an alarm. The system requires **3 consecutive elevated events** before offering a self-care check-in.`;
  }

  // Baseline Calibration
  if (q.includes("baseline") || q.includes("calibrat") || q.includes("learning")) {
    return `📊 **Personal Baseline Calibration**
- **Why it exists**: Everyone types differently! A 110 WPM gamer and a 35 WPM casual typist have vastly different normal speeds.
- **How it works**: Silent Alarm learns your individual mean and standard deviations over your first **~50 messages**.
- **Accuracy Guarantee**: You are only ever compared against **yourself**, never against a generic population average. Before calibration is complete, the AI refuses to issue false distress alerts.`;
  }

  // Privacy / Zero-Text
  if (q.includes("priva") || q.includes("word") || q.includes("text") || q.includes("read") || q.includes("message") || q.includes("letter") || q.includes("spy")) {
    return `🛡️ **Zero-Content Privacy Guarantee**
1. **No Letters or Text**: The browser hook strips out all character names, letters, words, and passwords. It records strictly arithmetic numbers (e.g. \`{ dwell: 84, flight: 112 }\`).
2. **Backend Firewall**: The server actively rejects any payload containing forbidden fields like \`text\` or \`content\`.
3. **30-Day Auto-Purge**: All typing data automatically self-destructs after 30 days via a MongoDB TTL index.
4. **GDPR Right to Erasure**: You can click **"Purge My Telemetry"** in the "My Wellness" tab to permanently wipe all your records instantly.`;
  }

  // Counselor / Escalation
  if (q.includes("counselor") || q.includes("escalat") || q.includes("admin") || q.includes("doctor") || q.includes("teacher")) {
    return `👥 **Dual-Threshold Counselor Safeguard**
Counselors **NEVER** see individual student identities or private messages by default. They only see aggregate, anonymous campus health charts.

A student's identity is surfaced to a counselor **ONLY** when both safeguards are breached:
1. **3 or more unresolved high-severity distress sessions** occur, **AND**
2. The student has **dismissed 2 or more self-care nudges** without behavioral improvement.

This protects student autonomy and prevents intrusive or premature outreach.`;
  }

  // How to Test Live
  if (q.includes("test") || q.includes("how to check") || q.includes("accura") || q.includes("try")) {
    return `🧪 **How to Test Live Accuracy Right Now**
1. **Normal Test**: Type a sentence smoothly and naturally in \`#general\` (e.g., *"Hey everyone, let's meet at the library today"*). Press Enter. Check your score in **My Wellness**: it will be **~0.10 – 0.20 (Calm)**.
2. **Distressed Simulation**: Type very slowly, hold keys down firmly for a third of a second, pause for 2-3 seconds mid-word, and repeatedly delete words with Backspace. Press Enter. Your score will jump to **~0.85 – 0.95 (High Distress)**!
3. If you repeat the distressed simulation 3 times consecutively, a wellness self-care prompt will pop up on your screen.`;
  }

  // Breathing Exercise
  if (q.includes("breath") || q.includes("calm") || q.includes("relax") || q.includes("exercise") || q.includes("help")) {
    return `🌿 **4-7-8 Relaxing Breathing Exercise**
Let's take a quick 1-minute reset together:
1. **Breathe In** gently through your nose for **4 seconds**... (1... 2... 3... 4)
2. **Hold your breath** calmly for **7 seconds**... (1... 2... 3... 4... 5... 6... 7)
3. **Exhale slowly** through your mouth for **8 seconds**... (1... 2... 3... 4... 5... 6... 7... 8)

*Repeating this cycle 3 times immediately lowers your heart rate and resets your nervous system!*`;
  }

  // Fallback
  return `💡 I'm here to explain anything about **Silent Alarm**! You can ask me:
- *"What is Dwell Time vs Flight Time?"*
- *"How does the AI detect emotional distress?"*
- *"Are my chat words and letters private?"*
- *"What is the Dual-Threshold rule for counselors?"*
- *"How can I test the accuracy live?"*
- *"Can you guide me through a calming breathing exercise?"*`;
}

export default function WellnessChatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const newMessages = [...messages, { sender: "user", text }];
    setMessages(newMessages);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot thinking
    setTimeout(() => {
      const reply = getBotReply(text);
      setMessages([...newMessages, { sender: "bot", text: reply }]);
      setIsTyping(false);
    }, 450);
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-black/80 backdrop-blur-md flex justify-center items-start pt-6 sm:pt-10 pb-6 animate-in fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ height: "82vh", minHeight: "500px", maxHeight: "720px" }}
        className="tech-card-glow rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden relative text-[#F4F7EE] bg-[#161B16] border border-[#263026]"
      >
        {/* Top neon lime shimmer bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B8FF5A]/40 to-transparent" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#263026] flex items-center justify-between bg-[#0C0F0C] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[#B8FF5A]/20 rounded-2xl blur-md" />
              <div className="w-10 h-10 rounded-2xl bg-[#111511] border border-[#263026] flex items-center justify-center shrink-0 relative z-10 shadow-inner">
                <Bot className="w-5 h-5 text-[#69E86C]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#F4F7EE]">Silent Alarm Wellness AI</h3>
                <span className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#69E86C]/15 text-[#69E86C] border border-[#69E86C]/30 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#69E86C] animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs text-[#788078]">Ask anything about metrics, AI models, and privacy rules</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetChat}
              title="Reset conversation"
              className="p-2 rounded-xl text-[#788078] hover:text-[#F4F7EE] hover:bg-[#111511] transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close chat"
              className="p-2 rounded-xl text-[#788078] hover:text-[#F4F7EE] hover:bg-[#111511] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggested Quick Questions */}
        <div className="px-4 py-2.5 border-b border-[#263026] bg-[#0C0F0C]/80 flex items-center gap-2 overflow-x-auto flex-shrink-0 scrollbar-none">
          <span className="text-[10px] font-medium text-[#788078] shrink-0">Quick ask:</span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 rounded-full bg-[#111511] border border-[#263026] hover:border-[#69E86C]/40 text-[#788078] hover:text-[#F4F7EE] text-[11px] font-medium transition whitespace-nowrap cursor-pointer shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Thread Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.sender === "bot" && (
                <div className="w-8 h-8 rounded-xl bg-[#0C0F0C] border border-[#263026] text-[#69E86C] flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[#B8FF5A] text-[#070807] font-semibold rounded-tr-xs shadow-md shadow-[#B8FF5A]/20 border border-[#D7FF7A]/30"
                    : "bg-[#0C0F0C] border border-[#263026] rounded-tl-xs text-[#F4F7EE] whitespace-pre-line shadow-inner"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-[#788078] italic pl-10">
              <span className="w-2 h-2 rounded-full bg-[#69E86C] animate-ping" />
              <span>Wellness AI is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 border-t border-[#263026] bg-[#0C0F0C] flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about Dwell Time, Privacy, AI scores, or Counselor rules..."
              className="flex-1 tech-input text-xs text-[#F4F7EE] rounded-xl px-4 py-3 outline-none placeholder:text-[#788078]/50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-4 py-3 rounded-xl tech-btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-[#070807] text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-[#788078] mt-2 px-1 font-medium">
            <span>Silent Alarm AI Knowledge Assistant</span>
            <span>Zero-content privacy enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
