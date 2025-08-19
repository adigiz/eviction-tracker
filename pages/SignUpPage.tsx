import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../App";
import { useZodForm } from "../hooks/useZodForm";
import { signupSchema, type SignupFormData } from "../lib/validations";
import { FormInput } from "../components/ui/FormInput";
import { FormProvider } from "react-hook-form";

const SignUpPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const form = useZodForm(signupSchema, {
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      businessName: "",
      address: "",
      email: "",
      phone: "",
      referralCode: "",
    },
  });

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

  const handleSignUp = async (data: any) => {
    try {
      await auth.register(data);
      navigate("/dashboard");
    } catch (error) {
      // Error is already handled by the auth service
    }
  };

  const handleNavigateToSignIn = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-500 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-primary-700 dark:text-primary-400 mb-8">
          Create Your Account
        </h1>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleSignUp)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                name="username"
                label="Username"
                type="text"
                placeholder="Enter your username"
                required
                autoComplete="username"
                disabled={form.formState.isSubmitting}
              />

              <FormInput
                name="name"
                label="Full Name / Company Name"
                type="text"
                placeholder="Enter your full name"
                required
                autoComplete="name"
                disabled={form.formState.isSubmitting}
              />

              <FormInput
                name="email"
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                required
                autoComplete="email"
                disabled={form.formState.isSubmitting}
              />

              <FormInput
                name="phone"
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number"
                required
                autoComplete="tel"
                disabled={form.formState.isSubmitting}
              />

              <FormInput
                name="businessName"
                label="Business Name"
                type="text"
                placeholder="Enter your business name (optional)"
                isOptional
                autoComplete="organization"
                disabled={form.formState.isSubmitting}
              />

              <FormInput
                name="referralCode"
                label="Referral Code"
                type="text"
                placeholder="Enter referral code (optional)"
                isOptional
                disabled={form.formState.isSubmitting}
              />
            </div>

            <FormInput
              name="address"
              label="Mailing Address"
              type="text"
              placeholder="Enter your mailing address"
              required
              autoComplete="street-address"
              disabled={form.formState.isSubmitting}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    {...form.register("password")}
                    className={`mt-1 block w-full px-4 py-2 pr-12 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors ${
                      form.formState.errors.password
                        ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    } text-gray-900 dark:text-white`}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    disabled={form.formState.isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    disabled={form.formState.isSubmitting}
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
                {form.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirm Password <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    {...form.register("confirmPassword")}
                    className={`mt-1 block w-full px-4 py-2 pr-12 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors ${
                      form.formState.errors.confirmPassword
                        ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    } text-gray-900 dark:text-white`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={form.formState.isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    disabled={form.formState.isSubmitting}
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
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {/* Primary Sign Up Button */}
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full flex justify-center items-center py-2 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {form.formState.isSubmitting ? (
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

              {/* Secondary Sign In Button */}
              <button
                type="button"
                onClick={handleNavigateToSignIn}
                className="w-full flex justify-center items-center py-2 px-6 border-2 border-primary-200 dark:border-primary-700 rounded-lg shadow-sm text-base font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
                disabled={form.formState.isSubmitting}
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
              </button>
            </div>
          </form>
        </FormProvider>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 font-medium">
            Join thousands of landlords using EvictionTracker
          </p>
          <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="mb-2 font-semibold text-gray-600 dark:text-gray-300">
              🚀 Try Demo Accounts:
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Admin:</span>
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">
                    admin / admin123
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Landlord:</span>
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">
                    landlord / landlord123
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Contractor:</span>
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">
                    contractor / contractor123
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
