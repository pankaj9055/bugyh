import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { MobileNavbar } from "./mobile-navbar";
import { FloatingSupportButton } from "@/components/ui/floating-support-button";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className = "" }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <MobileNavbar />
      
      <main className={`max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-2 pb-20 md:pt-2 md:pb-8 ${className}`}>
        {children}
      </main>
      <FloatingSupportButton />
    </div>
  );
}