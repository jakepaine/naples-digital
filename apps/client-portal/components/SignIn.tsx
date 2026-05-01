"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@naples/ui";
import { Mail, ArrowRight } from "lucide-react";

export function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    router.push(`/portal/${encodeURIComponent(email.trim().toLowerCase())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 w-full max-w-md">
      <label className="text-[10px] uppercase tracking-[0.18em] text-muted">Email on file</label>
      <div className="mt-2 flex items-center gap-2 border border-card-border bg-bg px-3 py-3">
        <Mail className="h-4 w-4 text-muted" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourcompany.com"
          required
          className="w-full bg-transparent text-sm text-cream placeholder:text-muted/60 focus:outline-none"
        />
      </div>
      <Button type="submit" disabled={submitting || !email.trim()} className="mt-4 w-full">
        Enter Portal <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
