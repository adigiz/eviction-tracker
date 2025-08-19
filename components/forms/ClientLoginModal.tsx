import React, { useEffect } from "react";
import { User } from "../../types";
import Modal from "../Modal";
import { useZodForm } from "../../hooks/useZodForm";
import { FormProvider } from "react-hook-form";
import { FormInput } from "../ui/FormInput";
import { loginSchema, type LoginFormData } from "../../lib/validations";

interface ClientLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: User | null;
  onSave: (username: string, password: string) => void;
  isSaving: boolean;
}

const ClientLoginModal: React.FC<ClientLoginModalProps> = ({
  isOpen,
  onClose,
  client,
  onSave,
  isSaving,
}) => {
  const form = useZodForm(loginSchema, {
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Reset form when modal opens/closes or client changes
  useEffect(() => {
    if (isOpen && client) {
      form.reset({
        username: client.username,
        password: "",
      });
    }
  }, [isOpen, client, form]);

  const handleSubmit = async (data: any) => {
    const typedData = data as LoginFormData;
    onSave(typedData.username, typedData.password);
  };

  if (!isOpen || !client) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Client Login"
      size="md"
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormInput
              name="username"
              label="Username"
              type="text"
              placeholder="Enter username"
              disabled={isSaving}
              required
            />

            <FormInput
              name="password"
              label="New Password"
              type="password"
              placeholder="Enter new password"
              disabled={isSaving}
              required
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSaving ? (
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
                  <span>Saving...</span>
                </div>
              ) : (
                <span>Save Credentials</span>
              )}
            </button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
};

export default ClientLoginModal;
