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
  Legend
} from "recharts";
import {
  Users,
  ShieldCheck,
  Activity,
  ArrowLeft,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Bot
} from "lucide-react";
import Logo from "../components/Common/Logo";
import WellnessChatbot from "../components/Wellness/WellnessChatbot";

export default function CounselorDashboardPage({ onBackToChat }) {
  const { user, token } = useAuth();
  const [trendsData, setTrendsData] = useState(null);
  const [escalations, setEscalations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWindow, setSelectedWindow] = useState(30);
  const [actionNotice, setActionNotice] = useState(null);
  const [showChatbotModal, setShowChatbotModal] = useState(false);

  const isAuthorized = user?.role === "counselor" || user?.role === "admin";

  const fetchDashboardData = useCallback(async () => {
    if (!token || !isAuthorized) return;
    try {
      setLoading(true);
      setError(null);
      const [trendsRes, escalationsRes] = await Promise.all([
        api.getCohortTrends(selectedWindow, token),
        api.getEscalationCandidates(token)
      ]);
      setTrendsData(trendsRes);
      setEscalations(escalationsRes);
    } catch (err) {
      console.error("Failed to fetch counselor data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthorized, selectedWindow]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleContactStudent = (studentEmail, studentName) => {
    setActionNotice(`Initiated confidential outreach draft to ${studentName} (${studentEmail}).`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  if (!isAuthorized) {
    return (
      <div className="flex-1 bg-[#070807] text-[#F4F7EE] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-6 rounded-2xl bg-[#111511] text-[#F4F7EE] border border-[#263026] max-w-md flex flex-col items-center gap-3 shadow-xl">
          <Lock className="w-10 h-10 text-[#69E86C]" />
          <h2 className="text-lg font-semibold text-[#F4F7EE]">Access Restricted</h2>
          <p className="text-xs text-[#788078] leading-relaxed">
            The Counselor Hub is reserved for authorized university counselors and administrators to protect student privacy.
          </p>
          <button
            onClick={onBackToChat}
            className="mt-2 px-4 py-2 rounded-xl bg-[#0C0F0C] hover:bg-[#111511] border border-[#263026] text-xs font-semibold text-[#F4F7EE] transition"
          >
            Return to chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#070807] text-[#F4F7EE] overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
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
              <h1 className="text-2xl font-semibold tracking-tight text-[#F4F7EE] flex items-center gap-2.5">
                <span>Cohort Wellness &amp; Counselor Hub</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#B8FF5A]/15 text-[#B8FF5A] border border-[#B8FF5A]/30 font-semibold tracking-wider uppercase">
                  {user?.role} portal
                </span>
              </h1>
              <p className="text-xs text-[#788078] mt-0.5">
                Aggregated, anonymized campus wellness indicators with strict dual-threshold escalation safeguards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChatbotModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111511] border border-[#263026] hover:border-[#69E86C]/50 text-xs font-semibold text-[#69E86C] transition cursor-pointer"
              title="Ask the AI Chatbot about any metric, detection rules, or ethical safeguards"
            >
              <Bot className="w-3.5 h-3.5 text-[#69E86C]" />
              <span>Ask Wellness AI</span>
            </button>

            <select
              value={selectedWindow}
              onChange={(e) => setSelectedWindow(Number(e.target.value))}
              className="bg-[#111511] border border-[#263026] text-[#F4F7EE] text-xs font-medium rounded-xl px-3 py-2 cursor-pointer focus:border-[#B8FF5A]"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-4 rounded-2xl bg-[#111511] border border-[#69E86C]/40 text-[#69E86C] text-xs font-medium flex items-center gap-2.5 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#69E86C]" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 text-[#FF5C5C] text-xs flex items-center gap-2.5 shadow-inner">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#FF5C5C]" />
            <span>{error}</span>
          </div>
        )}

        {/* Ethical Safeguard Banner */}
        <div className="p-4.5 rounded-3xl bg-[#111511] border border-[#263026] flex items-start gap-3.5 text-xs text-[#788078]">
          <div className="p-2 rounded-xl bg-[#69E86C]/15 border border-[#69E86C]/30 text-[#69E86C] shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="leading-relaxed">
            <strong className="text-[#F4F7EE] font-semibold">Strict Anonymization Guarantee:</strong> This view exposes{" "}
            <em>strictly aggregate cohort trends</em>. Under no circumstances are individual names or messages visible
            unless a student triggers the{" "}
            <span className="text-[#69E86C] font-semibold">Dual-Threshold Escalation Exception</span> (&ge;3 unresolved
            high-severity alerts AND &ge;2 dismissed self-nudges).
          </div>
        </div>

        {/* Population & Alerts Overview Cards (Staff Tech Accent Mode) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4.5 rounded-2xl bg-[#111511] border border-[#263026] flex items-center justify-between hover:border-[#69E86C]/40 transition group">
            <div>
              <p className="text-[11px] text-[#788078] font-medium">Opted-in students</p>
              <p className="text-2xl font-bold text-[#69E86C] mt-1">
                {trendsData?.population?.optedInStudents || 0}{" "}
                <span className="text-xs font-normal text-[#788078]">
                  / {trendsData?.population?.totalStudents || 0}
                </span>
              </p>
              <p className="text-[10px] text-[#69E86C] font-medium mt-1">
                {trendsData?.population?.optInPercentage || 0}% active participation
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#0C0F0C] text-[#69E86C] border border-[#263026] shadow-inner">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4.5 rounded-2xl bg-[#111511] border border-[#263026] flex items-center justify-between hover:border-[#69E86C]/40 transition group">
            <div>
              <p className="text-[11px] text-[#788078] font-medium">Total alerts ({selectedWindow}d)</p>
              <p className="text-2xl font-bold text-[#F4F7EE] mt-1">{trendsData?.summary?.totalAlerts || 0}</p>
              <p className="text-[10px] text-[#788078]/70 mt-1">Automated gentle nudges</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#0C0F0C] text-[#69E86C] border border-[#263026] shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4.5 rounded-2xl bg-[#111511] border border-[#263026] flex items-center justify-between hover:border-[#B8FF5A]/40 transition group">
            <div>
              <p className="text-[11px] text-[#788078] font-medium">High-severity alerts</p>
              <p className="text-2xl font-bold text-[#B8FF5A] mt-1">
                {trendsData?.summary?.severityCounts?.high || 0}
              </p>
              <p className="text-[10px] text-[#788078]/70 mt-1">
                Med: {trendsData?.summary?.severityCounts?.medium || 0} | Low:{" "}
                {trendsData?.summary?.severityCounts?.low || 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#0C0F0C] text-[#B8FF5A] border border-[#263026] shadow-inner">
              <Logo size={20} />
            </div>
          </div>

          <div className="p-4.5 rounded-2xl bg-[#111511] border border-[#263026] flex items-center justify-between hover:border-[#B8FF5A]/40 transition group">
            <div>
              <p className="text-[11px] text-[#788078] font-medium">Escalation candidates</p>
              <p className="text-2xl font-bold text-[#B8FF5A] mt-1">{escalations?.candidates?.length || 0}</p>
              <p className="text-[10px] text-[#69E86C] font-medium mt-1">Dual-threshold safeguard met</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#0C0F0C] text-[#B8FF5A] border border-[#263026] shadow-inner">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Aggregate Cohort Trend Chart */}
        <div className="p-6 rounded-3xl bg-[#111511] border border-[#263026] flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#F4F7EE] flex items-center gap-2">
                <span>Anonymized cohort alert volume over time</span>
              </h2>
              <p className="text-xs text-[#788078] mt-0.5">
                Stacked daily alert volume grouped by severity across all opted-in students
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-[#788078]">
                Aggregating cohort statistics...
              </div>
            ) : !trendsData?.trends?.length ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-[#788078] gap-2.5 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#0C0F0C] border border-[#263026] flex items-center justify-center text-[#69E86C]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm text-[#F4F7EE]">
                  Nothing to report — all student rhythms remain steady and zero alerts were recorded in this time period
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B8FF5A" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#B8FF5A" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#69E86C" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#69E86C" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9BEF8A" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#9BEF8A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263026" opacity={0.6} />
                  <XAxis dataKey="date" stroke="#788078" tick={{ fontSize: 10, fill: "#788078" }} />
                  <YAxis stroke="#788078" tick={{ fontSize: 10, fill: "#788078" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161B16",
                      borderColor: "#263026",
                      borderRadius: "16px",
                      boxShadow: "0 20px 40px -10px rgba(0,0,0,0.8)",
                      fontSize: "11px",
                      color: "#F4F7EE"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#788078", paddingTop: "8px" }} />
                  <Area
                    type="monotone"
                    dataKey="high"
                    name="High Severity"
                    stackId="1"
                    stroke="#B8FF5A"
                    fill="url(#colorHigh)"
                  />
                  <Area
                    type="monotone"
                    dataKey="medium"
                    name="Medium Severity"
                    stackId="1"
                    stroke="#69E86C"
                    fill="url(#colorMed)"
                  />
                  <Area
                    type="monotone"
                    dataKey="low"
                    name="Low Severity"
                    stackId="1"
                    stroke="#9BEF8A"
                    fill="url(#colorLow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dual-Threshold Escalation Exception Queue */}
        <div className="p-6 rounded-3xl bg-[#111511] border border-[#263026] flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-[#F4F7EE]">Escalation Exception Queue</h2>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#69E86C]/15 text-[#69E86C] border border-[#69E86C]/30 font-semibold">
                  Dual-Threshold Safeguard Active
                </span>
              </div>
              <p className="text-xs text-[#788078] mt-1 max-w-3xl leading-relaxed">
                To protect student autonomy and avoid premature counselor intervention, student identities are surfaced
                here <strong className="text-[#F4F7EE]">only</strong> when both criteria are met: (1) At least 3
                unresolved high-severity alerts and (2) At least 2 prior self-nudges were dismissed without behavioral
                improvement.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {(escalations?.candidates || []).map((candidate, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#0C0F0C] border border-[#263026] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-inner hover:border-[#B8FF5A]/30 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#111511] border border-[#263026] flex items-center justify-center text-[#B8FF5A] shrink-0 shadow-inner">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-semibold text-[#F4F7EE]">{candidate.username}</h4>
                      <span className="text-xs text-[#788078] font-mono">({candidate.email})</span>
                      <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-[#B8FF5A]/15 text-[#B8FF5A] border border-[#B8FF5A]/30 font-semibold">
                        Dual Threshold Met
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#788078]">
                      <span>
                        High-severity alerts:{" "}
                        <strong className="text-[#F4F7EE] font-mono">{candidate.unresolvedHighAlertsCount}</strong>
                      </span>
                      <span>
                        Dismissed nudges:{" "}
                        <strong className="text-[#F4F7EE] font-mono">{candidate.dismissedNudgesCount}</strong>
                      </span>
                      <span>
                        Latest score:{" "}
                        <strong className="text-[#B8FF5A] font-mono font-semibold">{candidate.latestDistressScore}</strong>
                      </span>
                    </div>

                    {candidate.contributingFactors && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {candidate.contributingFactors.map((f, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#111511] text-[#69E86C] border border-[#263026]"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleContactStudent(candidate.email, candidate.username)}
                    className="px-4 py-2 rounded-xl bg-[#B8FF5A] hover:bg-[#D7FF7A] text-[#070807] font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#B8FF5A]/20"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reach out confidentially</span>
                  </button>
                </div>
              </div>
            ))}

            {(!escalations?.candidates || escalations.candidates.length === 0) && (
              <div className="p-8 rounded-2xl bg-[#0C0F0C] border border-[#263026] text-center flex flex-col items-center justify-center gap-2 shadow-inner">
                <ShieldCheck className="w-8 h-8 text-[#69E86C]" />
                <h4 className="text-sm font-semibold text-[#F4F7EE]">No escalation candidates</h4>
                <p className="text-xs text-[#788078] max-w-md">
                  Nothing to report — all student rhythms remain steady and zero students meet the dual-threshold escalation criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <WellnessChatbot
        isOpen={showChatbotModal}
        onClose={() => setShowChatbotModal(false)}
      />
    </div>
  );
}
