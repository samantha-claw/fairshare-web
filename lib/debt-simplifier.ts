// Client-side implementation (simpler, for display purposes)
// lib/debt-simplifier.ts

interface Balance {
  userId: string;
  displayName: string;
  avatarUrl: string;
  amount: number; // positive = owed, negative = owes
}

interface SimplifiedDebt {
  from: { userId: string; displayName: string; avatarUrl: string };
  to: { userId: string; displayName: string; avatarUrl: string };
  amount: number;
}

export function simplifyDebts(balances: Balance[]): SimplifiedDebt[] {
  const debts: SimplifiedDebt[] = [];

  // Separate into debtors (negative balance) and creditors (positive balance)
  const debtors = balances
    .filter((b) => b.amount < 0)
    .map((b) => ({ ...b, remaining: Math.abs(b.amount) }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = balances
    .filter((b) => b.amount > 0)
    .map((b) => ({ ...b, remaining: b.amount }))
    .sort((a, b) => b.remaining - a.remaining);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const payment = Math.min(debtors[i].remaining, creditors[j].remaining);

    if (payment > 0.01) {
      debts.push({
        from: {
          userId: debtors[i].userId,
          displayName: debtors[i].displayName,
          avatarUrl: debtors[i].avatarUrl,
        },
        to: {
          userId: creditors[j].userId,
          displayName: creditors[j].displayName,
          avatarUrl: creditors[j].avatarUrl,
        },
        amount: Math.round(payment * 100) / 100,
      });
    }

    debtors[i].remaining -= payment;
    creditors[j].remaining -= payment;

    if (debtors[i].remaining < 0.01) i++;
    if (creditors[j].remaining < 0.01) j++;
  }

  return debts;
}