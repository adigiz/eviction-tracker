import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { ADMIN_USERNAME } from '../constants';

const AuthForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  if (!auth) {
    return <p>Auth context is not available.</p>;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      alert("Username and password are required.");
      return;
    }

    auth.login(trimmedUsername, trimmedPassword);
  };

  const handleNavigateToSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-500 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-primary-700 dark:text-primary-400 mb-8">EvictionTracker</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>
           <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex items-center justify-end space-x-4 pt-2">
             <button
              type="button"
              onClick={handleNavigateToSignUp}
              className="flex justify-center py-3 px-6 border border-primary-600 rounded-md shadow-sm text-sm font-medium text-primary-600 dark:text-primary-300 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Sign Up
            </button>
            <button
              type="submit"
              disabled={auth.isLoading}
              className="w-1/2 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {auth.isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
          Enter your credentials to log in, or click "Sign Up" to create a new account.
        </p>
      </div>
    </div>
  );
};

export default AuthForm;