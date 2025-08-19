import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../App";
import { RegistrationData } from "../types";

const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationData>({
    username: "",
    password: "",
    name: "",
    businessName: "",
    address: "",
    email: "",
    phone: "",
    referralCode: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
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
    const newErrors: { [key: string]: string } = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.trim().length > 20) {
      newErrors.username = "Username must be less than 20 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim())) {
      newErrors.username =
        "Username can only contain letters, numbers, hyphens, and underscores";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (formData.password.length > 50) {
      newErrors.password = "Password must be less than 50 characters";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (
      !/^[\+]?[1-9][\d]{0,15}$/.test(
        formData.phone.trim().replace(/[\s\-\(\)]/g, "")
      )
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    } else if (formData.address.trim().length < 5) {
      newErrors.address = "Address must be at least 5 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);

    // Clear error when user starts typing
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await auth.register(formData);
    } catch (error) {
      // Error is already handled by the auth service
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSignUp(e as any);
    }
  };

  const inputFieldClasses =
    "mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm";
  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const requiredSpan = (
    <span className="text-red-500 dark:text-red-400">*</span>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-500 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-primary-700 dark:text-primary-400 mb-8">
          Create Your Account
        </h1>
        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="username" className={labelClasses}>
                Username {requiredSpan}
              </label>
              <input
                type="text"
                name="username"
                id="username"
                value={formData.username}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className={`${inputFieldClasses} ${
                  errors.username
                    ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                    : ""
                }`}
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
              <label htmlFor="name" className={labelClasses}>
                Full Name / Company Name {requiredSpan}
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className={`${inputFieldClasses} ${
                  errors.name
                    ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                    : ""
                }`}
                autoComplete="name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className={labelClasses}>
                Password {requiredSpan}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  className={`${inputFieldClasses} pr-12 ${
                    errors.password
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : ""
                  }`}
                  autoComplete="new-password"
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
            <div>
              <label htmlFor="confirmPassword" className={labelClasses}>
                Confirm Password {requiredSpan}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onKeyPress={handleKeyPress}
                  className={`${inputFieldClasses} pr-12 ${
                    errors.confirmPassword
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : ""
                  }`}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
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
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="email" className={labelClasses}>
                Email Address {requiredSpan}
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className={`${inputFieldClasses} ${
                  errors.email
                    ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                    : ""
                }`}
                autoComplete="email"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className={labelClasses}>
                Phone Number {requiredSpan}
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className={`${inputFieldClasses} ${
                  errors.phone
                    ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                    : ""
                }`}
                autoComplete="tel"
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.phone}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address" className={labelClasses}>
                Mailing Address {requiredSpan}
              </label>
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className={`${inputFieldClasses} ${
                  errors.address
                    ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                    : ""
                }`}
                autoComplete="street-address"
                disabled={isSubmitting}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.address}
                </p>
              )}
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="businessName" className={labelClasses}>
                  Business Name (Optional)
                </label>
                <input
                  type="text"
                  name="businessName"
                  id="businessName"
                  value={formData.businessName || ""}
                  onChange={handleChange}
                  className={inputFieldClasses}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="referralCode" className={labelClasses}>
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  name="referralCode"
                  id="referralCode"
                  value={formData.referralCode || ""}
                  onChange={handleChange}
                  className={inputFieldClasses}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
          <div className="space-y-4 pt-4">
            {/* Primary Sign Up Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
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
                  <span>Creating Account...</span>
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  <span>Create Account</span>
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

            {/* Secondary Login Link Button */}
            <Link
              to="/login"
              className="w-full flex justify-center items-center py-3 px-6 border-2 border-primary-200 dark:border-primary-700 rounded-xl shadow-sm text-base font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
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
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Already have an account? Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
