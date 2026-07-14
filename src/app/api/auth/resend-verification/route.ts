import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { generateRawToken, hashToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const rawToken = generateRawToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  const verifyLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your email - UAE Driver Jobs",
    text: `Verify your email: ${verifyLink}`,
  });

  return NextResponse.json({ ok: true });
}
