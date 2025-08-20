import React from "react";
import { useFormContext } from "react-hook-form";

interface FormInputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  isOptional?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  isOptional = false,
  autoComplete,
  disabled = false,
}) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label} 
        {required && <span className="text-red-500 ml-1">*</span>}
        {isOptional && <span className="text-gray-500 ml-1">(optional)</span>}
      </label>
      <input
        type={type}
        id={name}
        {...register(name)}
        className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors ${
          error
            ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
        } text-gray-900 dark:text-white`}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error.message as string}
        </p>
      )}
    </div>
  );
};
