export function formatUSD(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitAmountCents: number;
}

export function totalCentsOf(lineItems: LineItem[]): number {
  return lineItems.reduce((s, li) => s + li.unitAmountCents * li.quantity, 0);
}
