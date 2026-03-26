import { MOCK_USERS, MOCK_GROUPS, MOCK_PERMISSIONS, MOCK_AUDIT_LOGS } from "./mock-data";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const USE_MOCK = !import.meta.env.VITE_API_BASE_URL;

// Deep clone helper
function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// In-memory mock state
let mockUsers = clone(MOCK_USERS);
let mockGroups = clone(MOCK_GROUPS);
let mockPermissions = clone(MOCK_PERMISSIONS);
let mockAuditLogs = clone(MOCK_AUDIT_LOGS);
// Persist mock user across reloads via localStorage
function getMockLoggedInUser() {
  const stored = localStorage.getItem("mock_user");
  if (stored) {
    try { return JSON.parse(stored); } catch { return null; }
  }
  return null;
}
function setMockLoggedInUser(user: typeof MOCK_USERS[0] | null) {
  if (user) localStorage.setItem("mock_user", JSON.stringify(user));
  else localStorage.removeItem("mock_user");
}

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

async function mockRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  await delay();
  const { method = "GET", body } = options;
  const data = body as Record<string, unknown> | undefined;

  // ===== AUTH =====
  if (endpoint === "/auth/login" && method === "POST") {
    const email = data?.email as string;
    const password = data?.password as string;
    const user = mockUsers.find((u) => u.email === email);
    if (!user || password !== "Admin123!") {
      throw new Error("Email ou mot de passe incorrect.");
    }
    setMockLoggedInUser(user);
    return { token: "mock-jwt-token-" + user.user_id, user } as T;
  }

  if (endpoint === "/auth/logout" && method === "POST") {
    setMockLoggedInUser(null);
    return {} as T;
  }

  if (endpoint === "/auth/me") {
    if (!mockLoggedInUser) throw new Error("Non authentifié");
    return mockLoggedInUser as T;
  }

  if (endpoint === "/auth/register" && method === "POST") {
    const newUser = {
      user_id: "u" + generateId(),
      username: data?.username as string,
      email: data?.email as string,
      is_active: true,
      group_id: (data?.group_id as string) || null,
      role: (data?.role as string) || "reader",
    };
    mockUsers.push(newUser);
    mockAuditLogs.unshift({
      id: "a" + generateId(),
      user_name: mockLoggedInUser?.username || "Admin",
      action: "Inscription",
      target: newUser.email,
      ip_address: "192.168.1.1",
      created_at: new Date().toISOString(),
    });
    return newUser as T;
  }

  // ===== GROUPS =====
  if (endpoint === "/groups" && method === "GET") {
    return clone(mockGroups) as T;
  }

  if (endpoint === "/groups" && method === "POST") {
    const newGroup = {
      id: "g" + generateId(),
      name: data?.name as string,
      icon: (data?.icon as string) || null,
      description: (data?.description as string) || null,
      parent_id: (data?.parent_id as string) || null,
      created_at: new Date().toISOString(),
    };
    mockGroups.push(newGroup);
    return newGroup as T;
  }

  if (endpoint.startsWith("/groups/") && method === "PUT") {
    const id = endpoint.split("/")[2];
    const idx = mockGroups.findIndex((g) => g.id === id);
    if (idx >= 0) {
      mockGroups[idx] = { ...mockGroups[idx], ...data } as typeof mockGroups[0];
      return mockGroups[idx] as T;
    }
    throw new Error("Groupe introuvable");
  }

  if (endpoint.startsWith("/groups/") && method === "DELETE") {
    const id = endpoint.split("/")[2];
    mockGroups = mockGroups.filter((g) => g.id !== id);
    return {} as T;
  }

  // ===== USERS =====
  if (endpoint === "/users" && method === "GET") {
    return clone(mockUsers) as T;
  }

  if (endpoint.match(/^\/users\/[^/]+$/) && method === "PUT") {
    const userId = endpoint.split("/")[2];
    const idx = mockUsers.findIndex((u) => u.user_id === userId);
    if (idx >= 0) {
      mockUsers[idx] = { ...mockUsers[idx], ...data } as typeof mockUsers[0];
      return mockUsers[idx] as T;
    }
    throw new Error("Utilisateur introuvable");
  }

  if (endpoint.match(/^\/users\/[^/]+\/toggle-status$/) && method === "PATCH") {
    const userId = endpoint.split("/")[2];
    const idx = mockUsers.findIndex((u) => u.user_id === userId);
    if (idx >= 0) {
      mockUsers[idx].is_active = !mockUsers[idx].is_active;
      return mockUsers[idx] as T;
    }
    throw new Error("Utilisateur introuvable");
  }

  if (endpoint.match(/^\/users\/[^/]+$/) && method === "DELETE") {
    const userId = endpoint.split("/")[2];
    mockUsers = mockUsers.filter((u) => u.user_id !== userId);
    return {} as T;
  }

  // ===== PERMISSIONS =====
  if (endpoint === "/permissions" && method === "GET") {
    return clone(mockPermissions) as T;
  }

  if (endpoint === "/permissions" && method === "PUT") {
    const perm = data as { user_id: string; group_id: string; permission: string };
    const idx = mockPermissions.findIndex((p) => p.user_id === perm.user_id && p.group_id === perm.group_id);
    if (idx >= 0) {
      mockPermissions[idx] = perm;
    } else {
      mockPermissions.push(perm);
    }
    return perm as T;
  }

  if (endpoint === "/permissions/batch" && method === "POST") {
    const changes = data as Record<string, Record<string, string>>;
    for (const userId of Object.keys(changes)) {
      for (const groupId of Object.keys(changes[userId])) {
        const perm = changes[userId][groupId];
        const idx = mockPermissions.findIndex((p) => p.user_id === userId && p.group_id === groupId);
        if (perm) {
          if (idx >= 0) mockPermissions[idx].permission = perm;
          else mockPermissions.push({ user_id: userId, group_id: groupId, permission: perm });
        } else if (idx >= 0) {
          mockPermissions.splice(idx, 1);
        }
      }
    }
    return {} as T;
  }

  if (endpoint.match(/^\/permissions\//) && method === "DELETE") {
    const parts = endpoint.split("/");
    const userId = parts[2];
    const groupId = parts[3];
    mockPermissions = mockPermissions.filter((p) => !(p.user_id === userId && p.group_id === groupId));
    return {} as T;
  }

  // ===== AUDIT =====
  if (endpoint === "/audit-logs") {
    let logs = clone(mockAuditLogs);
    if (options.params?.action && options.params.action !== "all") {
      logs = logs.filter((l) => l.action === options.params!.action);
    }
    return logs as T;
  }

  throw new Error(`Mock: endpoint non géré ${method} ${endpoint}`);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  setAuthToken(token: string) {
    localStorage.setItem("auth_token", token);
  }

  clearAuthToken() {
    localStorage.removeItem("auth_token");
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    if (USE_MOCK) {
      return mockRequest<T>(endpoint, options);
    }

    const { method = "GET", body, headers = {}, params } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const token = this.getAuthToken();
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }

    if (response.status === 204) return {} as T;
    return response.json();
  }

  get<T>(endpoint: string, params?: Record<string, string>) {
    return this.request<T>(endpoint, { params });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "POST", body });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "PUT", body });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "PATCH", body });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
