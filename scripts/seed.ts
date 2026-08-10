import Database from "better-sqlite3";

const db = new Database("./sqlite.db");

// Create tables
const accountsTable = `
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  description TEXT,
  parent_id INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  opening_balance REAL NOT NULL DEFAULT 0,
  current_balance REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
)`;

const journalTable = `
CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_number TEXT NOT NULL UNIQUE,
  date INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  total_amount REAL NOT NULL DEFAULT 0,
  is_posted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
)`;

const linesTable = `
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  debit REAL NOT NULL DEFAULT 0,
  credit REAL NOT NULL DEFAULT 0,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
)`;

db.exec(accountsTable);
db.exec(journalTable);
db.exec(linesTable);

// Create customers table
const customersTable = `
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
)`;

// Create invoices table
const invoicesTable = `
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL,
  issue_date INTEGER NOT NULL,
  due_date INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  amount_paid REAL NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
)`;

// Create invoice items table
const invoiceItemsTable = `
CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
)`;

db.exec(customersTable);
db.exec(invoicesTable);
db.exec(invoiceItemsTable);

// Seed default accounts
const defaultAccounts = [
  { code: "1000", name: "Cash", type: "asset", subtype: "Current", openingBalance: 0 },
  { code: "1010", name: "Bank Account", type: "asset", subtype: "Current", openingBalance: 0 },
  { code: "1020", name: "Accounts Receivable", type: "asset", subtype: "Current", openingBalance: 0 },
  { code: "1100", name: "Inventory", type: "asset", subtype: "Current", openingBalance: 0 },
  { code: "1200", name: "Equipment", type: "asset", subtype: "Fixed", openingBalance: 0 },
  { code: "1500", name: "Accumulated Depreciation", type: "asset", subtype: "Contra", openingBalance: 0 },
  { code: "1510", name: "Goodwill", type: "asset", subtype: "Intangible", openingBalance: 0 },
  { code: "2000", name: "Accounts Payable", type: "liability", subtype: "Current", openingBalance: 0 },
  { code: "2100", name: "Short-term Loans", type: "liability", subtype: "Current", openingBalance: 0 },
  { code: "2200", name: "Long-term Debt", type: "liability", subtype: "Long-term", openingBalance: 0 },
  { code: "2500", name: "Deferred Revenue", type: "liability", subtype: "Current", openingBalance: 0 },
  { code: "3000", name: "Common Stock", type: "equity", subtype: "Capital", openingBalance: 0 },
  { code: "3100", name: "Retained Earnings", type: "equity", subtype: "Earnings", openingBalance: 0 },
  { code: "3200", name: "Dividends", type: "equity", subtype: "Distribution", openingBalance: 0 },
  { code: "4000", name: "Sales Revenue", type: "revenue", subtype: "Operating", openingBalance: 0 },
  { code: "4100", name: "Service Revenue", type: "revenue", subtype: "Operating", openingBalance: 0 },
  { code: "4500", name: "Interest Income", type: "revenue", subtype: "Non-operating", openingBalance: 0 },
  { code: "5000", name: "Cost of Goods Sold", type: "expense", subtype: "Direct", openingBalance: 0 },
  { code: "5100", name: "Salaries & Wages", type: "expense", subtype: "Operating", openingBalance: 0 },
  { code: "5200", name: "Rent Expense", type: "expense", subtype: "Operating", openingBalance: 0 },
  { code: "5300", name: "Utilities", type: "expense", subtype: "Operating", openingBalance: 0 },
  { code: "5400", name: "Depreciation Expense", type: "expense", subtype: "Operating", openingBalance: 0 },
  { code: "5500", name: "Marketing", type: "expense", subtype: "Operating", openingBalance: 0 },
  { code: "5600", name: "Interest Expense", type: "expense", subtype: "Non-operating", openingBalance: 0 },
];

const insert = db.prepare("INSERT OR IGNORE INTO accounts (code, name, type, subtype, opening_balance, current_balance) VALUES (?, ?, ?, ?, ?, ?)");
let count = 0;
for (const a of defaultAccounts) {
  const result = insert.run(a.code, a.name, a.type, a.subtype, a.openingBalance, a.openingBalance);
  if (result.changes > 0) count++;
}

console.log(`✅ Seeded ${count} default accounts`);
console.log("Database ready at ./sqlite.db");
db.close();
