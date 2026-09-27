const BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : "";

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

export const api = {
  async register(userData) {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data;
  },

  async login(credentials) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    return data;
  },

  async getMe(token) {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
    return data.user;
  },

  async updateWellnessConsent(optedIntoWellnessMonitoring, token) {
    const res = await fetch(`${BASE_URL}/api/auth/wellness-consent`, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ optedIntoWellnessMonitoring })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update wellness consent");
    return data.user;
  },

  async getUsers(token) {
    const res = await fetch(`${BASE_URL}/api/auth/users`, {
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch users");
    return data.users;
  },

  async getMessages(roomId, token) {
    const res = await fetch(`${BASE_URL}/api/messages/${encodeURIComponent(roomId)}`, {
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch messages");
    return data.messages;
  },

  async sendTypingEvent(eventData, token) {
    const res = await fetch(`${BASE_URL}/api/typing-event`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(eventData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send typing event");
    return data;
  },

  // Wellness API methods
  async getMyWellnessHistory(token) {
    const res = await fetch(`${BASE_URL}/api/wellness/my-history`, {
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch wellness history");
    return data;
  },

  async resolveWellnessAlert(alertId, actionTaken, token) {
    const res = await fetch(`${BASE_URL}/api/wellness/alerts/${alertId}/resolve`, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ actionTaken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to resolve wellness alert");
    return data;
  },

  async purgeWellnessData(token) {
    const res = await fetch(`${BASE_URL}/api/wellness/my-data`, {
      method: "DELETE",
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to purge telemetry data");
    return data;
  },

  // Counselor / Admin API methods
  async getCohortTrends(days = 30, token) {
    const res = await fetch(`${BASE_URL}/api/admin/cohort-trends?days=${days}`, {
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch cohort trends");
    return data;
  },

  async getEscalationCandidates(token) {
    const res = await fetch(`${BASE_URL}/api/admin/escalation-candidates`, {
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch escalation candidates");
    return data;
  }
};
