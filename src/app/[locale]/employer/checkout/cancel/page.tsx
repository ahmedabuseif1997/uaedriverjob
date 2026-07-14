import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job: jobId } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Checkout cancelled</h1>
      <p className="text-sm text-neutral-500">No payment was taken. Your draft has been saved.</p>
      <Link href={jobId ? `/employer/jobs/${jobId}/edit` : "/employer/jobs"}>
        <Button>Back to listing</Button>
      </Link>
    </main>
  );
}
