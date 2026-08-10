"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Pencil, Trash2, X, Check, Mail, Phone, MapPin } from "lucide-react";

interface Customer {
  id: number; name: string; email: string | null; phone: string | null;
  address: string | null; city: string | null; country: string | null; taxId: string | null; isActive: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", city: "", country: "", taxId: "" });

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    setLoading(true);
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
    const method = editingId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    setShowForm(false); setEditingId(null); setFormData({ name: "", email: "", phone: "", address: "", city: "", country: "", taxId: "" });
    fetchCustomers();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this customer?")) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    fetchCustomers();
  }

  function startEdit(c: Customer) {
    setEditingId(c.id);
    setFormData({ name: c.name, email: c.email || "", phone: c.phone || "", address: c.address || "", city: c.city || "", country: c.country || "", taxId: c.taxId || "" });
    setShowForm(true);
  }

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Customers</h1><p className="text-muted-foreground mt-1">Manage your customer directory</p></div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: "", email: "", phone: "", address: "", city: "", country: "", taxId: "" }); }}>
          <Plus className="h-4 w-4 mr-2" />{showForm ? "Cancel" : "Add Customer"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? "Edit Customer" : "New Customer"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><label className="text-sm font-medium">Name *</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Email</label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Phone</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Tax ID</label><Input value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} /></div>
              <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium">Address</label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">City</label><Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Country</label><Input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} /></div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit"><Check className="h-4 w-4 mr-2" />{editingId ? "Update" : "Create"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" /><Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" /></div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Location</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : filtered.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
              : filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell><div className="font-medium">{c.name}</div>{c.taxId && <div className="text-xs text-muted-foreground">Tax: {c.taxId}</div>}</TableCell>
                  <TableCell>
                    {c.email && <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" />{c.email}</div>}
                    {c.phone && <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" />{c.phone}</div>}
                  </TableCell>
                  <TableCell>
                    {(c.city || c.country) && <div className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3" />{[c.city, c.country].filter(Boolean).join(", ")}</div>}
                  </TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
