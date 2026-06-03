import { createResetToken } from "@/server/session";
import { findUserByEmail } from "@/server/users";
import { resetPasswordEmail, sendEmail } from "@/server/email";
import { ok } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = (await req.json().catch(() => ({}))) ?? {};
    if (email) {
      const user = await findUserByEmail(email);
      if (user) {
        const token = await createResetToken(user.id, user.password_hash);
        const link = `${new URL(req.url).origin}/reset-password?token=${encodeURIComponent(token)}`;
        const { subject, html } = resetPasswordEmail(user.first_name, link);
        await sendEmail({ to: user.email, subject, html });
      }
    }
  } catch (e) {
    console.error("forgot-password error", e);
  }
  // Always succeed to avoid leaking which emails are registered.
  return ok();
}
