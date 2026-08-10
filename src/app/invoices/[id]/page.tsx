"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileText, Check } from "lucide-react";

interface InvoiceDetail {
  id: number; invoiceNumber: string; issueDate: string; dueDate: string;
  status: string; subtotal: number; taxRate: number; taxAmount: number; totalAmount: number;
  amountPaid: number; notes: string | null; terms: string | null;
  customer: { name: string; email: string | null; address: string | null; city: string | null; country: string | null; taxId: string | null } | null;
  items: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800", sent: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800", overdue: "bg-red-100 text-red-800", cancelled: "bg-muted text-muted-foreground",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (params.id) fetchInvoice(); }, [params.id]);

  async function fetchInvoice() {
    setLoading(true);
    const res = await fetch(`/api/invoices/${params.id}`);
    const data = await res.json();
    setInvoice(data);
    setLoading(false);
  }

  async function updateStatus(status: string) {
    await fetch(`/api/invoices/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchInvoice();
  }

  if (loading) return <div className="p-6 text-muted-foreground">Loading invoice...</div>;
  if (!invoice) return <div className="p-6 text-muted-foreground">Invoice not found</div>;

  const isOverdue = invoice.status === "sent" && new Date(invoice.dueDate) < new Date();
  const balanceDue = invoice.totalAmount - invoice.amountPaid;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">Invoice Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[invoice.status] || "bg-gray-100"}`}>{invoice.status}</span>
          {invoice.status === "draft" && <Button size="sm" onClick={() => updateStatus("sent")}><FileText className="h-4 w-4 mr-2" />Send</Button>}
          {invoice.status === "sent" && <Button size="sm" onClick={() => updateStatus("paid")}><Check className="h-4 w-4 mr-2" />Mark Paid</Button>}
        </div>
      </div>

      {isOverdue && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">⚠ This invoice is overdue. Due date was {new Date(invoice.dueDate).toLocaleDateString()}.</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Bill To</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold text-lg">{invoice.customer?.name}</p>
            {invoice.customer?.taxId && <p className="text-sm text-muted-foreground">Tax ID: {invoice.customer.taxId}</p>}
            {invoice.customer?.email && <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>}
            {(invoice.customer?.address || invoice.customer?.city) && (
              <p className="text-sm text-muted-foreground mt-1">{[invoice.customer.address, invoice.customer.city, invoice.customer.country].filter(Boolean).join(", ")}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Invoice Info</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Issue Date</span><span>{new Date(invoice.issueDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span className={isOverdue ? "text-red-600 font-medium" : ""}>{new Date(invoice.dueDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{invoice.status}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Description</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">${item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                <TableCell className="text-right font-mono font-medium">${invoice.subtotal.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">Tax ({invoice.taxRate}%)</TableCell>
                <TableCell className="text-right font-mono">${invoice.taxAmount.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell colSpan={3} className="text-right font-bold text-lg">Total</TableCell>
                <TableCell className="text-right font-mono font-bold text-lg">${invoice.totalAmount.toFixed(2)}</TableCell>
              </TableRow>
              {invoice.amountPaid > 0 && (
                <>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium text-emerald-600">Amount Paid</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">${invoice.amountPaid.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={3} className="text-right font-bold">Balance Due</TableCell>
                    <TableCell className="text-right font-mono font-bold">${balanceDue.toFixed(2)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{invoice.notes}</p></CardContent></Card>
      )}
    </div>
  );
}
