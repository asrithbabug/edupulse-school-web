'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading, valid, invalid, success, error
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setErrorMessage('No token provided. Please use the link from your email.');
      return;
    }

    verifyToken();
  }, [token]);

  async function verifyToken() {
    try {
      const result = await api.verifyPasswordToken(token);
      setStatus('valid');
      setUserName(result?.user_name || '');
    } catch (err) {
      setStatus('invalid');
      setErrorMessage(err.status ? err.message : 'Unable to verify link. Please try again later.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await api.setPassword({ token, password });
      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to set password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Loading state */}
      {status === 'loading' && (
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-[#5B5FC7] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Verifying your link...</p>
        </div>
      )}

      {/* Invalid/Expired token */}
      {status === 'invalid' && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Invalid or Expired</h2>
          <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <strong>Need help?</strong> Contact your school administrator to request a new password setup link.
            </p>
          </div>
        </div>
      )}

      {/* Valid token — Show form */}
      {status === 'valid' && (
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Set Your Password</h2>
            {userName && (
              <p className="text-gray-500 text-sm mt-1">
                Welcome, <span className="font-medium text-gray-700">{userName}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5B5FC7] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Minimum 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5B5FC7] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#5B5FC7] hover:bg-[#4a4eb5] text-white font-semibold rounded-lg transition-colors shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Setting Password...
                </span>
              ) : (
                'Set Password'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 rounded-full mb-4">
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Set Successfully!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your password has been set. You can now log in to the EduPulse app with your credentials.
          </p>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-2 text-left">
            <p className="text-indigo-800 text-sm">
              <strong>Teachers and parents:</strong> open the EduPulse app on your phone and sign in with your User ID and new password.
            </p>
            <p className="text-indigo-800 text-sm">
              <strong>School admins:</strong>{' '}
              <a href="/login/" className="underline font-medium">sign in to the school web app</a>.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#5B5FC7] rounded-2xl mb-4 shadow-lg shadow-indigo-200">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">EduPulse</h1>
          <p className="text-sm text-gray-500 mt-1">School Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-gray-100 overflow-hidden">
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-3 border-[#5B5FC7] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          }>
            <SetPasswordForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} EduPulse. All rights reserved.
        </p>
      </div>
    </div>
  );
}
