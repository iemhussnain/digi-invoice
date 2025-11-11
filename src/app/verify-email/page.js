'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  // Auto-redirect to login after successful verification
  useEffect(() => {
    if (verified && !alreadyVerified) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 5000); // Redirect after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [verified, alreadyVerified, router]);

  // Verify email on page load
  useEffect(() => {
    if (!token) {
      setError('Invalid verification link. No token provided.');
      setVerifying(false);
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      setVerifying(true);
      setError('');

      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setVerified(true);
        setUserInfo(data.data.user);

        // Check if already verified
        if (data.data.alreadyVerified) {
          setAlreadyVerified(true);
        }
      } else {
        setError(data.message || 'Failed to verify email');
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();

    if (!resendEmail) {
      setError('Please enter your email address');
      return;
    }

    try {
      setResending(true);
      setError('');
      setResendSuccess(false);

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
        setResendEmail('');
      } else {
        setError(data.message || 'Failed to resend verification email');
      }
    } catch (err) {
      console.error('Resend verification error:', err);
      setError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            DigInvoice ERP
          </h1>
          <p className="text-gray-600">Email Verification</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Verifying State */}
          {verifying && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Your Email...
              </h2>
              <p className="text-gray-600 text-sm">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {/* Success State */}
          {!verifying && verified && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {alreadyVerified ? 'Already Verified!' : 'Email Verified Successfully!'}
              </h2>

              {userInfo && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">
                    <strong>{userInfo.name}</strong>
                  </p>
                  <p className="text-xs text-green-600">
                    {userInfo.email}
                  </p>
                </div>
              )}

              <p className="text-gray-600 text-sm mb-6">
                {alreadyVerified
                  ? 'Your email was already verified. You can now login to your account.'
                  : 'Thank you for verifying your email address. You can now access all features of your account.'}
              </p>

              {!alreadyVerified && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    Redirecting to login page in 5 seconds...
                  </p>
                </div>
              )}

              <Link
                href="/login"
                className="inline-block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
              >
                Go to Login
              </Link>
            </div>
          )}

          {/* Error State */}
          {!verifying && !verified && error && (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Verification Failed
                </h2>
              </div>

              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>

              {/* Resend Verification Form */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Request New Verification Link
                </h3>

                {resendSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-green-800 mb-1">
                          Verification Email Sent!
                        </h4>
                        <p className="text-sm text-green-700">
                          Please check your inbox and click the verification link.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleResendVerification} className="space-y-4">
                  <div>
                    <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="resend-email"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      required
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      disabled={resending}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resending}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {resending ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </button>
                </form>
              </div>

              <div className="text-center space-y-2">
                <Link
                  href="/login"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        {!verifying && verified && (
          <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              What's Next?
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Login to your account</li>
              <li>Complete your profile setup</li>
              <li>Explore the dashboard</li>
              <li>Start managing your business</li>
            </ol>
          </div>
        )}

        {/* Help Box for Error State */}
        {!verifying && !verified && error && (
          <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Common Issues
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Verification link may have expired</li>
              <li>Link may have already been used</li>
              <li>Email address may not match</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              If problems persist, contact support or request a new verification email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
