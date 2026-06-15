"use client";

import Link from "next/link";
import Logo from "./Logo";

interface NavbarProps {
  variant?: "home" | "rider" | "admin";
  riderName?: string;
}

export default function Navbar({ variant = "home", riderName }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo size="sm" />

          <div className="flex items-center gap-3">
            {variant === "home" && (
              <>
                <Link
                  href="/rider/login"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Rider Login
                </Link>
                <Link
                  href="/rider/register"
                  className="text-sm font-semibold bg-emergency-600 hover:bg-emergency-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Become a Rider
                </Link>
              </>
            )}

            {variant === "rider" && riderName && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emergency-600 flex items-center justify-center text-white text-sm font-bold">
                  {riderName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  {riderName}
                </span>
              </div>
            )}

            {variant === "admin" && (
              <span className="text-sm font-semibold text-emergency-600 bg-emergency-50 dark:bg-emergency-900/20 px-3 py-1 rounded-full">
                Admin Panel
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
