"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Headphones,
  TrendingUp,
  Database,
  Sliders,
  FileText,
  BarChart3,
} from 'lucide-react';

interface SopNavProps {
  badgeCounts?: {
    daily?: number;
    hr?: number;
    ccr?: number;
    sales?: number;
    dataEntry?: number;
    pendingApprovals?: number;
  };
}

export function SopNav({ badgeCounts }: SopNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/sop',
      label: 'Overview',
      icon: LayoutDashboard,
      isActive: pathname === '/sop',
    },
    {
      href: '/sop/daily-operations',
      label: 'Daily Operations',
      icon: CalendarCheck,
      badge: badgeCounts?.daily,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      isActive: pathname === '/sop/daily-operations',
    },
    {
      href: '/sop/hr',
      label: 'HR SOP',
      icon: Users,
      badge: badgeCounts?.hr,
      isActive: pathname === '/sop/hr',
    },
    {
      href: '/sop/ccr',
      label: 'CCR SOP',
      icon: Headphones,
      badge: badgeCounts?.ccr,
      isActive: pathname === '/sop/ccr',
    },
    {
      href: '/sop/sales',
      label: 'Sales SOP',
      icon: TrendingUp,
      badge: badgeCounts?.sales,
      isActive: pathname === '/sop/sales',
    },
    {
      href: '/sop/data-entry',
      label: 'Data Entry SOP',
      icon: Database,
      badge: badgeCounts?.dataEntry,
      isActive: pathname === '/sop/data-entry',
    },
    {
      href: '/sop/builder',
      label: 'SOP Builder',
      icon: Sliders,
      isActive: pathname === '/sop/builder',
    },
    {
      href: '/sop/documents',
      label: 'SOP Documents',
      icon: FileText,
      isActive: pathname === '/sop/documents',
    },
    {
      href: '/sop/reports',
      label: 'Reports & Audit',
      icon: BarChart3,
      badge: badgeCounts?.pendingApprovals,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      isActive: pathname === '/sop/reports',
    },
  ];

  return (
    <div className="w-full bg-[#0a0a0a] border-b border-[#222] px-4 py-2 overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-1.5 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  item.isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a1a1a] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
