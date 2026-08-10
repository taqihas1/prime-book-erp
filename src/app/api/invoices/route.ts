import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceItems, customers } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// GET /api/invoices
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    const conditions = [];
    if (status) conditions.push(eq(invoices.status, status as any));
    if (customerId) conditions.push(eq(invoices.customerId, parseInt(customerId)));

    let allInvoices;
    if (conditions.length > 0) {
      allInvoices = await db.select().from(invoices).where(conditions.length === 1 ? conditions[0] : sql`(${conditions.join(" AND ")})`).orderBy(desc(invoices.issueDate));
    } else {
      allInvoices = await db.select().from(invoices).orderBy(desc(invoices.issueDate));
    }

    // Attach customer info
    const withCustomers = await Promise.all(
      allInvoices.map(async (inv) => {
        const cust = await db.select().from(customers).where(eq(customers.id, inv.customerId)).limit(1);
        return { ...inv, customer: cust[0] || null };
      })
    );

    return NextResponse.json(withCustomers);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

// POST /api/invoices
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, issueDate, dueDate, items, taxRate, notes, terms } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Customer and at least one item are required" }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const tax = taxRate ? (subtotal * taxRate) / 100 : 0;
    const total = subtotal + tax;

    // Generate invoice number INV-YYYYMMDD-XXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(invoices).where(sql`invoice_number LIKE ${"INV-" + dateStr + "-%"}`);
    const count = (countResult[0]?.count || 0) + 1;
    const invoiceNumber = `INV-${dateStr}-${String(count).padStart(3, "0")}`;

    // Insert invoice
    const result = await db.insert(invoices).values({
      invoiceNumber, customerId: parseInt(customerId),
      issueDate: new Date(issueDate || today), dueDate: new Date(dueDate || today),
      status: "draft", subtotal, taxRate: taxRate || 0, taxAmount: tax, totalAmount: total,
      notes: notes || null, terms: terms || null,
    }).returning();

    const invoiceId = result[0].id;

    // Insert items
    for (const item of items) {
      await db.insert(invoiceItems).values({
        invoiceId, description: item.description,
        quantity: item.quantity || 1, unitPrice: item.unitPrice || 0,
        amount: (item.quantity || 1) * (item.unitPrice || 0),
      });
    }

    // Return with items
    const itemsResult = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    return NextResponse.json({ ...result[0], items: itemsResult }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
