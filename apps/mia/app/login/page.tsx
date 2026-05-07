import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="text-[10px] uppercase tracking-[0.32em] text-violet">MIA</div>
      <h1 className="mt-2 font-heading text-5xl tracking-broadcast text-cream">Acquisition Tools</h1>
      <div className="mt-3 h-px w-16" style={{ background: "#8A6BB8" }} />
      <p className="mt-4 text-sm text-cream/70">Operator-gated. Enter your password.</p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  );
}
