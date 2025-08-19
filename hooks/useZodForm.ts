import { useForm, UseFormProps, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

export const useZodForm = <T extends FieldValues>(
  schema: z.ZodSchema<T>,
  options?: Omit<UseFormProps<T>, 'resolver'>
) => {
  return useForm<T>({
    ...options,
    resolver: zodResolver(schema) as any,
    mode: options?.mode || 'onBlur', // Validate on blur for better UX
  });
};

// Helper hook for handling form submission with loading states
export const useFormSubmission = <T extends FieldValues>(
  onSubmit: (data: T) => Promise<void> | void,
  onError?: (errors: any) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: T) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit,
  };
};

// Helper for field-level error display
export const getFieldError = <T extends FieldValues>(
  form: ReturnType<typeof useForm<T>>,
  fieldName: Path<T>
) => {
  const error = form.formState.errors[fieldName];
  return {
    hasError: !!error,
    message: error?.message as string | undefined,
  };
};

// Helper for field-level touched state
export const isFieldTouched = <T extends FieldValues>(
  form: ReturnType<typeof useForm<T>>,
  fieldName: Path<T>
) => {
  return (form.formState.touchedFields as any)[fieldName] || false;
};

// Helper for determining if error should be shown
export const shouldShowError = <T extends FieldValues>(
  form: ReturnType<typeof useForm<T>>,
  fieldName: Path<T>
) => {
  const touched = isFieldTouched(form, fieldName);
  const error = getFieldError(form, fieldName);
  return touched && error.hasError;
};
