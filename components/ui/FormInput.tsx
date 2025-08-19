import React from "react";
import { useFormContext, Controller } from "react-hook-form";

interface FormInputProps {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "tel" | "number" | "date" | "select";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number;
  options?: { value: string; label: string }[];
  isOptional?: boolean;
  transform?: (value: any) => any; // For Zod v4 transforms
}

export const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
  className = "",
  rows,
  options,
  isOptional = false,
  transform,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string;

  // For select elements
  if (type === "select" || options) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
              {isOptional && (
                <span className="text-gray-500 text-xs ml-1">(Optional)</span>
              )}
            </label>
            <select
              {...field}
              disabled={disabled}
              onChange={(e) => {
                const value = transform
                  ? transform(e.target.value)
                  : e.target.value;
                field.onChange(value);
              }}
              className={`
                mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm 
                focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 
                transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                ${
                  error
                    ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-300 dark:border-gray-600"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                ${className}
              `}
            >
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        )}
      />
    );
  }

  // For textarea
  if (rows) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
              {isOptional && (
                <span className="text-gray-500 text-xs ml-1">(Optional)</span>
              )}
            </label>
            <textarea
              {...field}
              rows={rows}
              placeholder={placeholder}
              disabled={disabled}
              onChange={(e) => {
                const value = transform
                  ? transform(e.target.value)
                  : e.target.value;
                field.onChange(value);
              }}
              className={`
                mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm 
                focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 
                transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                placeholder-gray-500 dark:placeholder-gray-400
                ${
                  error
                    ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-300 dark:border-gray-600"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                ${className}
              `}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        )}
      />
    );
  }

  // For regular inputs
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
            {isOptional && (
              <span className="text-red-500 text-xs ml-1">(Optional)</span>
            )}
          </label>
          <input
            {...field}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => {
              let value = e.target.value;
              if (type === "number") {
                value = e.target.value === "" ? "" : Number(e.target.value);
              }
              if (transform) {
                value = transform(value);
              }
              field.onChange(value);
            }}
            className={`
              mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm 
              focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 
              transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
              placeholder-gray-500 dark:placeholder-gray-400
              ${
                error
                  ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-300 dark:border-gray-600"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              ${className}
            `}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    />
  );
};
