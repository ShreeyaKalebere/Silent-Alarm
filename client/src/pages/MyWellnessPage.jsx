import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import {
  Activity,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  Trash2,
  Brain,
  Bot
} from "lucide-react";
import Logo from "../components/Common/Logo";
import WellnessChatbot from "../components/Wellness/WellnessChatbot";

export default function MyWellnessPage({ onBackToChat }) {
  const { user, token, refreshUser, updateWellnessConsent } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purgeStatus, setPurgeStatus] = useState(null);
  const [isPurging, setIsPurging] = useState(false);
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false);
  const [showChatbotModal, setShowChatbotModal] = useState(false);
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const [isTogglingConsent, setIsTogglingConsent] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMyWellnessHistory(token);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch my wellness history:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleToggleConsent = async () => {
    if (!user || isTogglingConsent) return;
    try {
      setIsTogglingConsent(true);
      await updateWellnessConsent(!user.optedIntoWellnessMonitoring);
      await refreshUser();
    } catch (err) {
      console.error("Failed to toggle consent:", err);
    } finally {
      setIsTogglingConsent(false);
    }
  };

  const handlePurgeData = async () => {
    try {
      setIsPurging(true);
      const res = await api.purgeWellnessData(token);
      setPurgeStatus(res.message);
      setConfirmPurgeOpen(false);
      await refreshUser();
      await fetchHistory();
      setTimeout(() => setPurgeStatus(null), 6000);
    } catch (err) {
      console.error("Failed to purge telemetry:", err);
      setError("Failed to purge telemetry data: " + err.message);
    } finally {
      setIsPurging(false);
    }
  };

  // Format chart data points
  const chartData = (data?.history || []).map((item, idx) => {
    const d = new Date(item.timestamp);
    const dateLabel = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    return {
      index: idx + 1,
      time: dateLabel,
      score: Math.round(item.distressScore * 100) / 100,
      wpm: item.wpm,
      pauseCount: item.pauseCount,
      backspaceRate: item.backspaceRate,
      factors: item.contributingFactors,
      abandoned: item.messageAbandoned
    };
  });

  return (
    <div className="flex-1 bg-[#070807] text-[#F4F7EE] overflow-y-auto p-4 sm:p-6 md:p-8">
      {/* Centered single column, max-width ~700px */}
      <div className="max-w-[700px] mx-auto flex flex-col gap-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#263026]">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToChat}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111511] border border-[#263026] text-xs font-semibold text-[#788078] hover:text-[#F4F7EE] hover:border-[#263026]/90 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to chat</span>
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#F4F7EE] flex items-center gap-2">
                <span>My Wellness</span>
              </h1>
              <p className="text-xs text-[#788078] mt-0.5">
                Reading rhythm, not words — 100% private and transparent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChatbotModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111511] border border-[#263026] hover:border-[#9BEF8A]/50 text-xs font-semibold text-[#9BEF8A] hover:text-[#F4F7EE] transition cursor-pointer"
              title="Ask the AI Chatbot about any wellness metric"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask Wellness AI</span>
            </button>
          </div>
        </div>

        {/* Calm "You're in control" Opt-Out / Consent Card (Prominently Placed) */}
        <div className="p-5 sm:p-6 rounded-3xl tech-card-glow relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111511] border border-[#263026]">
          {/* Top soft green sheen */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9BEF8A]/35 to-transparent" />

          <div className="flex items-start gap-3.5 relative z-10">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-[#9BEF8A]/15 rounded-2xl blur-md" />
              <div className="p-3 rounded-2xl bg-[#0C0F0C] border border-[#263026] relative z-10 text-[#9BEF8A] shadow-inner">
                <Logo size={24} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-semibold text-[#F4F7EE]">You&apos;re in control</h2>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono tracking-wider font-semibold ${
                    user?.optedIntoWellnessMonitoring
                      ? "bg-[#9BEF8A]/15 text-[#9BEF8A] border-[#9BEF8A]/40"
                      : "bg-[#0C0F0C] text-[#788078] border-[#263026]"
                  }`}
                >
                  {user?.optedIntoWellnessMonitoring ? "Monitoring active" : "Monitoring paused"}
                </span>
              </div>
              <p className="text-xs text-[#788078] mt-1.5 leading-relaxed">
                Silent Alarm reads only your typing cadence, never words or keystrokes. You can pause monitoring or purge your data anytime.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleConsent}
            disabled={isTogglingConsent}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium transition shrink-0 cursor-pointer relative z-10 ${
              user?.optedIntoWellnessMonitoring
                ? "bg-[#0C0F0C] border border-[#263026] hover:border-[#9BEF8A]/40 text-[#788078] hover:text-[#F4F7EE]"
                : "bg-[#9BEF8A]/15 border border-[#9BEF8A]/30 hover:bg-[#9BEF8A]/25 text-[#9BEF8A]"
            }`}
          >
            {user?.optedIntoWellnessMonitoring ? "Pause monitoring" : "Enable monitoring"}
          </button>
        </div>

        {/* Purge Success Banner */}
        {purgeStatus && (
          <div className="p-4 rounded-2xl bg-[#111511] border border-[#69E86C]/40 text-[#69E86C] text-xs font-medium flex items-center gap-2.5 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#69E86C]" />
            <span>{purgeStatus}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 text-[#FF5C5C] text-xs flex items-center gap-2.5 shadow-inner">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#FF5C5C]" />
            <span>{error}</span>
          </div>
        )}

        {/* Telemetry Overview Stats (4 Compact Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#111511] border border-[#263026] flex flex-col justify-between hover:border-[#69E86C]/30 transition group">
            <p className="text-[11px] text-[#788078] font-medium">Saved vectors</p>
            <p className="text-2xl font-bold text-[#F4F7EE] mt-1">{data?.history?.length || 0}</p>
            <p className="text-[10px] text-[#788078]/70 mt-1">30-day window</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#111511] border border-[#263026] flex flex-col justify-between hover:border-[#69E86C]/30 transition group">
            <p className="text-[11px] text-[#788078] font-medium">Self-nudges</p>
            <p className="text-2xl font-bold text-[#F4F7EE] mt-1">{data?.alerts?.length || 0}</p>
            <p className="text-[10px] text-[#788078]/70 mt-1">Threshold checks</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#111511] border border-[#263026] flex flex-col justify-between hover:border-[#69E86C]/30 transition group">
            <p className="text-[11px] text-[#788078] font-medium">Typing cadence</p>
            <p className="text-2xl font-bold text-[#F4F7EE] mt-1">
              {data?.history?.length
                ? Math.round(
                    data.history.reduce((acc, curr) => acc + (curr.wpm || 0), 0) / data.history.length
                  )
                : 0}{" "}
              <span className="text-xs font-normal text-[#788078]">WPM</span>
            </p>
            <p className="text-[10px] text-[#788078]/70 mt-1">Personal speed</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#111511] border border-[#263026] flex flex-col justify-between hover:border-[#69E86C]/30 transition group">
            <p className="text-[11px] text-[#788078] font-medium">Baseline status</p>
            <p className="text-sm font-semibold text-[#F4F7EE] mt-1.5">
              {(data?.history?.length || 0) >= 50 ? (
                <span className="text-[#69E86C] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Calibrated
                </span>
              ) : (
                <span className="text-[#788078] flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {data?.history?.length || 0}/50
                </span>
              )}
            </p>
            <p className="text-[10px] text-[#788078]/70 mt-1">Adaptive model</p>
          </div>
        </div>

        {/* 30-Day Distress Score Smooth Line Chart with Soft Green (#9BEF8A) Gradient Fill */}
        <div className="p-6 rounded-3xl bg-[#111511] border border-[#263026] flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#F4F7EE] flex items-center gap-2">
                <span>Rhythm distress score (30 days)</span>
              </h2>
              <p className="text-xs text-[#788078] mt-0.5">
                Smooth timeline of your natural typing rhythm deviations
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#788078]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9BEF8A] shadow-[0_0_6px_rgba(155,239,138,0.8)]" /> Rhythm score
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-0.5 bg-[#9BEF8A]/60" /> Nudge threshold (0.7)
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-[#788078]">
                Loading telemetry time series...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-[#788078] gap-2.5 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#0C0F0C] border border-[#263026] flex items-center justify-center text-[#9BEF8A]">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm text-[#F4F7EE]">
                  Nothing to report — your rhythm&apos;s been steady
                </span>
                <span className="text-[11px] text-[#788078]">
                  Send messages in chat to view your cadence trend.
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="softGreenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9BEF8A" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#9BEF8A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263026" opacity={0.6} />
                  <XAxis dataKey="time" stroke="#788078" tick={{ fontSize: 10, fill: "#788078" }} />
                  <YAxis domain={[0, 1.0]} stroke="#788078" tick={{ fontSize: 10, fill: "#788078" }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#161B16] border border-[#263026] p-3.5 rounded-2xl text-xs flex flex-col gap-1.5 z-50 shadow-xl">
                            <p className="font-semibold text-[#F4F7EE]">{d.time}</p>
                            <p className="text-[#9BEF8A] font-mono font-semibold">
                              Distress score: {d.score}{" "}
                              {d.score >= 0.7 && (
                                <span className="text-[#9BEF8A] text-[10px] px-2 py-0.5 rounded-full bg-[#9BEF8A]/15 border border-[#9BEF8A]/40 font-medium">
                                  Elevated
                                </span>
                              )}
                            </p>
                            <p className="text-[#788078]">
                              Cadence: {d.wpm} WPM | Pauses: {d.pauseCount} | Backspaces: {d.backspaceRate}
                            </p>
                            {d.factors && d.factors.length > 0 && (
                              <div className="pt-1.5 border-t border-[#263026]">
                                <p className="text-[10px] text-[#788078] font-medium">Contributing factors:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {d.factors.map((f, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#111511] text-[#9BEF8A] border border-[#263026]"
                                    >
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={0.7}
                    stroke="#9BEF8A"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    opacity={0.6}
                    label={{ value: "Threshold (0.7)", fill: "#9BEF8A", fontSize: 10, fontWeight: 500 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#9BEF8A"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#softGreenGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Explainability & Check-in Log */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contributing Factors */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#111511] border border-[#263026] flex flex-col gap-3.5">
            <h3 className="text-sm font-semibold text-[#F4F7EE] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#69E86C]" />
              <span>Observed cadence shifts</span>
            </h3>
            <p className="text-xs text-[#788078]">
              When cadence shifts, these plain-English factors show what changed from your baseline:
            </p>
            <div className="flex flex-col gap-2.5 mt-1 max-h-56 overflow-y-auto pr-1">
              {(data?.history || [])
                .filter((e) => e.contributingFactors && e.contributingFactors.length > 0)
                .slice(-6)
                .reverse()
                .map((e, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#0C0F0C] border border-[#263026] flex flex-col gap-1.5 shadow-inner">
                    <div className="flex items-center justify-between text-[10px] text-[#788078]">
                      <span>{new Date(e.timestamp).toLocaleString()}</span>
                      <span className="font-mono text-[#9BEF8A] font-semibold">Score: {e.distressScore}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {e.contributingFactors.map((factor, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#111511] text-[#9BEF8A] border border-[#263026] font-medium"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              {(!data?.history || data.history.every((e) => !e.contributingFactors?.length)) && (
                <div className="py-6 flex flex-col items-center justify-center text-center gap-1.5">
                  <p className="text-xs font-semibold text-[#F4F7EE]">
                    Nothing to report — your rhythm&apos;s been steady
                  </p>
                  <p className="text-[11px] text-[#788078]">
                    Your typing patterns match your normal calibration.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Past Alerts Log */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#111511] border border-[#263026] flex flex-col gap-3.5">
            <h3 className="text-sm font-semibold text-[#F4F7EE] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#69E86C]" />
              <span>Wellness check-in log</span>
            </h3>
            <p className="text-xs text-[#788078]">
              History of gentle self-nudges delivered after sustained elevated indicators:
            </p>
            <div className="flex flex-col gap-2.5 mt-1 max-h-56 overflow-y-auto pr-1">
              {(data?.alerts || []).map((alert, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#0C0F0C] border border-[#263026] flex items-center justify-between text-xs shadow-inner"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Soft green (#9BEF8A) used for all severity levels; differentiated through label text and opacity/weight — ZERO RED */}
                    <span
                      className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                        alert.severity === "high"
                          ? "bg-[#9BEF8A]/25 text-[#9BEF8A] border-[#9BEF8A]/60 font-bold shadow-xs"
                          : alert.severity === "medium"
                          ? "bg-[#9BEF8A]/15 text-[#9BEF8A]/85 border-[#9BEF8A]/35 font-medium"
                          : "bg-[#9BEF8A]/10 text-[#9BEF8A]/65 border-[#9BEF8A]/20 font-normal"
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[#F4F7EE] font-medium truncate max-w-[150px]">
                      {alert.actionTaken === "dismissed_by_user"
                        ? "Dismissed ('I'm good')"
                        : alert.actionTaken === "resource_viewed"
                        ? "Resources viewed"
                        : "Nudge delivered"}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#788078]">
                    {new Date(alert.triggeredAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {(!data?.alerts || data.alerts.length === 0) && (
                <div className="py-6 flex flex-col items-center justify-center text-center gap-1.5">
                  <p className="text-xs font-semibold text-[#F4F7EE]">
                    Nothing to report — your rhythm&apos;s been steady
                  </p>
                  <p className="text-[11px] text-[#788078]">
                    No distress nudges have been triggered.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Educational Guide on Typing Rhythm Metrics */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#111511] border border-[#263026]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#0C0F0C] text-[#69E86C] border border-[#263026] shadow-inner">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F4F7EE]">
                  Understanding your typing rhythm
                </h3>
                <p className="text-xs text-[#788078]">
                  Learn what dwell time, pauses, and cadence variations mean
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsGuideExpanded(!isGuideExpanded)}
              className="p-2 rounded-xl bg-[#0C0F0C] border border-[#263026] hover:border-[#263026]/90 text-[#788078] hover:text-[#F4F7EE] transition cursor-pointer"
              title={isGuideExpanded ? "Collapse Guide" : "Expand Guide"}
            >
              {isGuideExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isGuideExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 mt-3.5 border-t border-[#263026] animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-[#0C0F0C] border border-[#263026]">
                <span className="text-xs font-semibold text-[#9BEF8A]">Dwell time</span>
                <p className="text-xs text-[#788078] mt-1 leading-relaxed">
                  How long each key remains pressed. Extended dwell times typically coincide with physical fatigue or lethargy.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0C0F0C] border border-[#263026]">
                <span className="text-xs font-semibold text-[#9BEF8A]">Flight time</span>
                <p className="text-xs text-[#788078] mt-1 leading-relaxed">
                  The interval between key transitions. Irregular flight time reflects cognitive distraction or hesitation.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0C0F0C] border border-[#263026]">
                <span className="text-xs font-semibold text-[#9BEF8A]">Pauses &amp; stops</span>
                <p className="text-xs text-[#788078] mt-1 leading-relaxed">
                  Unusual mid-sentence stops longer than 750ms often mark moments of emotional overload or stress.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0C0F0C] border border-[#263026]">
                <span className="text-xs font-semibold text-[#9BEF8A]">Backspace frequency</span>
                <p className="text-xs text-[#788078] mt-1 leading-relaxed">
                  Percentage of keystrokes used to edit. Frequent re-typing reflects second-guessing or agitation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right to Erasure / GDPR Purge Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#111511] border border-[#263026] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#F4F7EE] flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-[#788078]" />
              <span>Right to erasure: purge my typing telemetry</span>
            </h3>
            <p className="text-xs text-[#788078] mt-1 max-w-lg leading-relaxed">
              Permanently delete all raw timing vectors associated with your account from the database.
            </p>
          </div>

          <button
            onClick={() => setConfirmPurgeOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0C0F0C] border border-[#263026] hover:border-[#FF5C5C]/40 text-[#788078] hover:text-[#FF5C5C] text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge telemetry data</span>
          </button>
        </div>

        {/* Confirmation Modal */}
        {confirmPurgeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#161B16] border border-[#263026] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-[#F4F7EE]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#111511] text-[#FF5C5C] border border-[#263026]">
                  <AlertTriangle className="w-5 h-5 text-[#FF5C5C]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#F4F7EE]">Permanently purge data?</h3>
                  <p className="text-xs text-[#788078]">Right to erasure confirmation</p>
                </div>
              </div>

              <p className="text-xs text-[#788078] leading-relaxed">
                This will immediately remove all{" "}
                <span className="text-[#F4F7EE] font-semibold font-mono">{data?.history?.length || 0}</span> stored typing vectors from the database. This action cannot be reversed.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmPurgeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#111511] hover:bg-[#0C0F0C] text-[#788078] text-xs font-medium border border-[#263026] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurgeData}
                  disabled={isPurging}
                  className="px-4 py-2 rounded-xl bg-[#FF5C5C]/15 border border-[#FF5C5C]/40 hover:bg-[#FF5C5C]/25 text-[#FF5C5C] text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isPurging ? "Purging..." : "Yes, purge data"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <WellnessChatbot
          isOpen={showChatbotModal}
          onClose={() => setShowChatbotModal(false)}
        />
      </div>
    </div>
  );
}
