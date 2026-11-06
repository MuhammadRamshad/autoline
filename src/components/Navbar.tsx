"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  };

  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="border-b border-neutral-900 bg-black/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="text-sm font-bold tracking-tight text-white uppercase hover:text-neutral-300 transition-colors">
          Autoline
        </Link>

        {/* Right side controls: Theme Toggle + Navigation */}
        <div className="flex items-center gap-2.5 sm:gap-4 text-xs font-medium">
          {isAdmin && (
            <>
              <Link 
                href="/shop"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Shop
              </Link>
              <Link 
                href="/admin" 
                className="text-white hover:text-neutral-300 transition-colors"
              >
                Admin
              </Link>
              <Link 
                href="/admin/pricing" 
                className="text-neutral-400 hover:text-white transition-colors hidden sm:inline"
              >
                Pricing
              </Link>
              {pathname !== "/admin/login" && (
                <button
                  onClick={handleLogout}
                  className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </>
          )}

          {/* Theme Toggle Button */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
