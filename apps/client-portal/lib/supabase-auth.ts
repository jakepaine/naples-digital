import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Browser-side Supabase client (anon key) — used by the login form.
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createBrowserClient(url, anonKey);
}

// Server-side Supabase client tied to the request's cookies. Use in
// server components + route handlers that need the user's session.
export async function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  const cookieStore = await Promise.resolve(cookies());
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>,
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options as CookieOptions);
          }
        } catch {
          // Server components can't set cookies — ignore. Middleware
          // handles refresh writes for those.
        }
      },
    },
  });
}

export interface AuthSession {
  userId: string;
  email: string;
  tenantId: string | null;
  tenantSlug: string | null;
  role: string | null;
}

// Resolve the current user's session and tenant. Returns null if not
// signed in or not linked to any tenant.
export async function getSession(): Promise<AuthSession | null> {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  // Look up tenant via the helper RPC (uses auth.uid() internally)
  const { data: tenantId } = await sb.rpc("current_user_tenant_id");
  if (!tenantId) {
    return {
      userId: user.id,
      email: user.email ?? "",
      tenantId: null,
      tenantSlug: null,
      role: null,
    };
  }

  const { data: tenant } = await sb
    .from("tenants")
    .select("id, slug")
    .eq("id", tenantId)
    .maybeSingle();
  const { data: link } = await sb
    .from("tenant_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? "",
    tenantId: (tenant as any)?.id ?? null,
    tenantSlug: (tenant as any)?.slug ?? null,
    role: (link as any)?.role ?? null,
  };
}
