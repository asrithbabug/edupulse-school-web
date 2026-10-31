'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AcademicCapIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { isSchoolAdmin, setAuth } from '@/lib/auth';

const MESSAGES = {
  PASSWORD_NOT_SET: 'Please set your password using the link sent to your email first. Use "Forgot password?" for a new link.',
  SCHOOL_LOCKED: 'Your school account has been locked. Please contact EduPulse support.',
  SCHOOL_INACTIVE: 'Your school account is inactive. Please contact EduPulse support.',
  ACCOUNT_INACTIVE: 'Your account has been deactivated.',
  INVALID_CREDENTIALS: 'Invalid admin ID or password.',
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (isSchoolAdmin()) router.replace('/dashboard/');
  }, [router]);

  const update = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login(formData);
      setAuth(token, user);
      router.replace('/dashboard/');
    } catch (err) {
      setError(MESSAGES[err.code] || err.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(identifier);
      setNotice('If an account with that email or ID exists, a reset link has been sent. Check your email.');
      setMode('login');
    } catch (err) {
      setError(err.message || 'Could not send the reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="card border border-border rounded-3xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <AcademicCapIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">EduPulse</h1>
            <p className="text-text-secondary mt-2">
              {mode === 'login' ? 'School admin sign in' : 'Reset your password'}
            </p>
          </div>

          {notice && <p className="text-sm text-success bg-success/10 p-3 rounded-lg">{notice}</p>}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">Admin ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => update('id', e.target.value)}
                  placeholder="e.g. ADM001"
                  autoComplete="username"
                  className={`input-field ${error ? 'border-danger' : ''}`}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className={`input-field ${error ? 'border-danger' : ''}`}
                  required
                />
              </div>

              {error && <p className="text-sm text-danger bg-danger/10 p-3 rounded-lg">{error}</p>}

              <button
                type="submit"
                disabled={loading || !formData.id.trim() || !formData.password}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setNotice(''); }}
                className="w-full text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">Email or Admin ID</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                  placeholder="you@school.com or ADM001"
                  className="input-field"
                  required
                />
              </div>

              {error && <p className="text-sm text-danger bg-danger/10 p-3 rounded-lg">{error}</p>}

              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-text-secondary hover:text-primary"
              >
                <ArrowLeftIcon className="w-4 h-4" /> Back to sign in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
