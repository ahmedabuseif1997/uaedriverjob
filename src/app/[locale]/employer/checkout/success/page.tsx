import { redirect } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { getEmployerProfile, getOwnedJobPost } from "@/lib/employer";
import { CheckoutPoller } from "@/components/forms/CheckoutPoller";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job: jobId } = await searchParams;
  const user = await requireRole("EMPLOYER");
  const employer = await getEmployerProfile(user);

  if (!jobId) redirect("/employer/jobs");
  const job = await getOwnedJobPost(jobId, employer.id);
  if (!job) redirect("/employer/jobs");

  if (job.status === "ACTIVE") {
    redirect(`/employer/jobs/${job.id}/applicants`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Payment received</h1>
      <CheckoutPoller jobId={job.id} />
    </main>
  );
}
