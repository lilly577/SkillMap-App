// API configuration and helper functions
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const WS_URL = import.meta.env.VITE_WS_URL;

// Token management
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

const removeToken = (): void => {
  localStorage.removeItem('token');
};

// Generic API call helper with authentication
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      // Token expired or invalid
      removeToken();
      window.dispatchEvent(new Event('unauthorized'));
      throw new Error('Authentication failed. Please login again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

// Authentication API calls
export const authApi = {
  login: async (email: string, password: string) => {
    return apiCall<{
      success: boolean;
      token: string;
      user: any;
      message: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  registerCompany: async (data: {
    companyName: string;
    email: string;
    password: string;
    location?: string;
    website?: string;
    industry?: string;
  }) => {
    return apiCall<{
      success: boolean;
      token: string;
      user: any;
      message: string;
    }>('/api/auth/company/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  registerSpecialist: async (data: {
    fullName: string;
    email: string;
    password: string;
    expertise?: string;
    yearsExperience?: number;
    education?: string;
    portfolio?: string;
    programmingLanguages?: string[] | string;
  }) => {
    return apiCall<{
      success: boolean;
      token: string;
      user: any;
      message: string;
    }>('/api/auth/specialist/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyToken: async () => {
    return apiCall<{
      success: boolean;
      user: any;
    }>('/api/auth/verify');
  },

  logout: () => {
    removeToken();
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
  }
};

// Specialist API calls
export const specialistApi = {
  register: async (data: FormData) => {
    const token = getToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/specialists/register`, {
      method: "POST",
      body: data,
      headers,
      credentials: 'include',
    });
    return response.json();
  },

  getProfile: async () => {
    return apiCall<{ success: boolean; specialist: any }>('/api/specialists/profile');
  },

  getMatches: async () => {
    return apiCall<{ success: boolean; matches: any[] }>('/api/specialists/matches');
  },

  getNotifications: async () => {
    return apiCall<{ success: boolean; notifications: any[] }>('/api/specialists/notifications');
  },

  updateProfile: async (data: FormData) => {
    const token = getToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/specialists/profile`, {
      method: "PUT",
      body: data,
      headers,
      credentials: 'include',
    });
    return response.json();
  },
};

// Company API calls
export const companyApi = {
  register: async (data: any) => {
    return apiCall("/api/companies/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getProfile: async () => {
    return apiCall<{ success: boolean; company: any }>('/api/companies/profile');
  },

  postJob: async (data: any) => {
    return apiCall<{ success: boolean; jobId: string; message: string }>("/api/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMatchedCandidates: async () => {
    return apiCall<{ success: boolean; candidates: any[] }>("/api/companies/matches");
  },

  getPostedJobs: async () => {
    return apiCall<{ success: boolean; jobs: any[] }>("/api/companies/jobs");
  },

  getMyJobs: async () => {
    return apiCall<{ success: boolean; jobs: any[] }>("/api/jobs/my-jobs");
  },
};

// Jobs API calls (public)
export const jobsApi = {
  getAll: async () => {
    return apiCall<{ success: boolean; jobs: any[] }>("/api/jobs");
  },

  getById: async (id: string) => {
    return apiCall<{ success: boolean; job: any }>(`/api/jobs/${id}`);
  },
};

// Specialists API calls (public)
export const specialistsApi = {
  getAll: async () => {
    return apiCall<{ success: boolean; candidates: any[] }>("/api/specialists");
  },
};

// new
// Chat API calls
export const chatApi = {
  getChats: async () => {
    return apiCall<{ success: boolean; chats: any[] }>('/api/chat/chats');
  },

  getChatMessages: async (chatId: string, limit?: number, before?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before);

    return apiCall<{ success: boolean; messages: any[] }>(
      `/api/chat/chats/${chatId}/messages?${params}`
    );
  },

  startChat: async (recipientId: string, recipientType: 'company' | 'specialist') => {
    return apiCall<{ success: boolean; chat: any; message: string }>('/api/chat/chats/start', {
      method: 'POST',
      body: JSON.stringify({ recipientId, recipientType }),
    });
  },

  saveMessage: async (messageData: {
    chatId: string;
    senderId: string;
    recipientId: string;
    content: string;
    messageType?: string;
  }) => {
    return apiCall<{ success: boolean; message: any }>('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },
};

// Update the WebSocket functions to use authentication
// Update the connectChatWebSocket function
export function connectChatWebSocket(
  onMessage: (data: any) => void,
  onError?: (error: Event) => void,
  onOpen?: () => void,
  onClose?: () => void
): WebSocket {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const wsUrl = `${WS_URL.replace('http', 'ws')}/chat?token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected successfully");
    onOpen?.();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      onMessage(data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    onError?.(error);
  };

  ws.onclose = (event) => {
    console.log("WebSocket disconnected:", event.code, event.reason);
    onClose?.();
  };

  return ws;
}

// Update sendChatMessage to include proper error handling
export function sendChatMessage(
  ws: WebSocket,
  message: string,
  recipientId: string,
  chatId?: string
) {
  if (ws.readyState === WebSocket.OPEN) {
    const messageData = {
      type: "message",
      recipientId,
      content: message,
      chatId: chatId || `temp_${Date.now()}`
    };

    console.log('Sending message via WebSocket:', messageData);
    ws.send(JSON.stringify(messageData));
    return true;
  } else {
    console.error("WebSocket is not connected. Ready state:", ws.readyState);
    return false;
  }
}

// New WebSocket message types
export function sendTypingIndicator(
  ws: WebSocket,
  recipientId: string
) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "typing",
      recipientId
    }));
  }
}

export function sendReadReceipt(
  ws: WebSocket,
  recipientId: string,
  chatId: string
) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "read_receipt",
      recipientId,
      chatId
    }));
  }
}

// Browse API calls
export const browseApi = {
  getSpecialists: async (filters?: {
    page?: number;
    limit?: number;
    expertise?: string;
    minExperience?: number;
    maxExperience?: number;
    skills?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    return apiCall<{
      success: boolean;
      specialists: any[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>(`/api/browse/specialists?${params}`);
  },

  getJobs: async (filters?: {
    page?: number;
    limit?: number;
    location?: string;
    industry?: string;
    minExperience?: number;
    maxExperience?: number;
    skills?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    return apiCall<{
      success: boolean;
      jobs: any[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>(`/api/browse/jobs?${params}`);
  },

  getJobDetails: async (id: string) => {
    return apiCall<{
      success: boolean;
      job: any;
    }>(`/api/browse/jobs/${id}`);
  },

  getSpecialistDetails: async (id: string) => {
    return apiCall<{
      success: boolean;
      specialist: any;
    }>(`/api/browse/specialists/${id}`);
  },
};

// Applications API calls
export const applicationsApi = {
  applyForJob: async (jobId: string, coverLetter?: string) => {
    return apiCall<{
      success: boolean;
      application: any;
      message: string;
    }>('/api/applications/apply', {
      method: 'POST',
      body: JSON.stringify({ jobId, coverLetter }),
    });
  },

  getMyApplications: async () => {
    return apiCall<{
      success: boolean;
      applications: any[];
    }>('/api/applications/my-applications');
  },

  getCompanyApplications: async () => {
    return apiCall<{
      success: false;
      applications: any[];
    }>('/api/applications/company/applications');
  },

  updateApplicationStatus: async (applicationId: string, status: string) => {
    return apiCall<{
      success: boolean;
      application: any;
      message: string;
    }>(`/api/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// Interviews API calls
export const interviewsApi = {
  scheduleInterview: async (data: {
    applicationId: string;
    scheduledDate: string;
    duration?: number;
    meetingTitle: string;
    meetingDescription?: string;
  }) => {
    return apiCall<{
      success: boolean;
      interview: any;
      message: string;
    }>('/api/interviews/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCompanyInterviews: async () => {
    return apiCall<{
      success: boolean;
      interviews: any[];
    }>('/api/interviews/company');
  },

  getSpecialistInterviews: async () => {
    return apiCall<{
      success: boolean;
      interviews: any[];
    }>('/api/interviews/specialist');
  },

  updateInterviewStatus: async (interviewId: string, status: string) => {
    return apiCall<{
      success: boolean;
      interview: any;
      message: string;
    }>(`/api/interviews/${interviewId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getInterviewDetails: async (interviewId: string) => {
    return apiCall<{
      success: boolean;
      interview: any;
    }>(`/api/interviews/${interviewId}`);
  },
  getInterviewByMeetingId: async (meetingId: string) => {
    return apiCall<{
      success: boolean;
      interview: any;
    }>(`/api/interviews/meeting/${meetingId}`);
  },
};

// Export token management for use in components
export { getToken, setToken, removeToken };