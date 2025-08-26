import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Investment from "@/pages/investment";
import Refer from "@/pages/refer";
import Profile from "@/pages/profile";
import Deposit from "@/pages/deposit-new";
import Withdrawal from "@/pages/withdrawal";
import Admin from "@/pages/admin-new";
import AdminLogin from "@/pages/admin-login";
import History from "@/pages/history";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { authService } from "@/lib/auth";
import { useEffect } from "react";

function Router() {
  useEffect(() => {
    // Check if user is authenticated on app load
    if (!authService.isAuthenticated() && !["/login", "/register", "/admin/login"].includes(window.location.pathname)) {
      window.location.href = "/login";
    }
  }, []);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin/login" component={AdminLogin} />
      
      <Route path="/" component={() => {
        if (authService.isAuthenticated()) {
          window.location.href = "/dashboard";
          return null;
        }
        window.location.href = "/login";
        return null;
      }} />
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/investment">
        <ProtectedRoute>
          <Investment />
        </ProtectedRoute>
      </Route>
      
      <Route path="/withdrawal">
        <ProtectedRoute>
          <Withdrawal />
        </ProtectedRoute>
      </Route>
      
      <Route path="/refer">
        <ProtectedRoute>
          <Refer />
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      
      <Route path="/deposit">
        <ProtectedRoute>
          <Deposit />
        </ProtectedRoute>
      </Route>
      
      <Route path="/withdrawal">
        <ProtectedRoute>
          <Withdrawal />
        </ProtectedRoute>
      </Route>
      
      <Route path="/history">
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute requireAdmin>
          <Admin />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
