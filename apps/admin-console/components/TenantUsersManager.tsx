"use client";
import { useState } from "react";
import { Card, Button, Badge } from "@naples/ui";
import { Trash2, UserPlus } from "lucide-react";

type TenantUser = { id: string; user_email: string; role: string; created_at: string };

export function TenantUsersManager({ tenantId, initial }: { tenantId: string; initial: TenantUser[] }) {
  const [users, setUsers] = useState<TenantUser[]>(initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "operator" | "viewer">("operator");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Failed"); setBusy(false); return; }
      setUsers(u => [...u, j.user]);
      setEmail("");
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    setBusy(false);
  }

  async function remove(userId: string) {
    if (!confirm("Remove this user?")) return;
    const res = await fetch(`/api/tenants/${tenantId}/users?userId=${userId}`, { method: "DELETE" });
    if (res.ok) setUsers(u => u.filter(x => x.id !== userId));
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={add} className="space-y-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Add user</div>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
              className="flex-1 border border-card-border bg-bg/60 px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="border border-card-border bg-bg/60 px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
            >
              <option value="owner">owner</option>
              <option value="operator">operator</option>
              <option value="viewer">viewer</option>
            </select>
            <Button type="submit" disabled={busy || !email}>
              <UserPlus className="-ml-1 mr-1 inline h-4 w-4" />
              {busy ? "Adding…" : "Add"}
            </Button>
          </div>
          {err && <div className="text-xs text-rose-400">{err}</div>}
        </form>
      </Card>

      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted">{users.length} user{users.length === 1 ? "" : "s"}</div>
        {users.length === 0 ? (
          <Card><p className="text-sm text-muted">No users yet.</p></Card>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <Card key={u.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm text-cream">{u.user_email}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone={u.role === "owner" ? "gold" : u.role === "operator" ? "violet" : "muted"}>{u.role}</Badge>
                      <span className="text-[10px] text-muted">added {new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(u.id)}
                    className="text-muted transition-colors hover:text-rose-400"
                    aria-label="Remove user"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
