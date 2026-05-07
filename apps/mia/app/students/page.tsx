import { StubPage } from "@/components/StubPage";

export const dynamic = "force-dynamic";

export default function StudentsPage() {
  return (
    <StubPage
      title="Students"
      subtitle="Coaching program pipeline — track each student's progress from enrollment to first close."
      bullets={[
        "Roster of active / paused / graduated students with target market.",
        "Per-student: deals practiced, LOIs sent, deals under contract, deals closed.",
        "MIA principals see who's actually moving — coaching outcomes become measurable.",
        "Future: students log into their own scoped view (read-only).",
      ]}
      next="Add students table seeding (CSV import + manual). Wire student dashboard with deal-status kanban. The student-facing view is its own thing — needs per-student auth, defer."
    />
  );
}
