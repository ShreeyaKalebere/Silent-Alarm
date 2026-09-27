import React from "react";

export default function Logo({
  size = 32,
  className = "",
  showBadge = false,
  title = "Silent Alarm"
}) {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <path
        d="M50 8 L82 20 V48 C82 70 68 86 50 94 C32 86 18 70 18 48 V20 Z"
        fill="none"
        stroke="#B8FF5A"
        strokeWidth="3.5"
      />
      <path
        d="M24 52 H38 L44 38 L52 66 L58 46 L64 52 H76"
        fill="none"
        stroke="#69E86C"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (showBadge) {
    return (
      <div
        className="rounded-2xl bg-[#111511] border border-[#263026] p-2 flex items-center justify-center shadow-lg shadow-black/60"
        style={{ width: size * 1.35, height: size * 1.35 }}
      >
        {svg}
      </div>
    );
  }

  return svg;
}
