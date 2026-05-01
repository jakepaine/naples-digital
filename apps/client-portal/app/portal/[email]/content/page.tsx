import { Card } from "@naples/ui";
import { listSubmissionsForEmail } from "@naples/db";
import { ContentSubmissionForm } from "@/components/ContentSubmissionForm";
import { SubmissionList } from "@/components/SubmissionList";

export const dynamic = "force-dynamic";

export default async function ContentPage({ params }: { params: { email: string } }) {
  const email = decodeURIComponent(params.email);
  const submissions = await listSubmissionsForEmail(email);
  const clientName = submissions[0]?.client_name ?? "Client";

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.32em] text-live">Submit & Track</div>
        <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Content Studio</h1>
        <div className="mt-3 h-px w-16 bg-live" />
        <p className="mt-4 max-w-2xl text-sm text-cream/70">
          Drop raw footage, audio, or assets and our team turns them around with
          edit notes you can review and approve. Track every project from intake to delivery.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {submissions.length === 0 ? (
            <Card>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">No submissions yet</div>
              <h2 className="mt-1 font-heading text-2xl tracking-broadcast text-cream">Drop Your First Asset</h2>
              <p className="mt-2 text-sm text-cream/70">
                Use the form to the right. We accept video, audio, image, and document files —
                up to 10 GB per upload. Cinematic color grade and platform-specific cuts come back within 5 business days.
              </p>
            </Card>
          ) : (
            <SubmissionList submissions={submissions} />
          )}
        </div>

        <aside className="lg:col-span-4">
          <ContentSubmissionForm email={email} clientName={clientName} />
        </aside>
      </div>
    </main>
  );
}
