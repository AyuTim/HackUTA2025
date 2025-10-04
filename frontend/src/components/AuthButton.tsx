"use client";

import React from "react";
import { useUser } from '@auth0/nextjs-auth0/client';
import { LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";

export default function AuthButton() {
  const { user, error, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-300">Loading...</span>
      </div>
    );
  }

  // If user fetching fails (e.g., /api/auth/me is 500), still render a Login button
  if (error) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-red-400 text-sm">Error{error.message ? `: ${error.message}` : ''}</span>
        <Link
          href="/api/auth/login"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-900 to-red-900 px-4 py-2 text-sm font-semibold shadow-lg shadow-blue-600/30 hover:shadow-red-600/30 transition-all duration-300 hover:scale-105 spider-pulse"
        >
          <LogIn size={14} />
          Login
        </Link>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-300">
          <User size={16} className="text-blue-400 spider-glow" />
          <span className="text-sm">{user.name || user.email}</span>
        </div>
        <Link
          href="/api/auth/logout"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-900 to-red-800 px-4 py-2 text-sm font-semibold shadow-lg shadow-red-600/30 hover:shadow-red-600/40 transition-all duration-300 hover:scale-105 spider-pulse"
        >
          <LogOut size={14} />
          Logout
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/api/auth/login"
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-900 to-red-900 px-4 py-2 text-sm font-semibold shadow-lg shadow-blue-600/30 hover:shadow-red-600/30 transition-all duration-300 hover:scale-105 spider-pulse"
    >
      <LogIn size={14} />
      Login
    </Link>
  );
}
