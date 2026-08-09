"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, TrendingUp, TrendingDown, DollarSign, Search, Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface Account {
  id: number; code: string; name: string; type: string; subtype: string | null;
  description: string | null; isActive: boolean; openingBalance: number; currentBalance: number;
}

const typeLabels: Record<string, string> = { asset: "Asset", liability: "Liability", equity: "Equity", revenue: "Revenue", expense: "Expense" };

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", type: "asset", subtype: "", description: "", openingBalance: "" });

  useEffect(() => { fetchAccounts(); }, []);

  async function fetchAccounts() {
    setLoading(true);
    const res = await fetch("/api/accounts");
    const data = await res.json();
    setAccounts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...formData, openingBalance: parseFloat(formData.openingBalance) || 0 };
    if (editingId) {
      await fetch(`/api/accounts/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowForm(false); setEditingId(null); setFormData({ code: "", name: "", type: "asset", subtype: "", description: "", openingBalance: "" });
    fetchAccounts();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this account?")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    fetchAccounts();
  }

  function startEdit(account: Account) {
    setEditingId(account.id);
    setFormData({ code: account.code, name: account.name, type: account.type, subtype: account.subtype || "", description: account.description || "", openingBalance: String(account.openingBalance) });
    setShowForm(true);
  }

  const filtered = accounts.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search));
  const totalAssets = accounts.filter(a => a.type === "asset").reduce((s, a) => s + a.currentBalance, 0);
  const totalLiabilities = accounts.filter(a => a.type === "liability").reduce((s, a) => s + a.currentBalance, 0);
  const totalEquity = accounts.filter(a => a.type === "equity").reduce((s, a) => s + a.currentBalance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1><p className="text-muted-foreground mt-1">Manage your accounts</p></div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ code: "", name: "", type: "asset", subtype: "", description: "", openingBalance: "" }); }}>
          <Plus className="h-4 w-4 mr-2" /> {showForm ? "Cancel" : "Add Account"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Total Assets</CardDescription><CardTitle className="text-2xl flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" />${totalAssets.toLocaleString()}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Liabilities</CardDescription><CardTitle className="text-2xl flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-500" />${totalLiabilities.toLocaleString()}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Equity</CardDescription><CardTitle className="text-2xl flex items-center gap-2"><DollarSign className="h-5 w-5 text-blue-500" />${totalEquity.toLocaleString()}</CardTitle></CardHeader></Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card><CardHeader><CardTitle>{editingId ? "Edit Account" : "New Account"}</CardTitle></CardHeader>
          <CardContent><form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><label className="text-sm font-medium">Code *</label><Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="1000" required /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Name *</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Cash" required /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Type *</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="revenue">Revenue</option><option value="expense">Expense</option>
              </select>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">Subtype</label><Input value={formData.subtype} onChange={e => setFormData({...formData, subtype: e.target.value})} placeholder="Current" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Opening Balance</label><Input type="number" step="0.01" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: e.target.value})} placeholder="0.00" /></div>
            <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium">Description</label><Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional description" /></div>
            <div className="flex gap-2 md:col-span-2"><Button type="submit"><Check className="h-4 w-4 mr-2" />{editingId ? "Update" : "Create"}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}><X className="h-4 w-4 mr-2" />Cancel</Button></div>
          </form></CardContent>
        </Card>
      )}

      {/* Search + Table */}
      <div className="flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" /><Input placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" /></div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Balance</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
                filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No accounts found</TableCell></TableRow> :
                filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono font-medium">{a.code}</TableCell>
                    <TableCell><div className="font-medium">{a.name}</div>{a.description && <div className="text-xs text-muted-foreground">{a.description}</div>}</TableCell>
                    <TableCell><Badge variant={a.type as any}>{typeLabels[a.type] || a.type}</Badge></TableCell>
                    <TableCell className="font-mono">${a.currentBalance.toLocaleString()}</TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(a)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
