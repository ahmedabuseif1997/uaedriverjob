/**
 * Single choke point for all transactional email sends. For this build, real delivery is
 * deferred — every call just logs. Swap the body of `sendEmail` for a real provider (e.g.
 * Resend) later; no call site needs to change.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(message: EmailMessage): Promise<void> {
  console.log(`[email:stub] to=${message.to} subject="${message.subject}"\n${message.text}`);
}
