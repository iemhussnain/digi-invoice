'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { loginSchema } from '@/schemas/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [forceLoginRequired, setForceLoginRequired] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      forceLogin: false,
    },
  });

  // Handle form submit
  const onSubmit = async (formData) => {
    setLoading(true);
    setApiError('');
    setSuccessMessage('');
    setForceLoginRequired(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        setSuccessMessage(data.message);

        // Store token in localStorage
        if (data.data?.token) {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          localStorage.setItem('organization', JSON.stringify(data.data.organization));
        }

        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else if (response.status === 409) {
        // Active session on another device
        setForceLoginRequired(true);
        setDeviceInfo(data.errors);
        setApiError(data.errors?.message || 'You are logged in on another device');
      } else {
        // Other errors
        setApiError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setApiError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle force login
  const handleForceLogin = async () => {
    setValue('forceLogin', true);
    await handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Login to DigInvoice ERP
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
            <p className="font-medium">{successMessage}</p>
            <p className="text-sm mt-1">Redirecting to dashboard...</p>
          </div>
        )}

        {/* API Error */}
        {apiError && !forceLoginRequired && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
            {apiError}
          </div>
        )}

        {/* Force Login Warning */}
        {forceLoginRequired && deviceInfo && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg">
            <p className="font-medium mb-2">Active Session Detected</p>
            <p className="text-sm mb-3">
              You are already logged in on another device:
            </p>
            {deviceInfo.currentDevice && (
              <div className="bg-yellow-100 dark:bg-yellow-800 p-3 rounded mb-3 text-sm">
                <p><strong>Device:</strong> {deviceInfo.currentDevice.browser} on {deviceInfo.currentDevice.os}</p>
                <p><strong>Type:</strong> {deviceInfo.currentDevice.type}</p>
                <p><strong>Login:</strong> {new Date(deviceInfo.currentDevice.loginAt).toLocaleString()}</p>
                <p><strong>IP:</strong> {deviceInfo.currentDevice.ipAddress}</p>
              </div>
            )}
            <p className="text-sm mb-3">
              Do you want to logout from the previous device and login here?
            </p>
            <button
              onClick={handleForceLogin}
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              {loading ? 'Logging in...' : 'Yes, Logout & Login Here'}
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className={cn(
                  'mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'dark:bg-gray-700 dark:text-white',
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="current-password"
                className={cn(
                  'mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'dark:bg-gray-700 dark:text-white',
                  errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                placeholder="Enter your password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white',
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              )}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Create one now
              </Link>
            </p>
          </div>
        </form>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Protected by device fingerprinting and secure sessions
          </p>
        </div>
      </div>
    </div>
  );
}
