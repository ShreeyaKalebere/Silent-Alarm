/**
 * ==============================================================================
 * PRIVACY GUARANTEE & AUDIT NOTICE:
 * ==============================================================================
 * This hook is an in-browser behavioral-biometric timing capture engine.
 *
 * It is strictly designed for empathetic student wellness and stress detection
 * via rhythm anomalies (rhythm variance, dwell duration, pause patterns).
 *
 * CRITICAL PRIVACY CONSTRAINTS STRICTLY ENFORCED IN THIS CODE:
 * 1. NEVER captures, stores, logs, or transmits `e.key`, `e.code`, or characters.
 * 2. NEVER captures, stores, logs, or transmits any message text or draft strings.
 * 3. Immediately discards key associations as soon as down/up durations are computed.
 * 4. ONLY aggregated numeric durations, rates, counts, and a boolean abandonment
 *    status ever leave the browser in the payload sent to /api/typing-event.
 * 5. Strictly inactive when `enabled` (optedIntoWellnessMonitoring) is false.
 * ==============================================================================
 */

import { useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export function useKeystrokeCapture({ roomId, enabled }) {
  const { token } = useAuth();

  // Internal numeric timing buffers (strictly numeric values, zero text)
  const keyDownTimestamps = useRef(new Map()); // keySlot -> timestamp (ms)
  const dwellTimes = useRef([]);               // number[]: durations each key was held down
  const flightTimes = useRef([]);              // number[]: gaps between release and next press
  const wpmSamples = useRef([]);               // number[]: rolling WPM slices

  // Counts & aggregators
  const totalKeystrokes = useRef(0);
  const backspaceCount = useRef(0);
  const pauseCount = useRef(0);
  const pauseDurationTotal = useRef(0);
  const burstScores = useRef([]);

  // State trackers
  const lastKeyUpTime = useRef(null);
  const firstKeystrokeTime = useRef(null);
  const lastSliceTime = useRef(null);
  const lastPauseEndTime = useRef(null);
  const postPauseKeystrokes = useRef(0);
  const postPauseFlightTimes = useRef([]);
  const hasTypedContent = useRef(false);

  // Reset all timing metrics
  const resetMetrics = useCallback(() => {
    keyDownTimestamps.current.clear();
    dwellTimes.current = [];
    flightTimes.current = [];
    wpmSamples.current = [];
    totalKeystrokes.current = 0;
    backspaceCount.current = 0;
    pauseCount.current = 0;
    pauseDurationTotal.current = 0;
    burstScores.current = [];
    lastKeyUpTime.current = null;
    firstKeystrokeTime.current = null;
    lastSliceTime.current = null;
    lastPauseEndTime.current = null;
    postPauseKeystrokes.current = 0;
    postPauseFlightTimes.current = [];
    hasTypedContent.current = false;
  }, []);

  // Compute final feature vector & dispatch to backend
  const dispatchFeatures = useCallback(
    async (isAbandoned = false) => {
      if (!enabled || !token || !roomId) {
        resetMetrics();
        return;
      }

      const totalKeys = totalKeystrokes.current;
      // Discard trivial noise (less than 2 keystrokes)
      if (totalKeys < 2) {
        resetMetrics();
        return;
      }

      const now = performance.now();
      const startTime = firstKeystrokeTime.current || now;
      const totalElapsedMinutes = Math.max(0.001, (now - startTime) / 60000);

      // 1. Average Dwell Time (ms)
      const dwellList = dwellTimes.current;
      const avgDwellTime =
        dwellList.length > 0
          ? Math.round((dwellList.reduce((a, b) => a + b, 0) / dwellList.length) * 10) / 10
          : 0;

      // 2. Average Flight Time (ms)
      const flightList = flightTimes.current;
      const avgFlightTime =
        flightList.length > 0
          ? Math.round((flightList.reduce((a, b) => a + b, 0) / flightList.length) * 10) / 10
          : 0;

      // 3. Overall WPM (1 word = 5 keystrokes standard)
      const calculatedWpm = Math.round(((totalKeys / 5) / totalElapsedMinutes) * 10) / 10;

      // 4. Rolling WPM Variance
      const samples = wpmSamples.current;
      let wpmVariance = 0;
      if (samples.length >= 2) {
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        const sumSq = samples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
        wpmVariance = Math.round((sumSq / (samples.length - 1)) * 10) / 10;
      }

      // 5. Backspace / Correction Rate
      const backspaceRate =
        totalKeys > 0
          ? Math.round((backspaceCount.current / totalKeys) * 1000) / 1000
          : 0;

      // 6. Burst Typing Score (post-pause acceleration ratio)
      const bursts = burstScores.current;
      const burstTypingScore =
        bursts.length > 0
          ? Math.round((bursts.reduce((a, b) => a + b, 0) / bursts.length) * 100) / 100
          : 1.0;

      // Pack strictly numeric feature vector
      const features = {
        avgDwellTime,
        avgFlightTime,
        wpm: calculatedWpm,
        wpmVariance,
        backspaceRate,
        pauseCount: pauseCount.current,
        pauseDurationTotal: Math.round(pauseDurationTotal.current),
        burstTypingScore,
        messageAbandoned: Boolean(isAbandoned)
      };

      try {
        await api.sendTypingEvent(
          {
            roomId,
            features,
            timestamp: new Date().toISOString()
          },
          token
        );
      } catch (err) {
        console.warn("[KeystrokeCapture] Non-blocking telemetry notice:", err.message);
      } finally {
        resetMetrics();
      }
    },
    [enabled, token, roomId, resetMetrics]
  );

  // Key Down Handler
  const handleKeyDown = useCallback(
    (e) => {
      if (!enabled) return;

      const now = performance.now();
      const isBackspaceOrDelete = e.key === "Backspace" || e.key === "Delete";

      // Count correction actions (never records deleted text)
      if (isBackspaceOrDelete) {
        backspaceCount.current++;
      }

      // Anonymous numeric key-slot identifier based on DOM keyCode/which (discarded on keyup)
      const keySlot = e.which || e.keyCode || 1;
      if (!keyDownTimestamps.current.has(keySlot)) {
        keyDownTimestamps.current.set(keySlot, now);
      }

      // Track initiation
      if (!firstKeystrokeTime.current) {
        firstKeystrokeTime.current = now;
        lastSliceTime.current = now;
      }

      totalKeystrokes.current++;
      hasTypedContent.current = true;

      // Calculate Flight Time (gap between previous key release and current press)
      if (lastKeyUpTime.current !== null) {
        const flight = Math.max(0, Math.round(now - lastKeyUpTime.current));

        // Detect Pause (>1.5s = 1500ms mid-message)
        if (flight > 1500 && flight < 30000) {
          pauseCount.current++;
          pauseDurationTotal.current += flight;
          lastPauseEndTime.current = now;
          postPauseKeystrokes.current = 0;
          postPauseFlightTimes.current = [];
        } else if (flight < 10000) {
          flightTimes.current.push(flight);
        }

        // Track burst typing immediately following a pause (first 3 keystrokes)
        if (lastPauseEndTime.current && now - lastPauseEndTime.current < 2500) {
          if (postPauseKeystrokes.current < 3) {
            postPauseFlightTimes.current.push(flight);
            postPauseKeystrokes.current++;

            if (postPauseKeystrokes.current === 3 && flightTimes.current.length > 0) {
              const avgFlight =
                flightTimes.current.reduce((a, b) => a + b, 0) / flightTimes.current.length;
              const burstAvg =
                postPauseFlightTimes.current.reduce((a, b) => a + b, 0) /
                postPauseFlightTimes.current.length;

              if (burstAvg > 0) {
                // Higher score indicates rapid typing burst after deliberation
                const score = Math.min(5.0, avgFlight / burstAvg);
                burstScores.current.push(score);
              }
            }
          }
        }
      }

      // Rolling WPM slice every 5 keystrokes
      if (totalKeystrokes.current % 5 === 0 && lastSliceTime.current) {
        const sliceMinutes = (now - lastSliceTime.current) / 60000;
        if (sliceMinutes > 0.005) {
          const sliceWpm = (5 / 5) / sliceMinutes;
          wpmSamples.current.push(Math.round(sliceWpm * 10) / 10);
          lastSliceTime.current = now;
        }
      }
    },
    [enabled]
  );

  // Key Up Handler
  const handleKeyUp = useCallback(
    (e) => {
      if (!enabled) return;

      const now = performance.now();
      const keySlot = e.which || e.keyCode || 1;

      // Compute Dwell Time and IMMEDIATELY delete the keySlot mapping
      const downTime = keyDownTimestamps.current.get(keySlot);
      if (downTime) {
        const dwell = Math.max(1, Math.round(now - downTime));
        if (dwell < 5000) {
          dwellTimes.current.push(dwell);
        }
        keyDownTimestamps.current.delete(keySlot);
      }

      lastKeyUpTime.current = now;
    },
    [enabled]
  );

  // Input Change Handler to detect message abandonment
  const handleInputChange = useCallback(
    (currentLength) => {
      if (!enabled) return;

      // Abandonment trigger: user had typed substantial content (>3 keystrokes)
      // but erased the input back to empty without sending
      if (hasTypedContent.current && totalKeystrokes.current >= 4 && currentLength === 0) {
        dispatchFeatures(true); // dispatch as abandoned
      }
    },
    [enabled, dispatchFeatures]
  );

  // Message Sent Handler
  const handleMessageSent = useCallback(() => {
    dispatchFeatures(false); // dispatch as successful message send
  }, [dispatchFeatures]);

  return {
    handleKeyDown,
    handleKeyUp,
    handleInputChange,
    handleMessageSent,
    resetMetrics
  };
}
