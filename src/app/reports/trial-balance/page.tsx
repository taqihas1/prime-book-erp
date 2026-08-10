"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertCircle, Scale } from "lucide-react";

interface TrialBalanceGroup {
  type: string;
  label: string;
  accounts: Array<{
    id: number; code: string; name: string; type: string;
    currentBalance: number; openingBalance: number;
  }>;
  groupDebit: number;
  groupCredit: number;
}

interface TrialBalanceData {
  grouped: TrialBalanceGroup[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  generatedAt: string;
}

const typeLabels: Record<string, string> = { asset: "Asset", liability: "Liability", equity: "Equity", revenue: "Revenue", expense: "Expense" };

export default function TrialBalancePage() {
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const res = await fetch("/api/trial-balance");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trial Balance</h1>
          <p className="text-muted-foreground mt-1">Verify that debits equal credits across all accounts</p>
        </div>
        {data && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${data.isBalanced ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {data.isBalanced ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-semibold">{data.isBalanced ? "Balanced" : "Unbalanced"}</span>
          </div>
        )}
      </div>

      {loading ? (
        <Card className="flex items-center justify-center py-16"><p className="text-muted-foreground">Loading trial balance...</p></Card>
      ) : !data ? (
        <Card className="flex items-center justify-center py-16"><p className="text-muted-foreground">Failed to load trial balance</p></Card>
      ) : (
        <>
          {/* Grand Total */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardDescription>Total Debits</CardDescription>
              <CardTitle className="text-2xl font-mono">${data.totalDebit.toLocaleString()}</CardTitle>
            </CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Total Credits</CardDescription>
              <CardTitle className="text-2xl font-mono">${data.totalCredit.toLocaleString()}</CardTitle>
            </CardHeader></Card>
            <Card><CardHeader className="pb-2"><CardDescription>Difference</CardDescription>
              <CardTitle className={`text-2xl font-mono ${Math.abs(data.totalDebit - data.totalCredit) < 0.01 ? "text-emerald-600" : "text-red-600"}`}>
                ${Math.abs(data.totalDebit - data.totalCredit).toFixed(2)}
              </CardTitle>
            </CardHeader></Card>
          </div>

          {/* Grouped Tables */}
          {data.grouped.map((group) => (
            <Card key={group.type}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{group.label}</CardTitle>
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Dr: <span className="font-mono font-semibold text-foreground">${group.groupDebit.toLocaleString()}</span></span>
                    <span className="text-muted-foreground">Cr: <span className="font-mono font-semibold text-foreground">${group.groupCredit.toLocaleString()}</span></span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.accounts.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-sm">No accounts in this category</TableCell></TableRow>
                    ) : (
                      group.accounts.map((account) => {
                        const isDebitNormal = account.type === "asset" || account.type === "expense";
                        const debit = isDebitNormal ? Math.max(0, account.currentBalance) : Math.max(0, -account.currentBalance);
                        const credit = isDebitNormal ? Math.max(0, -account.currentBalance) : Math.max(0, account.currentBalance);
                        return (
                          <TableRow key={account.id}>
                            <TableCell className="font-mono text-sm">{account.code}</TableCell>
                            <TableCell>
                              <div className="font-medium">{account.name}</div>
                              <Badge variant={account.type as any} className="text-xs mt-0.5">{typeLabels[account.type]}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{debit > 0 ? `$${debit.toLocaleString()}` : "—"}</TableCell>
                            <TableCell className="text-right font-mono">{credit > 0 ? `$${credit.toLocaleString()}` : "—"}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    {/* Group Subtotal */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2} className="text-right">{group.label} Total</TableCell>
                      <TableCell className="text-right font-mono">${group.groupDebit.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">${group.groupCredit.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {/* Generated timestamp */}
          <p className="text-xs text-muted-foreground text-right">Generated: {new Date(data.generatedAt).toLocaleString()}</p>
        </>
      )}
    </div>
  );
}
