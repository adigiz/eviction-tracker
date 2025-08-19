import toast from 'react-hot-toast';

export interface ErrorService {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
}

class ToastErrorService implements ErrorService {
  showError(message: string): void {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        border: '1px solid #dc2626',
      },
    });
  }

  showSuccess(message: string): void {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        border: '1px solid #059669',
      },
    });
  }

  showWarning(message: string): void {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#f59e0b',
        color: '#fff',
        border: '1px solid #d97706',
      },
    });
  }
}

export const errorService = new ToastErrorService();
