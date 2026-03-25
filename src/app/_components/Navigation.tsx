"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex w-full items-center justify-between md:justify-start md:space-x-8">
        <h1 className="text-base md:text-lg font-black text-slate-900 shrink-0">Voice Assistant</h1>
        <div className="flex items-center space-x-4 md:space-x-8">
          <Link
            href="/"
            className={`text-xs md:text-sm font-semibold transition-colors ${
              pathname === "/" ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Assistant
          </Link>
          <Link
            href="/dashboard"
            className={`text-xs md:text-sm font-semibold transition-colors ${
              pathname === "/dashboard" ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
};
