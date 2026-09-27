const { io } = require("../client/node_modules/socket.io-client");

const BASE_URL = "http://127.0.0.1:5000";

async function loginUser(identifier, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
}

async function runE2ETest() {
  console.log("--- Starting Real-Time E2E Chat Simulation between 2 Users ---");

  // Step 1: Login Alice & Dr. Smith
  console.log("1. Logging in Tab 1 (alice) and Tab 2 (dr_smith)...");
  const aliceAuth = await loginUser("alice", "password123");
  const smithAuth = await loginUser("dr_smith", "password123");

  console.log(`[PASS] Alice logged in (Role: ${aliceAuth.user.role}, ID: ${aliceAuth.user._id})`);
  console.log(`[PASS] Dr. Smith logged in (Role: ${smithAuth.user.role}, ID: ${smithAuth.user._id})`);

  // Step 2: Establish Socket Connections
  console.log("\n2. Establishing Socket.io connections for both clients...");
  const socketAlice = io(BASE_URL, { transports: ["websocket"] });
  const socketSmith = io(BASE_URL, { transports: ["websocket"] });

  await new Promise((resolve) => {
    let connectedCount = 0;
    const checkBoth = () => {
      connectedCount++;
      if (connectedCount === 2) resolve();
    };
    socketAlice.on("connect", checkBoth);
    socketSmith.on("connect", checkBoth);
  });
  console.log("[PASS] Both sockets connected successfully!");

  // Step 3: Register presence and join #general
  socketAlice.emit("register_user", {
    userId: aliceAuth.user._id,
    username: aliceAuth.user.username,
    role: aliceAuth.user.role
  });
  socketSmith.emit("register_user", {
    userId: smithAuth.user._id,
    username: smithAuth.user.username,
    role: smithAuth.user.role
  });

  socketAlice.emit("join_room", { roomId: "general" });
  socketSmith.emit("join_room", { roomId: "general" });

  // Step 4: Real-time message exchange in #general
  console.log("\n3. Testing real-time broadcast in #general room...");
  const generalMessagePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout waiting for message in #general")), 5000);
    socketSmith.on("receive_message", (msg) => {
      if (msg.roomId === "general" && msg.text.includes("Tab 1 to Tab 2")) {
        clearTimeout(timeout);
        resolve(msg);
      }
    });
  });

  socketAlice.emit("send_message", {
    roomId: "general",
    text: "Hello everyone in #general! Broadcasting from Tab 1 to Tab 2.",
    sender: {
      _id: aliceAuth.user._id,
      username: aliceAuth.user.username,
      role: aliceAuth.user.role
    }
  });

  const receivedInSmith = await generalMessagePromise;
  console.log(`[PASS] Dr. Smith (Tab 2) instantly received message from ${receivedInSmith.sender.username}: "${receivedInSmith.text}"`);

  // Step 5: Direct Message (DM) exchange
  console.log("\n4. Testing Direct Message (1-on-1 private channel)...");
  const dmRoomId = [aliceAuth.user._id, smithAuth.user._id].sort().join("_");
  socketAlice.emit("join_room", { roomId: dmRoomId });
  socketSmith.emit("join_room", { roomId: dmRoomId });

  const dmMessagePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout waiting for DM")), 5000);
    socketAlice.on("receive_message", (msg) => {
      if (msg.roomId === dmRoomId && msg.text.includes("Private response")) {
        clearTimeout(timeout);
        resolve(msg);
      }
    });
  });

  socketSmith.emit("send_message", {
    roomId: dmRoomId,
    text: "Private response from Dr. Smith to Alice via DM.",
    sender: {
      _id: smithAuth.user._id,
      username: smithAuth.user.username,
      role: smithAuth.user.role
    }
  });

  const receivedInAlice = await dmMessagePromise;
  console.log(`[PASS] Alice (Tab 1) instantly received private DM from ${receivedInAlice.sender.username}: "${receivedInAlice.text}"`);

  // Step 6: Verify MongoDB Persistence via REST API
  console.log("\n5. Verifying message persistence in MongoDB via REST endpoint...");
  const historyRes = await fetch(`${BASE_URL}/api/messages/general`, {
    headers: { Authorization: `Bearer ${aliceAuth.token}` }
  });
  const historyData = await historyRes.json();
  const found = historyData.messages.some(m => m.text.includes("Broadcasting from Tab 1 to Tab 2"));
  if (found) {
    console.log(`[PASS] Message successfully retrieved from MongoDB persistence (Total in room: ${historyData.messages.length})`);
  } else {
    throw new Error("Message not found in MongoDB message history!");
  }

  // Cleanup
  socketAlice.disconnect();
  socketSmith.disconnect();

  console.log("\n=======================================================");
  console.log("🎉 ALL REAL-TIME & PERSISTENCE TESTS PASSED COMPLETELY!");
  console.log("=======================================================\n");
}

runE2ETest().catch(err => {
  console.error("E2E Test Failure:", err);
  process.exit(1);
});

