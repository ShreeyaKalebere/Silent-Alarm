import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, Mail, User, ArrowRight, AlertCircle, HeartPulse } from "lucide-react";
import Logo from "../Common/Logo";

export default function RegisterForm({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
    optedIntoWellnessMonitoring: false
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError("All required fields must be filled.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register(formData);
    } catch (err) {
      setError(err.message || "Failed to register. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md tech-card-glow rounded-3xl p-8 relative overflow-hidden transition-all bg-[#111511] border border-[#263026]">
      {/* Top subtle neon lime shimmer border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B8FF5A]/40 to-transparent" />

      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-[#B8FF5A]/20 to-[#69E86C]/15 rounded-full blur-xl scale-150 pointer-events-none" />
          <Logo size={80} className="relative z-10 drop-shadow-[0_4px_16px_rgba(184,255,90,0.35)]" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#F4F7EE] font-heading">Join Silent Alarm</h2>
        <p className="text-sm text-[#788078] mt-1">Create your secure campus chat account</p>
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
            Username
          </label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788078]" />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. charlie"
              autoComplete="username"
              className="w-full pl-11 pr-4 py-2.5 tech-input rounded-xl text-sm placeholder-[#788078]/40 text-[#F4F7EE]"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#788078] mb-1.5 font-normal">
            Campus email
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788078]" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. charlie@university.edu"
              autoComplete="email"
              className="w-full pl-11 pr-4 py-2.5 tech-input rounded-xl text-sm placeholder-[#788078]/40 text-[#F4F7EE]"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#788078] mb-1.5 font-normal">
            Password (min. 6 characters)
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788078]" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full pl-11 pr-4 py-2.5 tech-input rounded-xl text-sm placeholder-[#788078]/40 text-[#F4F7EE]"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#788078] mb-1.5 font-normal">
            Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "student", label: "Student" },
              { id: "counselor", label: "Counselor" },
              { id: "admin", label: "Admin" }
            ].map((roleOption) => (
              <button
                type="button"
                key={roleOption.id}
                onClick={() => setFormData((prev) => ({ ...prev, role: roleOption.id }))}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer font-heading ${
                  formData.role === roleOption.id
                    ? "bg-[#B8FF5A]/15 border-[#B8FF5A] text-[#B8FF5A] shadow-sm shadow-[#B8FF5A]/20"
                    : "tech-input text-[#788078] hover:text-[#F4F7EE] hover:border-[#69E86C]/40"
                }`}
              >
                {roleOption.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-3 p-3.5 bg-[#0C0F0C] border border-[#263026] rounded-xl cursor-pointer hover:border-[#69E86C]/40 transition shadow-inner">
            <input
              type="checkbox"
              name="optedIntoWellnessMonitoring"
              checked={formData.optedIntoWellnessMonitoring}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded border-[#263026] text-[#B8FF5A] focus:ring-[#B8FF5A] bg-[#070807]"
            />
            <div className="text-xs">
              <span className="font-semibold text-[#F4F7EE] flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-[#69E86C]" />
                Opt into wellness monitoring
              </span>
              <p className="text-[#788078] mt-0.5">
                Enables privacy-preserving typing cadence check-ins (defaults to off).
              </p>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-3 py-3 px-4 tech-btn-primary rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50 text-[#070807] font-bold"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-[#070807]/30 border-t-[#070807] rounded-full animate-spin" />
          ) : (
            <>
              Create account <ArrowRight className="w-4 h-4 text-[#070807]" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[#788078]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#B8FF5A] hover:text-[#D7FF7A] font-medium transition cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
