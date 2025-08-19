import React from "react";
import { User } from "../../types";
import Modal from "../Modal";
import { useZodForm } from "../../hooks/useZodForm";
import {
  contractorSchema,
  type ContractorFormData,
} from "../../lib/validations";
import { FormInput } from "../ui/FormInput";
import { FormProvider } from "react-hook-form";

interface ContractorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingContractor: User | null;
  onSubmit: (data: ContractorFormData) => Promise<void>;
  formError: string;
}

const ContractorFormModal: React.FC<ContractorFormModalProps> = ({
  isOpen,
  onClose,
  editingContractor,
  onSubmit,
  formError,
}) => {
  const form = useZodForm(contractorSchema, {
    defaultValues: {
      name: "",
      username: "",
      password: "",
      email: "",
      phone: "",
    },
  });

  // Reset form when modal opens/closes or editingContractor changes
  React.useEffect(() => {
    if (isOpen) {
      if (editingContractor) {
        form.reset({
          name: editingContractor.name,
          username: editingContractor.username,
          password: "",
          email: editingContractor.email || "",
          phone: editingContractor.phone || "",
        });
      } else {
        form.reset({
          name: "",
          username: "",
          password: "",
          email: "",
          phone: "",
        });
      }
    }
  }, [isOpen, editingContractor, form]);

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data as ContractorFormData);
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
      title={
        editingContractor ? "Manage Contractor Account" : "Add New Contractor"
      }
      size="2xl"
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              name="name"
              label="Name"
              type="text"
              placeholder="Enter contractor name"
              required
              disabled={form.formState.isSubmitting}
            />

            <FormInput
              name="username"
              label="Username"
              type="text"
              placeholder="Choose a username"
              required
              disabled={form.formState.isSubmitting}
            />

            <FormInput
              name="email"
              label="Email"
              type="email"
              placeholder="Enter email address"
              required
              disabled={form.formState.isSubmitting}
            />

            <FormInput
              name="phone"
              label="Phone"
              type="tel"
              placeholder="Enter phone number"
              isOptional
              disabled={form.formState.isSubmitting}
            />

            <div className="md:col-span-2">
              <FormInput
                name="password"
                label="Password"
                type="password"
                placeholder={
                  editingContractor
                    ? "Leave blank to keep unchanged"
                    : "Enter password"
                }
                required={!editingContractor}
                disabled={form.formState.isSubmitting}
                isOptional={editingContractor}
              />
            </div>
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
              disabled={form.formState.isSubmitting}
              className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
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
                  <span>Saving...</span>
                </div>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
};

export default ContractorFormModal;
