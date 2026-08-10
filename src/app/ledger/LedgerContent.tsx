"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, ArrowLeftRight, TrendingUp, TrendingDown, Hash } from "lucide-react";

interface Account {
  id: number; code: string; name: string; type: string;
}

interface Transaction {
  lineId: number;
  debit: number;
  credit: number;
  lineDescription: string | null;
  entryId: number;
  entryNumber: string;
  entryDate: string;
  entryDescription: string;
  entryReference: string | null;
  runningBalance: number;
}

const typeLabels: Record<string, string> = { asset: "Asset", liability: "Liability", equity: "Equity", revenue: "Revenue", expense: "Expense" };
const typeColors: Record<string, string> = { asset: "bg-emerald-100 text-emerald-800", liability: "bg-red-100 text-red-800", equity: "bg-blue-100 text-blue-800", revenue: "bg-amber-100 text-amber-800", expense: "bg-purple-100 text-purple-800" };

export default function LedgerContent() {
  const searchParams = useSearchParams();
  const initialAccountId = searchParams.get("accountId");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId || "");
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAccounts(); }, []);
  useEffect(() => { if (selectedAccountId) fetchLedger(selectedAccountId); }, [selectedAccountId]);

  async function fetchAccounts() {
    const res = await fetch("/api/accounts");
    const data = await res.json();
    setAccounts(Array.isArray(data) ? data : []);
  }

  async function fetchLedger(accountId: string) {
    setLoading(true);
    const res = await fetch(`/api/ledger?accountId=${accountId}`);
    const data = await res.json();
    setLedgerData(data);
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">General Ledger</h1>
        <p className="text-muted-foreground mt-1">View transaction history for any account</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Select Account</CardTitle></CardHeader>
        <CardContent>
          <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full max-w-md h-10 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">— Choose an account —</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
          </select>
        </CardContent>
      </Card>

      {ledgerData?.account && (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-semibold text-primary">{ledgerData.account.code}</span>
                    <h2 className="text-xl font-bold">{ledgerData.account.name}</h2>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${typeColors[ledgerData.account.type] || "bg-gray-100"}`}>{typeLabels[ledgerData.account.type] || ledgerData.account.type}</span>
                  </div>
                  {ledgerData.account.description && <p className="text-sm text-muted-foreground">{ledgerData.account.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold font-mono">${ledgerData.account.currentBalance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardDescription>Total Debits</CardDescription><CardTitle className="text-xl flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" />${ledgerData.summary.totalDebits.toLocaleString()}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Total Credits</CardDescription><CardTitle className="text-xl flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-500" />${ledgerData.summary.totalCredits.toLocaleString()}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Net Change</CardDescription><CardTitle className="text-xl flex items-center gap-2"><ArrowLeftRight className="h-5 w-5 text-blue-500" />${ledgerData.summary.netChange.toLocaleString()}</CardTitle></CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Transactions</CardDescription><CardTitle className="text-xl flex items-center gap-2"><Hash className="h-5 w-5 text-amber-500" />{ledgerData.summary.transactionCount}</CardTitle></CardHeader></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Transaction History</CardTitle><CardDescription>All journal entries affecting this account</CardDescription></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Date</TableHead><TableHead>Entry #</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead><TableHead className="text-right">Balance</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  : ledgerData.transactions.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transactions for this account yet</TableCell></TableRow>
                  : ledgerData.transactions.map((t: Transaction) => (
                    <TableRow key={t.lineId}>
                      <TableCell>{new Date(t.entryDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-sm">{t.entryNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{t.entryDescription}</div>
                        {t.lineDescription && <div className="text-xs text-muted-foreground">{t.lineDescription}</div>}
                        {t.entryReference && <div className="text-xs text-muted-foreground">Ref: {t.entryReference}</div>}
                      </TableCell>
                      <TableCell className="text-right font-mono">{t.debit > 0 ? `$${t.debit.toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="text-right font-mono">{t.credit > 0 ? `$${t.credit.toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">${t.runningBalance.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedAccountId && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground max-w-sm">Select an account above to view its general ledger — all transactions, running balance, and activity summary.</p>
        </Card>
      )}
    </div>
  );
}
