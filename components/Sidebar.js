'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  BookOpenIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  LifebuoyIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const menu = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Admissions', href: '/students', icon: UserGroupIcon },
  { label: 'Staff', href: '/staff', icon: AcademicCapIcon },
  { label: 'Attendance', href: '/attendance', icon: ClipboardDocumentCheckIcon },
  { label: 'Timetable', href: '/timetable', icon: ClockIcon },
  { label: 'Subjects', href: '/subjects', icon: BookOpenIcon },
  { label: 'Exams', href: '/exams', icon: DocumentTextIcon },
  { label: 'Calendar', href: '/calendar', icon: CalendarDaysIcon },
  { label: 'Fees', href: '/fees', icon: CurrencyDollarIcon },
  { label: 'Announcements', href: '/announcements', icon: MegaphoneIcon },
  { label: 'Permissions', href: '/permissions', icon: ShieldCheckIcon },
  { label: 'Bulk Import', href: '/bulk-import', icon: ArrowUpTrayIcon },
  { label: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { label: 'Help & Support', href: '/support', icon: LifebuoyIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="h-16 flex items-center justify-center border-b border-border bg-white">
        <AcademicCapIcon className="w-6 h-6 text-primary mr-2" />
        <h2 className="text-xl font-bold text-primary">EduPulse</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menu.map((item) => {
          const path = pathname?.replace(/\/$/, '') || '/';
          const isActive = path === item.href || path.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-border shadow-sm"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-border">
        <NavContent />
      </aside>
    </>
  );
}