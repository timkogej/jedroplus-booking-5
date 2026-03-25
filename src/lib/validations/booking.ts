import { z } from "zod";

const BLOCKED_EMAIL_DOMAINS = ["tempmail.com","guerrillamail.com","10minutemail.com","mailinator.com","yopmail.com","fakeinbox.com"];

function isBlockedEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return BLOCKED_EMAIL_DOMAINS.includes(domain);
}

export const bookingFormSchema = z.object({
  ime: z.string().min(2, "Ime mora imeti vsaj 2 znaka").max(50),
  priimek: z.string().min(2).max(50).optional(),
  email: z.string().email("Neveljaven email").refine((e) => !isBlockedEmailDomain(e), "Ta email domena ni dovoljena"),
  telefon: z.string().optional(),
  datum: z.string().optional(),
  cas: z.string().optional(),
  storitev_id: z.string().optional(),
  zaposleni_id: z.string().optional(),
  opombe: z.string().max(500).optional(),
  website: z.string().max(0).optional(),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

export function validateBookingForm(data: unknown) {
  const result = bookingFormSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      errors[issue.path[0] as string] = issue.message;
    }
    return { success: false, errors };
  }
  return { success: true, data: result.data };
}

export function isHoneypotFilled(data: { website?: string }): boolean {
  return Boolean(data.website && data.website.length > 0);
}

export function sanitizeInput(text: string): string {
  if (typeof text !== "string") return "";
  return text.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim().slice(0, 2000);
}
