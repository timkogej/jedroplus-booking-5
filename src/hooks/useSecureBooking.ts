"use client";
import { useState, useCallback } from "react";
import { validateBookingForm, isHoneypotFilled, sanitizeInput } from "@/lib/validations/booking";

export function useSecureBooking({ onSuccess, onError }: { companyId: string; onSuccess?: () => void; onError?: (e: string) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submitBooking = useCallback(async (formData: unknown): Promise<boolean> => {
    setError(null);
    setFieldErrors({});
    if (isHoneypotFilled(formData as { website?: string })) { setIsSuccess(true); return true; }
    const validation = validateBookingForm(formData);
    if (!validation.success) { setFieldErrors(validation.errors || {}); setError("Popravite napake."); return false; }
    setIsSubmitting(true);
    try { setIsSuccess(true); onSuccess?.(); return true; }
    catch (err) { setError("Napaka. Poskusite znova."); onError?.(err instanceof Error ? err.message : "Error"); return false; }
    finally { setIsSubmitting(false); }
  }, [onSuccess, onError]);

  return { isSubmitting, isSuccess, error, fieldErrors, submitBooking, resetState: () => { setIsSubmitting(false); setIsSuccess(false); setError(null); setFieldErrors({}); }, sanitize: sanitizeInput };
}
