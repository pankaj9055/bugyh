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
import { SupportButton } from "@/components/support-button";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = authService.getUser();
  const isAdmin = authService.isAdmin();
  const isMobile = useIsMobile();

  // Hide navbar on mobile - mobile navigation will handle it
  if (isMobile) {
    return null;
  }

  const handleLogout = () => {
    authService.logout();
  };

  const mainNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/investment", label: "Investment", icon: TrendingUp },
    { href: "/refer", label: "Refer & Earn", icon: Users },
  ];

  const transactionNavItems = [
    { href: "/deposit", label: "Deposit", icon: PlusCircle },
    { href: "/withdrawal", label: "Withdraw", icon: Minus },
    { href: "/history", label: "History", icon: History },
  ];

  const accountNavItems = [
    { href: "/profile", label: "Profile", icon: User },
  ];

  if (isAdmin) {
    accountNavItems.push({ href: "/admin", label: "Admin Panel", icon: Shield });
  }

  return (
    <>
      {/* Main Header */}
      <nav className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12">
            <div className="flex items-center">
              <Link href="/dashboard">
                <div className="flex-shrink-0 cursor-pointer">
                  <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center">
                    <Zap className="text-yellow-300 mr-2" size={28} />
                    <span className="hidden sm:inline">EV Investment Pro</span>
                    <span className="sm:hidden">EV Pro</span>
                  </h1>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-white text-sm hidden md:block">
                <div>Welcome, <span className="font-semibold">{user?.fullName}</span></div>
                <div className="text-xs text-gold-100">Balance: ₹{parseFloat(user?.balance || "0").toLocaleString()}</div>
              </div>
              
              <SupportButton />
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-gold-600 border-white hover:bg-white"
              >
                <LogOut size={16} className="mr-1" />
                Logout
              </Button>

              <Button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                variant="ghost"
                size="sm"
                className="md:hidden text-white"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 h-10">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`
                    flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer
                    ${location === item.href 
                      ? 'text-gold-600 bg-gold-50 border-b-2 border-gold-500' 
                      : 'text-gray-600 hover:text-gold-600 hover:bg-gold-50'
                    }
                  `}>
                    <Icon size={18} className="mr-2" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <nav className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-8">
            <div className="flex space-x-6">
              {transactionNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`
                      flex items-center px-3 py-3 text-xs font-medium transition-colors cursor-pointer
                      ${location === item.href 
                        ? 'text-gold-600 border-b-2 border-gold-400' 
                        : 'text-gray-500 hover:text-gold-600'
                      }
                    `}>
                      <Icon size={14} className="mr-1" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <div className="flex space-x-6">
              {accountNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`
                      flex items-center px-3 py-3 text-xs font-medium transition-colors cursor-pointer
                      ${location === item.href 
                        ? 'text-gold-600 border-b-2 border-gold-400' 
                        : 'text-gray-500 hover:text-gold-600'
                      }
                    `}>
                      <Icon size={14} className="mr-1" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg border-b border-gray-200">
          <div className="px-4 py-4 space-y-2">
            {[...mainNavItems, ...transactionNavItems, ...accountNavItems].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer
                      ${location === item.href 
                        ? 'text-gold-600 bg-gold-50' 
                        : 'text-gray-600 hover:text-gold-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon size={16} className="mr-3" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}