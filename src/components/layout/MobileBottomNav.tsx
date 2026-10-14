"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Phone, Users, Calendar, Menu } from "lucide-react";

interface MobileBottomNavProps {
  shouldShowAgentShell: boolean;
}

export function MobileBottomNav({ shouldShowAgentShell }: MobileBottomNavProps) {
  const pathname = usePathname();

  const getDashboardHref = () => shouldShowAgentShell ? "/agent/dashboard" : "/dashboard";
  const getCallsHref = () => shouldShowAgentShell ? "/agent/call-center" : "/call-center";
  const getContactsHref = () => shouldShowAgentShell ? "/agent/customers" : "/leads/pool";
  const getTasksHref = () => shouldShowAgentShell ? "/agent/leads/follow-ups" : "/leads/follow-ups";

  const isTabActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="h-16 fixed bottom-0 left-0 right-0 z-40 bg-[#090909]/95 backdrop-blur-md border-t border-[#1e1e1e] px-4 flex items-center justify-between pb-safe">
      {/* Dashboard */}
      <Link href={getDashboardHref()} className="flex-1 flex flex-col items-center justify-center py-1">
        <div className={`p-1 rounded-xl transition-colors ${isTabActive(getDashboardHref()) ? "text-primary" : "text-slate-400 hover:text-white"}`}>
          <LayoutDashboard className="w-5.5 h-5.5" />
        </div>
        <span className={`text-[10px] font-bold ${isTabActive(getDashboardHref()) ? "text-primary" : "text-slate-400"}`}>
          Dash
        </span>
      </Link>

      {/* Calls */}
      <Link href={getCallsHref()} className="flex-1 flex flex-col items-center justify-center py-1">
        <div className={`p-1 rounded-xl transition-colors ${isTabActive(getCallsHref()) ? "text-primary" : "text-slate-400 hover:text-white"}`}>
          <Phone className="w-5.5 h-5.5" />
        </div>
        <span className={`text-[10px] font-bold ${isTabActive(getCallsHref()) ? "text-primary" : "text-slate-400"}`}>
          Calls
        </span>
      </Link>

      {/* Contacts */}
      <Link href={getContactsHref()} className="flex-1 flex flex-col items-center justify-center py-1">
        <div className={`p-1 rounded-xl transition-colors ${isTabActive(getContactsHref()) ? "text-primary" : "text-slate-400 hover:text-white"}`}>
          <Users className="w-5.5 h-5.5" />
        </div>
        <span className={`text-[10px] font-bold ${isTabActive(getContactsHref()) ? "text-primary" : "text-slate-400"}`}>
          Contacts
        </span>
      </Link>

      {/* Tasks */}
      <Link href={getTasksHref()} className="flex-1 flex flex-col items-center justify-center py-1">
        <div className={`p-1 rounded-xl transition-colors ${isTabActive(getTasksHref()) ? "text-primary" : "text-slate-400 hover:text-white"}`}>
          <Calendar className="w-5.5 h-5.5" />
        </div>
        <span className={`text-[10px] font-bold ${isTabActive(getTasksHref()) ? "text-primary" : "text-slate-400"}`}>
          Tasks
        </span>
      </Link>
    </nav>
  );
}
