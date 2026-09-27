import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import Logo from "../Common/Logo";

export default function LoginForm({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Please enter your email or username and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(identifier, password);
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md tech-card-glow rounded-3xl p-8 relative overflow-hidden transition-all bg-[#111511] border border-[#263026]">
      {/* Top subtle neon lime shimmer border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B8FF5A]/40 to-transparent" />

      <div className="flex flex-col items-center text-center mb-7">
        <div className="relative mb-5">
          <div className="absolute inset-0 bg-gradient-to-br from-[#B8FF5A]/20 to-[#69E86C]/15 rounded-full blur-xl scale-150 pointer-events-none" />
          <Logo size={80} className="relative z-10 drop-shadow-[0_4px_16px_rgba(184,255,90,0.35)]" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#F4F7EE] font-heading">Welcome back</h2>
        <p className="text-sm text-[#788078] mt-1">Sign in to your Silent Alarm account</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 rounded-xl flex items-start gap-3 text-[#FF5C5C] text-sm shadow-inner">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#FF5C5C]" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#788078] mb-1.5 font-normal">
            Email or username
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788078]" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. your username or email"
              autoComplete="username"
              className="w-full pl-11 pr-4 py-2.5 tech-input rounded-xl text-sm placeholder-[#788078]/40"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#788078] mb-1.5 font-normal">
            Password
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788078]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full pl-11 pr-4 py-2.5 tech-input rounded-xl text-sm placeholder-[#788078]/40"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 py-3 px-4 tech-btn-primary rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50 text-[#070807] font-bold"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-[#070807]/30 border-t-[#070807] rounded-full animate-spin" />
          ) : (
            <>
              Sign in <ArrowRight className="w-4 h-4 text-[#070807]" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[#788078]">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-[#B8FF5A] hover:text-[#D7FF7A] font-medium transition cursor-pointer"
        >
          Create an account
        </button>
      </div>
    </div>
  );
}
