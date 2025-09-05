import { useState } from "react";
import { Link, useLocation } from "wouter";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Zap, 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  User, 
  PlusCircle, 
  LogOut,
  Menu,
  Shield,
  History,
  Minus,
  X
} from "lucide-react";

export function MobileNavbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = authService.getUser();
  const isAdmin = authService.isAdmin();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    authService.logout();
  };

  const mainNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/investment", label: "Invest", icon: TrendingUp },
    { href: "/refer", label: "Refer", icon: Users },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const actionItems = [
    { href: "/deposit", label: "Deposit", icon: PlusCircle },
    { href: "/withdrawal", label: "Withdraw", icon: Minus },
    { href: "/history", label: "History", icon: History },
  ];

  if (isAdmin) {
    mainNavItems.push({ href: "/admin", label: "Admin", icon: Shield });
  }

  if (!isMobile) {
    return null; // Show original navbar on desktop
  }

  return (
    <>
      {/* Mobile Top Header */}
      <header className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 shadow-xl sticky top-0 z-50 border-0 m-0">
        <div className="px-3 py-1">
          <div className="flex justify-between items-center">
            <Link href="/dashboard">
              <div className="flex items-center cursor-pointer">
                <Zap className="text-yellow-300 mr-2" size={24} />
                <h1 className="text-lg font-bold text-white">EV Pro</h1>
              </div>
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="text-white text-right">
                <div className="text-sm font-medium truncate max-w-24">{user?.fullName?.split(' ')[0]}</div>
                <div className="text-xs text-gold-100">₹{parseFloat(user?.balance || "0").toLocaleString()}</div>
              </div>
              
              <Button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                variant="ghost"
                size="sm"
                className="text-white p-2"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="bg-white shadow-lg border-t border-gold-200">
            <div className="px-3 py-3 space-y-2">
              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {actionItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        onClick={() => setMobileMenuOpen(false)}
                        variant="outline"
                        size="sm"
                        className="w-full flex flex-col items-center py-3 h-auto"
                      >
                        <Icon size={16} className="mb-1" />
                        <span className="text-xs">{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
              
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="grid grid-cols-4 h-16">
          {mainNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`
                  flex flex-col items-center justify-center h-full transition-colors cursor-pointer
                  ${isActive 
                    ? 'text-gold-600 bg-gold-50' 
                    : 'text-gray-600 hover:text-gold-600'
                  }
                `}>
                  <Icon size={20} className="mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-16"></div>
    </>
  );
}