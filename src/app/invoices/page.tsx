"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, X, Check, Trash2 } from "lucide-react";

interface Invoice {
  id: number; invoiceNumber: string; customerId: number; issueDate: string;
  dueDate: string; status: string; totalAmount: number; amountPaid: number;
  customer: { name: string } | null;
}

interface Customer {
  id: number; name: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-muted text-muted-foreground",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ customerId: "", issueDate: new Date().toISOString().slice(0, 10), dueDate: "", taxRate: "0", notes: "", terms: "" });
  const [items, setItems] = useState([{ description: "", quantity: "1", unitPrice: "" }]);

  useEffect(() => { fetchInvoices(); fetchCustomers(); }, []);

  async function fetchInvoices() {
    setLoading(true);
    const res = await fetch("/api/invoices");
    const data = await res.json();
    setInvoices(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function fetchCustomers() {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
  }

  function addItem() { setItems([...items, { description: "", quantity: "1", unitPrice: "" }]); }
  function removeItem(i: number) { if (items.length <= 1) return; setItems(items.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, field: string, value: string) { const updated = [...items]; updated[i] = { ...updated[i], [field]: value }; setItems(updated); }

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0);
  const tax = (subtotal * (parseFloat(formData.taxRate) || 0)) / 100;
  const total = subtotal + tax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...formData,
      taxRate: parseFloat(formData.taxRate) || 0,
      items: items.map(item => ({ description: item.description, quantity: parseFloat(item.quantity) || 0, unitPrice: parseFloat(item.unitPrice) || 0 })),
    };
    const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setShowForm(false); setFormData({ customerId: "", issueDate: new Date().toISOString().slice(0, 10), dueDate: "", taxRate: "0", notes: "", terms: "" }); setItems([{ description: "", quantity: "1", unitPrice: "" }]); fetchInvoices(); }
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchInvoices();
  }

  const filtered = invoices.filter(inv => inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || (inv.customer?.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Invoices</h1><p className="text-muted-foreground mt-1">Manage invoices and payments</p></div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-2" />{showForm ? "Cancel" : "New Invoice"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Invoice</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><label className="text-sm font-medium">Customer *</label>
                  <select value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm" required>
                    <option value="">Select customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><label className="text-sm font-medium">Issue Date</label><Input type="date" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-sm font-medium">Due Date</label><Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Tax Rate (%)</label><Input type="number" step="0.01" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: e.target.value})} /></div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Line Items</label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="w-24">Qty</TableHead><TableHead className="w-32">Unit Price</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell><Input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Item description" className="h-8" required /></TableCell>
                          <TableCell><Input type="number" step="0.01" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} className="h-8" required /></TableCell>
                          <TableCell><Input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", e.target.value)} placeholder="0.00" className="h-8" required /></TableCell>
                          <TableCell><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(i)} disabled={items.length <= 1}><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button type="button" variant="outline" onClick={addItem} className="w-full">+ Add Item</Button>
              </div>

              <div className="flex justify-end gap-4 text-sm">
                <div className="text-right space-y-1">
                  <div className="text-muted-foreground">Subtotal: <span className="font-mono font-semibold">${subtotal.toFixed(2)}</span></div>
                  <div className="text-muted-foreground">Tax ({formData.taxRate}%): <span className="font-mono font-semibold">${tax.toFixed(2)}</span></div>
                  <div className="text-lg font-bold">Total: <span className="font-mono">${total.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="space-y-2"><label className="text-sm font-medium">Notes</label><Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Invoice notes" /></div>
              <div className="flex gap-2">
                <Button type="submit"><Check className="h-4 w-4 mr-2" />Create Invoice</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" /><Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" /></div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Due</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="w-[140px]">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No invoices yet</TableCell></TableRow>
              : filtered.map(inv => {
                const isOverdue = inv.status === "sent" && new Date(inv.dueDate) < new Date();
                return (
                  <TableRow key={inv.id}>
                    <TableCell><Link href={`/invoices/${inv.id}`} className="font-mono font-medium text-primary hover:underline">{inv.invoiceNumber}</Link></TableCell>
                    <TableCell>{inv.customer?.name || "—"}</TableCell>
                    <TableCell>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell className={isOverdue ? "text-red-600 font-medium" : ""}>{new Date(inv.dueDate).toLocaleDateString()}{isOverdue && " (Overdue)"}</TableCell>
                    <TableCell className="text-right font-mono">${inv.totalAmount.toLocaleString()}</TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColors[inv.status] || "bg-gray-100"}`}>{inv.status}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {inv.status === "draft" && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateStatus(inv.id, "sent")}>Send</Button>}
                        {inv.status === "sent" && <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => updateStatus(inv.id, "paid")}>Mark Paid</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
