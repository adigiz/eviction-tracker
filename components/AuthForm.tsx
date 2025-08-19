import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

const AuthForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  // Auto-focus username field on mount
  useEffect(() => {
    const usernameInput = document.getElementById(
      "username"
    ) as HTMLInputElement;
    if (usernameInput) {
      usernameInput.focus();
    }
  }, []);

  if (!auth) {
    return <p>Auth context is not available.</p>;
  }

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};

    // Username validation
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (username.trim().length > 20) {
      newErrors.username = "Username must be less than 20 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      newErrors.username =
        "Username can only contain letters, numbers, hyphens, and underscores";
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.trim().length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (password.trim().length > 50) {
      newErrors.password = "Password must be less than 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await auth.login(username.trim(), password.trim());
    } catch (error) {
      // Error is already handled by the auth service
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin(e as any);
    }
  };

  const handleNavigateToSignUp = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-500 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-primary-700 dark:text-primary-400 mb-8">
          EvictionTracker
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username)
                  setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              onKeyPress={handleKeyPress}
              className={`mt-1 block w-full px-4 py-3 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors ${
                errors.username
                  ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              } text-gray-900 dark:text-white`}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={isSubmitting}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.username}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                onKeyPress={handleKeyPress}
                className={`mt-1 block w-full px-4 py-3 pr-12 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors ${
                  errors.password
                    ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                } text-gray-900 dark:text-white`}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>
          <div className="space-y-4 pt-2">
            {/* Primary Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign In</span>
                </div>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  or
                </span>
              </div>
            </div>

            {/* Secondary Sign Up Button */}
            <button
              type="button"
              onClick={handleNavigateToSignUp}
              className="w-full flex justify-center items-center py-3 px-6 border-2 border-primary-200 dark:border-primary-700 rounded-lg shadow-sm text-base font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
              disabled={isSubmitting}
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Create New Account
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 font-medium">
            Welcome back! Sign in to access your dashboard
          </p>
          <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="mb-2 font-semibold text-gray-600 dark:text-gray-300">
              🚀 Try Demo Accounts:
            </p>
            <div className="space-y-1 text-xs">
              <p className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>
                  Admin:{" "}
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    admin
                  </code>{" "}
                  /{" "}
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    admin123
                  </code>
                </span>
              </p>
              <p className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>
                  Landlord:{" "}
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    landlord
                  </code>{" "}
                  /{" "}
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    landlord123
                  </code>
                </span>
              </p>
              <p className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>
                  Contractor:{" "}
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    contractor
                  </code>{" "}
                  /{" "}
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    contractor123
                  </code>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
