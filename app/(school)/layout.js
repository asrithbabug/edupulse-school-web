'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { clearAuth, isAuthenticated, isSchoolAdmin } from '@/lib/auth';

/** Every signed-in page of the school app. Anyone else goes to the login page. */
export default function SchoolLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSchoolAdmin()) {
      if (isAuthenticated()) clearAuth();
      router.replace('/login/');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
