const BASE_URL = "http://127.0.0.1:5000";

async function runTests() {
  console.log("--- Testing Typing Event & Consent APIs ---");

  // 1. Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "alice", password: "password123" })
  });
  const { token, user } = await loginRes.json();
  console.log(`[PASS] Logged in as: ${user.username}, Token received.`);

  // 2. Test Consent Toggle
  const consentRes = await fetch(`${BASE_URL}/api/auth/wellness-consent`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ optedIntoWellnessMonitoring: true })
  });
  const consentData = await consentRes.json();
  console.log(`[PASS] Updated consent: optedIntoWellnessMonitoring = ${consentData.user.optedIntoWellnessMonitoring}`);

  // 3. Test Valid Numeric Typing Event
  const validPayload = {
    roomId: "general",
    timestamp: new Date().toISOString(),
    features: {
      avgDwellTime: 112.5,
      avgFlightTime: 230.1,
      wpm: 54.2,
      wpmVariance: 6.8,
      backspaceRate: 0.05,
      pauseCount: 2,
      pauseDurationTotal: 3420,
      burstTypingScore: 1.4,
      messageAbandoned: false
    }
  };

  const postRes = await fetch(`${BASE_URL}/api/typing-event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(validPayload)
  });
  const postData = await postRes.json();
  if (postRes.status === 201 && postData.success) {
    console.log(`[PASS] Valid numeric typing event recorded! ID: ${postData.eventId}`);
  } else {
    throw new Error(`Failed to post valid typing event: ${JSON.stringify(postData)}`);
  }

  // 4. Test Privacy Enforcement (Payload containing illicit text or keys MUST be rejected)
  const illicitPayload = {
    roomId: "general",
    text: "Secret user message that should NEVER be accepted",
    features: {
      avgDwellTime: 100,
      avgFlightTime: 200,
      wpm: 40,
      wpmVariance: 0,
      backspaceRate: 0,
      pauseCount: 0,
      pauseDurationTotal: 0,
      burstTypingScore: 0,
      messageAbandoned: false
    }
  };

  const illicitRes = await fetch(`${BASE_URL}/api/typing-event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(illicitPayload)
  });
  const illicitData = await illicitRes.json();
  if (illicitRes.status === 400 && illicitData.message.includes("Privacy violation")) {
    console.log(`[PASS] Privacy guard successfully rejected illicit text payload! (Response: "${illicitData.message}")`);
  } else {
    throw new Error(`Privacy guard failed to reject illicit payload! Status: ${illicitRes.status}, data: ${JSON.stringify(illicitData)}`);
  }

  console.log("\nAll backend typing-event & consent tests passed!\n");
}

runTests().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
