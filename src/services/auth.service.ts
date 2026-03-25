import apiClient from "@/lib/api-client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  group_id: string | null;
  role: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", credentials);
    apiClient.setAuthToken(response.token);
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      apiClient.clearAuthToken();
    }
  },

  async me(): Promise<AuthUser> {
    return apiClient.get<AuthUser>("/auth/me");
  },

  async registerUser(data: {
    email: string;
    password: string;
    username: string;
    role: string;
    group_id: string;
  }): Promise<AuthUser> {
    return apiClient.post<AuthUser>("/auth/register", data);
  },
};
