export interface ErrorService {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
}

class BrowserErrorService implements ErrorService {
  showError(message: string): void {
    // For now, use alert but this can be replaced with toast notifications
    alert(`Error: ${message}`);
  }

  showSuccess(message: string): void {
    // For now, use alert but this can be replaced with toast notifications
    alert(`Success: ${message}`);
  }

  showWarning(message: string): void {
    // For now, use alert but this can be replaced with toast notifications
    alert(`Warning: ${message}`);
  }
}

export const errorService = new BrowserErrorService();

// When you want to add toast notifications, replace this with:
// export const errorService = new ToastErrorService();
