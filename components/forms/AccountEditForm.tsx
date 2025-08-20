import React, { useContext, useEffect } from "react";
import { AuthContext } from "../../App";
import { User } from "../../types";
import { useZodForm, useFormSubmission } from "../../hooks/useZodForm";
import { FormProvider } from "react-hook-form";
import { FormInput } from "../ui/FormInput";
import {
  accountEditFormSchema,
  AccountEditFormData,
} from "../../lib/validations";

interface AccountEditFormProps {
  onClose: () => void;
}

const AccountEditForm: React.FC<AccountEditFormProps> = ({ onClose }) => {
  const auth = useContext(AuthContext);
  const currentUser = auth?.currentUser;

  const form = useZodForm(accountEditFormSchema, {
    defaultValues: {
      profile: {
        name: "",
        businessName: "",
        address: "",
        email: "",
        phone: "",
      },
      password: {
        newPassword: "",
        confirmPassword: "",
      },
    },
  });

  const { isSubmitting, handleSubmit: handleFormSubmit } = useFormSubmission(
    async (data: any) => {
      const typedData = data as AccountEditFormData;

      const updates: Partial<User> = { ...typedData.profile };

      // Handle password update separately since User type doesn't have password field
      if (typedData.password?.newPassword) {
        // For now, we'll handle password updates through a different mechanism
        // This could be a separate API call or handled by the auth service
        console.log("Password change requested (not yet implemented)");
      }

      auth?.updateProfile(updates);
      onClose();
    }
  );

  useEffect(() => {
    if (currentUser) {
      form.reset({
        profile: {
          name: currentUser.name || "",
          businessName: currentUser.businessName || "",
          address: currentUser.address || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
        },
        password: {
          newPassword: "",
          confirmPassword: "",
        },
      });
    }
  }, [currentUser, form]);

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(handleFormSubmit)();
  };

  if (!currentUser) return <p>Loading user data...</p>;

  const headingClass =
    "text-lg font-semibold text-gray-700 dark:text-gray-200 border-b pb-2 dark:border-gray-600";

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmitForm} className="space-y-6">
        <h3 className={headingClass}>Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="profile.name"
            label="Full Name / Company Name"
            type="text"
            required
          />
          <FormInput
            name="profile.businessName"
            label="Business Name"
            type="text"
            isOptional
          />
          <FormInput
            name="profile.email"
            label="Email Address"
            type="email"
            isOptional
          />
          <FormInput name="profile.phone" label="Phone" type="tel" isOptional />
          <div className="md:col-span-2">
            <FormInput
              name="profile.address"
              label="Mailing Address"
              type="text"
              isOptional
            />
          </div>
        </div>

        <h3 className={`${headingClass} pt-4`}>Change Password</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Leave these fields blank to keep your current password.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="password.newPassword"
            label="New Password"
            type="password"
            isOptional
          />
          <FormInput
            name="password.confirmPassword"
            label="Confirm New Password"
            type="password"
            isOptional
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || auth?.isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 border border-transparent rounded-md shadow-sm disabled:opacity-50"
          >
            {isSubmitting || auth?.isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default AccountEditForm;
