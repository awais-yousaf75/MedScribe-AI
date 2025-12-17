// src/auth/AuthContext.tsx
import {
    createContext,
    useState,
    useEffect,
    
    useContext,
  } from "react";
  import type {ReactNode} from "react";
  import { toast } from "sonner";
  
  export type UserRole =
    | "doctor"
    | "patient"
    | "doctor_assistant"
    | "hospital_admin"
    | "super_admin";
  
  export interface SupabaseUser {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      role?: UserRole | string;
      [key: string]: any;
    };
  }
  
  export interface Profile {
    id: string;
    full_name: string;
    phone?: string;
    gender?: string;
    dob?: string;
    role: UserRole;
    approval_status: "pending" | "approved" | "rejected";
    [key: string]: any;
  }
  
  export const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";
  
  interface AuthContextValue {
    user: SupabaseUser | null;
    profile: Profile | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (
      email: string,
      password: string
    ) => Promise<{
      user: SupabaseUser | null;
      profile: Profile | null;
      role: UserRole | null;
    }>;
    logout: () => void;
    refreshProfile: (
      showWelcome?: boolean
    ) => Promise<{
      user: SupabaseUser | null;
      profile: Profile | null;
      role: UserRole | null;
    }>;
  }
  
  const AuthContext = createContext<AuthContextValue | undefined>(undefined);
  
  const getDisplayName = (user: SupabaseUser | null, profile: Profile | null) =>
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "User";
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);
  
    const clearAuthState = () => {
      setUser(null);
      setProfile(null);
      setRole(null);
    };
  
    const refreshProfile: AuthContextValue["refreshProfile"] = async (
      showWelcome = false
    ) => {
      const token = localStorage.getItem("accessToken");
  
      if (!token) {
        clearAuthState();
        setIsLoading(false);
        return { user: null, profile: null, role: null };
      }
  
      setIsLoading(true);
  
      try {
        const res = await fetch(`${API_URL}/api/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch current user");
        }
  
        const userData = data.user as SupabaseUser;
        const profileData = data.profile as Profile;
        const roleData = profileData.role;
  
        setUser(userData);
        setProfile(profileData);
        setRole(roleData);
  
        if (showWelcome) {
          toast.success(`Welcome back, ${getDisplayName(userData, profileData)}!`);
        }
  
        return { user: userData, profile: profileData, role: roleData };
      } catch (error: any) {
        console.error("Failed to refresh profile", error);
        localStorage.removeItem("accessToken");
        clearAuthState();
  
        if (showWelcome) {
          toast.error(error.message || "Authentication failed");
        }
  
        return { user: null, profile: null, role: null };
      } finally {
        setIsLoading(false);
      }
    };
  
    const login: AuthContextValue["login"] = async (email, password) => {
      setIsLoading(true);
  
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          throw new Error(data.error || "Login failed");
        }
  
        // Match your existing login response:
        // { session: { access_token }, user: {...} }
        const accessToken: string | undefined = data.session?.access_token;
  
        if (!accessToken) {
          throw new Error("Missing access token in response");
        }
  
        // Store token for /api/profile/me
        localStorage.setItem("accessToken", accessToken);
  
        // Optional: store role from user_metadata if you still want it
        const metaRole = data.user?.user_metadata?.role;
        if (metaRole) {
          localStorage.setItem("role", metaRole);
        }
  
        // Then hydrate user/profile/role via /api/profile/me
        const result = await refreshProfile(true);
        return result;
      } catch (error: any) {
        console.error("Login failed", error);
        toast.error(error.message || "Login failed");
        setIsLoading(false);
        return { user: null, profile: null, role: null };
      }
    };
  
    const logout = () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("role");
      clearAuthState();
      toast.info("You have been logged out");
    };
  
    useEffect(() => {
      // On app start, try to load user from existing token
      refreshProfile(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    const value: AuthContextValue = {
      user,
      profile,
      role,
      isAuthenticated: !!user && !!profile,
      isLoading,
      login,
      logout,
      refreshProfile,
    };
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  
  // Hook used by the rest of the app
  export function useAuthContextInternal() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
      throw new Error("AuthContext must be used inside AuthProvider");
    }
    return ctx;
  }
  
  export { AuthContext };