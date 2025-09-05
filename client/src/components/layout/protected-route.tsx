import { useEffect, useState } from "react";
import { authService } from "@/lib/auth";
import { User } from "@/types";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setLocation("/login");
          return;
        }

        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        if (requireAdmin && currentUser.role !== "admin") {
          setLocation("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setLocation, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
