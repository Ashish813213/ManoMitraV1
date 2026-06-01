'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, forgotPassword } from '../../lib/api';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [forgotMode, setForgotMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotFormData, setForgotFormData] = useState({
    email: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (forgotMode) {
      setForgotFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (forgotMode) {
      if (!forgotFormData.email || !forgotFormData.newPassword || !forgotFormData.confirmNewPassword) {
        setError('All fields are required');
        return;
      }
      if (forgotFormData.newPassword !== forgotFormData.confirmNewPassword) {
        setError('New passwords do not match');
        return;
      }
      setSubmitting(true);
      try {
        await forgotPassword({
          email: forgotFormData.email,
          newPassword: forgotFormData.newPassword,
          confirmNewPassword: forgotFormData.confirmNewPassword,
        });
        setSuccessMsg('Password reset successfully! You can now log in with your new password.');
        setForgotFormData({ email: '', newPassword: '', confirmNewPassword: '' });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Password reset failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!formData.email || !formData.password) {
        setError('All fields are required');
        return;
      }

      setSubmitting(true);
      try {
        await login({ email: formData.email, password: formData.password });
        router.push('/dashboard');
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex items-center justify-center py-16">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">ManoMITRA</h1>
            <p className="text-gray-600">
              {forgotMode ? 'Reset your password below.' : 'Welcome back! Please log in to your account.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {forgotMode ? (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={forgotFormData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="your@email.com"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={forgotFormData.newPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="At least 8 characters"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-600 hover:text-gray-900"
                      disabled={submitting}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmNewPassword"
                    value={forgotFormData.confirmNewPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Re-enter new password"
                    disabled={submitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="your@email.com"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      placeholder="••••••••"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-600 hover:text-gray-900"
                      disabled={submitting}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setError(''); setSuccessMsg(''); }}
                    className="text-blue-600 hover:text-blue-700 font-semibold bg-transparent border-none cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Logging in...' : 'Login'}
                </button>
              </>
            )}
          </form>

          {forgotMode ? (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setForgotMode(false); setError(''); setSuccessMsg(''); }}
                className="text-blue-600 hover:text-blue-700 font-bold bg-transparent border-none cursor-pointer"
              >
                ← Back to Login
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6">
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="border border-gray-300 rounded-lg py-2 hover:border-gray-400 transition font-semibold">
                    Google
                  </button>
                  <button className="border border-gray-300 rounded-lg py-2 hover:border-gray-400 transition font-semibold">
                    Facebook
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-bold">
                    Sign up here
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>By logging in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </main>
  );
}
