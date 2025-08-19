import React from "react";
import Modal from "../Modal";
import { useZodForm } from "../../hooks/useZodForm";
import { lawFirmSchema, type LawFirmFormData } from "../../lib/validations";
import { FormInput } from "../ui/FormInput";
import { FormProvider } from "react-hook-form";
import { LawFirm } from "../../types";

interface LawFirmFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFirm: LawFirm | null;
  onSubmit: (data: LawFirmFormData) => Promise<void>;
  formError: string;
  isSaving: boolean;
}

const LawFirmFormModal: React.FC<LawFirmFormModalProps> = ({
  isOpen,
  onClose,
  editingFirm,
  onSubmit,
  formError,
  isSaving,
}) => {
  const form = useZodForm(lawFirmSchema, {
    defaultValues: {
      firmName: "",
      referralCode: "",
    },
  });

  // Reset form when modal opens/closes or editingFirm changes
  React.useEffect(() => {
    if (isOpen) {
      if (editingFirm) {
        form.reset({
          firmName: editingFirm.name,
          referralCode: editingFirm.referralCode,
        });
      } else {
        form.reset({
          firmName: "",
          referralCode: "",
        });
      }
    }
  }, [isOpen, editingFirm, form]);

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data as LawFirmFormData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Form submission error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingFirm ? "Edit Law Firm" : "Add New Law Firm"}
      size="lg"
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
              {formError}
            </p>
          )}

          <div className="space-y-6">
            <FormInput
              name="firmName"
              label="Law Firm Name"
              type="text"
              placeholder="Enter law firm name"
              required
              disabled={form.formState.isSubmitting || isSaving}
            />

            <FormInput
              name="referralCode"
              label="Referral Code"
              type="text"
              placeholder="e.g., FIRM5OFF"
              required
              disabled={form.formState.isSubmitting || isSaving}
            />

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Must be unique. Will be saved in uppercase.
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={form.formState.isSubmitting || isSaving}
              className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {form.formState.isSubmitting || isSaving ? (
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
                  <span>{editingFirm ? "Saving..." : "Creating..."}</span>
                </div>
              ) : (
                <span>{editingFirm ? "Save Changes" : "Add Firm"}</span>
              )}
            </button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
};

export default LawFirmFormModal;
