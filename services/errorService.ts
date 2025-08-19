import toast from 'react-hot-toast';

export interface ErrorService {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

class ToastErrorService implements ErrorService {
  showError(message: string): void {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#fef2f2',
        color: '#991b1b',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: '#dc2626',
        secondary: '#fef2f2',
      },
    });
  }

  showSuccess(message: string): void {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#f0fdf4',
        color: '#166534',
        border: '1px solid #bbf7d0',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: '#16a34a',
        secondary: '#f0fdf4',
      },
    });
  }

  showWarning(message: string): void {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#fffbeb',
        color: '#92400e',
        border: '1px solid #fed7aa',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      icon: '⚠️',
    });
  }

  showInfo(message: string): void {
    toast(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#eff6ff',
        color: '#1e40af',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      icon: 'ℹ️',
    });
  }
}

export const errorService = new ToastErrorService();
