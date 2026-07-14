import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { generateRawToken, hashToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { registerSchema } from "@/validation/authSchemas";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { role, name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      role,
      ...(role === "DRIVER"
        ? { driverProfile: { create: { fullName: name } } }
        : { employerProfile: { create: { companyName: name } } }),
    },
  });

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
    text: `Welcome to UAE Driver Jobs! Verify your email: ${verifyLink}`,
  });

  await createSession(user.id);

  return NextResponse.json({ role: user.role });
}
