import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRawToken, hashToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/validation/authSchemas";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });

  // Always respond with success to avoid leaking which emails have accounts.
  if (user) {
    const rawToken = generateRawToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password/${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your password - UAE Driver Jobs",
      text: `Reset your password: ${resetLink} (expires in 1 hour)`,
    });
  }

  return NextResponse.json({ ok: true });
}
