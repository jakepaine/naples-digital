import { CreateTenantForm } from "@/components/CreateTenantForm";

export const dynamic = "force-dynamic";

export default function NewTenantPage() {
  return (
    <main className="mx-auto max-w-2xl px-8 py-12">
      <div className="text-[10px] uppercase tracking-[0.32em] text-gold">Onboarding</div>
      <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">New Tenant</h1>
      <div className="mt-3 h-px w-16 bg-gold" />
      <p className="mt-4 text-sm text-cream/70">
        Each tenant gets isolated data, their own brand, their own integrations.
        After creating, configure their Instantly + AssemblyAI on the integrations tab.
      </p>
      <div className="mt-8">
        <CreateTenantForm />
      </div>
    </main>
  );
}
