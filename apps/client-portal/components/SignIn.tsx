"use client";
import { Button } from "@naples/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

// Legacy email-only sign-in retired. Real auth now lives at /login
// (Supabase magic link). This component is kept as the home-page CTA.
export function SignIn() {
  return (
    <div className="mt-10 w-full max-w-md">
      <Link href="/login" className="block">
        <Button className="w-full">
          Sign in <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
      <p className="mt-3 text-xs text-cream/60">
        Magic link delivered to your inbox. No password required.
      </p>
    </div>
  );
}
