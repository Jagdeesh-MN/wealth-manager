export interface Entry {
  id: string;
  label: string;
  amount: number;
  notes?: string;
}

export interface StockEntry extends Entry {
  firm: string;
}

export interface EquityEntry extends Entry {
  source: string;
}

export interface IndiaRealEstateEntry {
  id: string;
  name: string;
  marketValue: number;
  loanBalance: number;
  notes?: string;
}

export interface IndiaGoldEntry {
  id: string;
  label: string;
  grams: number;
  valuePerGram: number;
}

export interface IncomeEntry {
  id: string;
  label: string;
  amount: number;
  type: 'salary' | 'rental' | 'dividend' | 'other';
}

export interface ExpenseEntry {
  id: string;
  label: string;
  amount: number;
  category: 'personal' | 'rental_property';
}

export interface SavingsEntry {
  id: string;
  label: string;
  amount: number;
  type: '401k' | 'hsa' | 'stocks' | 'other';
}

export interface OneTimeEntry {
  id: string;
  label: string;
  amount: number;
  date: string;
}

export interface Snapshot {
  id: string;
  date: string;
  label: string;

  // US Accounts
  usRetirement: Entry[];
  usStocks: StockEntry[];
  usCash: Entry[];
  usEquity: EquityEntry[];

  // India Investments (in INR)
  indiaRealEstate: IndiaRealEstateEntry[];
  indiaCash: Entry[];
  indiaGold: IndiaGoldEntry[];
  indiaOther: Entry[];

  // Income & Expenses (monthly)
  incomes: IncomeEntry[];
  personalExpenses: ExpenseEntry[];
  rentalExpenses: ExpenseEntry[];
  savings: SavingsEntry[];
  oneTimeIncome: OneTimeEntry[];
  oneTimeExpenses: OneTimeEntry[];

  // Exchange rate
  usdToInr: number;
}

export type Currency = 'USD' | 'INR';

export interface AppState {
  snapshots: Snapshot[];
  activeSnapshotId: string | null;
}

export const DEFAULT_SNAPSHOT: Omit<Snapshot, 'id' | 'date' | 'label'> = {
  usRetirement: [
    { id: '1', label: '401(k)', amount: 0 },
    { id: '2', label: 'Roth IRA', amount: 0 },
    { id: '3', label: 'Traditional IRA', amount: 0 },
  ],
  usStocks: [
    { id: '1', label: 'Portfolio', firm: 'Fidelity', amount: 0 },
  ],
  usCash: [
    { id: '1', label: 'Savings Account', amount: 0 },
    { id: '2', label: 'Emergency Fund', amount: 0 },
  ],
  usEquity: [
    { id: '1', label: 'Primary Home Equity', source: 'Real Estate', amount: 0 },
  ],
  indiaRealEstate: [
    { id: '1', name: 'Property 1', marketValue: 0, loanBalance: 0 },
  ],
  indiaCash: [
    { id: '1', label: 'Bank Account', amount: 0 },
    { id: '2', label: 'Fixed Deposits', amount: 0 },
  ],
  indiaGold: [
    { id: '1', label: 'Gold Jewelry', grams: 0, valuePerGram: 6500 },
  ],
  indiaOther: [
    { id: '1', label: 'Mutual Funds', amount: 0 },
    { id: '2', label: 'PPF', amount: 0 },
  ],
  incomes: [
    { id: '1', label: 'Primary Salary', amount: 0, type: 'salary' },
    { id: '2', label: 'Rental Income', amount: 0, type: 'rental' },
    { id: '3', label: 'Dividends', amount: 0, type: 'dividend' },
  ],
  personalExpenses: [
    { id: '1', label: 'Mortgage/Rent', amount: 0, category: 'personal' },
    { id: '2', label: 'Food & Groceries', amount: 0, category: 'personal' },
    { id: '3', label: 'Travel', amount: 0, category: 'personal' },
    { id: '4', label: 'Insurance', amount: 0, category: 'personal' },
    { id: '5', label: 'Utilities', amount: 0, category: 'personal' },
    { id: '6', label: 'Income Tax', amount: 0, category: 'personal' },
    { id: '7', label: 'Miscellaneous', amount: 0, category: 'personal' },
  ],
  rentalExpenses: [
    { id: '1', label: 'Property Management', amount: 0, category: 'rental_property' },
    { id: '2', label: 'Rental Mortgage', amount: 0, category: 'rental_property' },
    { id: '3', label: 'Rental Insurance', amount: 0, category: 'rental_property' },
    { id: '4', label: 'Maintenance', amount: 0, category: 'rental_property' },
    { id: '5', label: 'Property Taxes', amount: 0, category: 'rental_property' },
  ],
  savings: [
    { id: '1', label: '401(k) Contribution', amount: 0, type: '401k' },
    { id: '2', label: 'HSA Contribution', amount: 0, type: 'hsa' },
    { id: '3', label: 'Stock Purchase', amount: 0, type: 'stocks' },
  ],
  oneTimeIncome: [],
  oneTimeExpenses: [],
  usdToInr: 84,
};
