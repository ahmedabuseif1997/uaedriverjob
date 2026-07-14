import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { getPresignedUploadUrl, StorageNotConfiguredError, type UploadKind } from "@/lib/storage";

const DRIVER_KINDS: UploadKind[] = ["driver-photo", "driver-resume"];
const EMPLOYER_KINDS: UploadKind[] = ["company-logo"];

const schema = z.object({
  kind: z.enum(["driver-photo", "driver-resume", "company-logo"]),
  contentType: z.string().min(1),
  extension: z.string().max(10).optional().default(""),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { kind, contentType, extension } = parsed.data;

  const allowedKinds = user.role === "DRIVER" ? DRIVER_KINDS : user.role === "EMPLOYER" ? EMPLOYER_KINDS : [];
  if (!allowedKinds.includes(kind)) {
    return NextResponse.json({ error: "This upload type is not allowed for your account." }, { status: 403 });
  }

  try {
    const result = await getPresignedUploadUrl(kind, user.id, contentType, extension);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }
}
