import { User } from "@/types";

const API_BASE = "";

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  referralCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private static TOKEN_KEY = "ev_token";
  private static USER_KEY = "ev_user";

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static async login(data: LoginData): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const result = await response.json();
    this.setToken(result.token);
    this.setUser(result.user);
    return result;
  }

  static async register(data: RegisterData): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const result = await response.json();
    this.setToken(result.token);
    this.setUser(result.user);
    return result;
  }

  static async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No token found");
    }

    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
      }
      throw new Error("Failed to get current user");
    }

    const result = await response.json();
    this.setUser(result.user);
    return result.user;
  }

  static logout(): void {
    this.removeToken();
    window.location.href = "/login";
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === "admin";
  }
}

export const authService = AuthService;
