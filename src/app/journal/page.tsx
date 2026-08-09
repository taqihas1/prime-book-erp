"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, X, Check, Trash2 } from "lucide-react";

interface JournalEntry {
  id: number;
  entryNumber: string;
  date: string;
  description: string;
  reference: string | null;
  totalAmount: number;
  isPosted: boolean;
  lines: JournalLine[];
}

interface JournalLine {
  lineId: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  lineDescription: string | null;
}

interface Account {
  id: number;
  code: string;
  name: string;
  type: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    reference: "",
  });

  const [formLines, setFormLines] = useState([
    { accountId: "", debit: "", credit: "", description: "" },
    { accountId: "", debit: "", credit: "", description: "" },
  ]);

  useEffect(() => { fetchEntries(); fetchAccounts(); }, []);

  async function fetchEntries() {
    setLoading(true);
    const res = await fetch("/api/journal-entries");
    const data = await res.json();
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function fetchAccounts() {
    const res = await fetch("/api/accounts");
    const data = await res.json();
    setAccounts(Array.isArray(data) ? data : []);
  }

  function addLine() {
    setFormLines([...formLines, { accountId: "", debit: "", credit: "", description: "" }]);
  }

  function removeLine(index: number) {
    if (formLines.length <= 2) return;
    setFormLines(formLines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: string, value: string) {
    const updated = [...formLines];
    updated[index] = { ...updated[index], [field]: value };
    setFormLines(updated);
  }

  const totalDebits = formLines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredits = formLines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isBalanced) {
      setError(`Debits ($${totalDebits.toFixed(2)}) must equal Credits ($${totalCredits.toFixed(2)})`);
      return;
    }

    const lines = formLines
      .filter(l => l.accountId && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0))
      .map(l => ({
        accountId: parseInt(l.accountId),
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        description: l.description,
      }));

    const res = await fetch("/api/journal-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, lines }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Failed to create journal entry");
      return;
    }

    setShowForm(false);
    setFormData({ date: new Date().toISOString().slice(0, 10), description: "", reference: "" });
    setFormLines([
      { accountId: "", debit: "", credit: "", description: "" },
      { accountId: "", debit: "", credit: "", description: "" },
    ]);
    fetchEntries();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-muted-foreground mt-1">Record and manage transactions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancel" : "New Entry"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Journal Entry</CardTitle>
            <CardDescription>Debits must equal credits</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date *</label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Description *</label>
                  <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="e.g., Paid office rent" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference</label>
                <Input value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} placeholder="Invoice #, Check #, etc." />
              </div>

              {/* Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Journal Lines</label>
                  <div className={`text-sm font-medium ${isBalanced ? "text-emerald-600" : "text-red-600"}`}>
                    Dr: ${totalDebits.toFixed(2)} | Cr: ${totalCredits.toFixed(2)}
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formLines.map((line, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <select value={line.accountId} onChange={e => updateLine(i, "accountId", e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm" required>
                              <option value="">Select account</option>
                              {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                            </select>
                          </TableCell>
                          <TableCell><Input value={line.description} onChange={e => updateLine(i, "description", e.target.value)} placeholder="Line note" className="h-8" /></TableCell>
                          <TableCell><Input type="number" step="0.01" min="0" value={line.debit} onChange={e => updateLine(i, "debit", e.target.value)} placeholder="0.00" className="h-8 text-right" /></TableCell>
                          <TableCell><Input type="number" step="0.01" min="0" value={line.credit} onChange={e => updateLine(i, "credit", e.target.value)} placeholder="0.00" className="h-8 text-right" /></TableCell>
                          <TableCell><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLine(i)} disabled={formLines.length <= 2}><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button type="button" variant="outline" onClick={addLine} className="w-full">+ Add Line</Button>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button type="submit" disabled={!isBalanced}><Check className="h-4 w-4 mr-2" />Create Entry</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : entries.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No journal entries yet</TableCell></TableRow>
              ) : (
                entries.map(entry => (
                  <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono font-medium">{entry.entryNumber}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-medium">{entry.description}</div>
                      {entry.reference && <div className="text-xs text-muted-foreground">Ref: {entry.reference}</div>}
                    </TableCell>
                    <TableCell className="text-right font-mono">${entry.totalAmount.toLocaleString()}</TableCell>
                    <TableCell><Badge variant={entry.isPosted ? "default" : "secondary"}>{entry.isPosted ? "Posted" : "Draft"}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
