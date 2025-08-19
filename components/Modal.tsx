import React from 'react';
import { useLocation } from 'react-router-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  const bgClass = isAdminPage ? 'bg-gray-800' : 'bg-white dark:bg-gray-800';
  const borderClass = isAdminPage ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700';
  const titleClass = isAdminPage ? 'text-gray-100' : 'text-gray-800 dark:text-gray-100';
  const closeButtonClass = isAdminPage ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
      <div className={`${bgClass} rounded-lg shadow-xl transform transition-all duration-300 ease-in-out w-full m-4 ${sizeClasses[size]} overflow-hidden`}>
        <div className={`flex items-center justify-between p-4 border-b ${borderClass}`}>
          <h3 className={`text-xl font-semibold ${titleClass}`}>{title}</h3>
          <button
            onClick={onClose}
            className={`${closeButtonClass} transition-colors`}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;