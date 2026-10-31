'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { getUser, clearAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => setUser(getUser()), []);

  const handleLogout = async () => {
    await api.logout(); // revokes the token on the server
    clearAuth();
    router.replace('/login/');
  };

  return (
    <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        {user?.school?.name && (
          <h1 className="text-lg font-semibold text-text-primary pl-10 lg:pl-0">{user.school.name}</h1>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="w-8 h-8 text-text-muted" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text-primary">{user?.name || 'School Admin'}</p>
            <p className="text-xs text-text-muted">{user?.id ? `${user.id} · School Admin` : 'School Admin'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-secondary"
          title="Sign out"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
