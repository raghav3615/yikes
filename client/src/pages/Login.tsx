import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
  twoFactorCode?: string;
  rememberMe: boolean;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { login, error, clearError } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<LoginFormData>({
    defaultValues: {
      rememberMe: false
    }
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      clearError();
      
      await login(data.email, data.password, data.twoFactorCode, data.rememberMe);
      
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      // Error is handled by the store and displayed via toast
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    const email = watchedEmail;
    const password = watchedPassword;
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();
      
      await login(email, password, undefined, false);
      
      // Check if 2FA is required
      const user = useAuthStore.getState().user;
      if (user?.twoFactorEnabled) {
        setShowTwoFactor(true);
        setIsSubmitting(false);
        return;
      }
      
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <LockClosedIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your password manager
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={`appearance-none relative block w-full px-3 py-3 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Master Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 12,
                      message: 'Password must be at least 12 characters'
                    }
                  })}
                  className={`appearance-none relative block w-full px-3 py-3 pr-12 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors`}
                  placeholder="Enter your master password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Two-Factor Authentication */}
            {showTwoFactor && (
              <div className="animate-slide-up">
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700">
                  Two-Factor Authentication Code
                </label>
                <div className="mt-1">
                  <input
                    id="twoFactorCode"
                    type="text"
                    autoComplete="one-time-code"
                    {...register('twoFactorCode', {
                      required: '2FA code is required',
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'Please enter a 6-digit code'
                      }
                    })}
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      errors.twoFactorCode ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors`}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                  {errors.twoFactorCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.twoFactorCode.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  {...register('rememberMe')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Remember me for 7 days
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <LockClosedIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Security Note:</strong> Your master password is never sent to our servers. 
                All encryption happens locally in your browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
