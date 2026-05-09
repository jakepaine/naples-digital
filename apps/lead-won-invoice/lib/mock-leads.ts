export interface LineItem {
  description: string;
  quantity: number;
  unitAmountCents: number;
}

export interface MockLead {
  id: string;
  name: string;
  email: string;
  company: string;
  wonAt: string;
  proposalRef?: string;
  lineItems: LineItem[];
}

export const MOCK_LEADS: MockLead[] = [
  {
    id: "lead-001",
    name: "Sarah Liu",
    email: "sarah@anchorbookkeeping.com",
    company: "Anchor Bookkeeping",
    wonAt: "2026-05-08T13:42:00Z",
    proposalRef: "P-2026-0418",
    lineItems: [
      { description: "Naples Digital — Growth tier setup", quantity: 1, unitAmountCents: 250000 },
      { description: "First-month subscription (Growth)",   quantity: 1, unitAmountCents: 99700 },
    ],
  },
  {
    id: "lead-002",
    name: "Kevin Mathers",
    email: "kevin@239live.com",
    company: "239 Live",
    wonAt: "2026-05-08T08:55:00Z",
    proposalRef: "P-2026-0421-DP",
    lineItems: [
      { description: "Design Partner — Premium feature set, 12-mo lock", quantity: 1, unitAmountCents: 500000 },
      { description: "First-month subscription (Design Partner)",        quantity: 1, unitAmountCents: 75000 },
    ],
  },
  {
    id: "lead-003",
    name: "Daniela Ortiz",
    email: "dani@meridianinspections.com",
    company: "Meridian Home Inspections",
    wonAt: "2026-05-07T20:11:00Z",
    proposalRef: "P-2026-0419",
    lineItems: [
      { description: "Naples Digital — Starter tier setup",   quantity: 1, unitAmountCents: 150000 },
      { description: "First-month subscription (Starter)",    quantity: 1, unitAmountCents: 49700 },
    ],
  },
];

export function totalCents(lead: MockLead): number {
  return lead.lineItems.reduce(
    (sum, li) => sum + li.unitAmountCents * li.quantity,
    0,
  );
}

export function formatUSD(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
