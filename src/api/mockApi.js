const mockTransactions = [
  { id: 1, date: '2026-03-01', category: 'Salary', type: 'Income', amount: 5200 },
  { id: 2, date: '2026-03-03', category: 'Rent', type: 'Expense', amount: 1650 },
  { id: 3, date: '2026-03-05', category: 'Food', type: 'Expense', amount: 240 },
  { id: 4, date: '2026-03-07', category: 'Transport', type: 'Expense', amount: 96 },
  { id: 5, date: '2026-03-09', category: 'Entertainment', type: 'Expense', amount: 180 },
  { id: 6, date: '2026-03-12', category: 'Freelance', type: 'Income', amount: 860 },
  { id: 7, date: '2026-03-15', category: 'Food', type: 'Expense', amount: 210 },
  { id: 8, date: '2026-03-18', category: 'Utilities', type: 'Expense', amount: 145 },
  { id: 9, date: '2026-03-21', category: 'Salary', type: 'Income', amount: 5200 },
  { id: 10, date: '2026-03-25', category: 'Transport', type: 'Expense', amount: 74 },
];

export async function fetchTransactions() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(structuredClone(mockTransactions));
    }, 650);
  });
}
