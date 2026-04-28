/**
 * Longitud del código OTP que envía Supabase (email). Debe coincidir con Auth → Providers
 * o con mailer_otp_length (hosted: Dashboard / API). Rango habitual: 6–10.
 */
export const OTP_CODE_LENGTH = 6;

export function emptyOtpSlots(): string[] {
  return Array(OTP_CODE_LENGTH).fill('');
}
