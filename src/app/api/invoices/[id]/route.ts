import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceItems, customers } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/invoices/[id] - Get single invoice with items
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const invoiceResult = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (invoiceResult.length === 0) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    const customer = await db.select().from(customers).where(eq(customers.id, invoiceResult[0].customerId)).limit(1);

    return NextResponse.json({ ...invoiceResult[0], items, customer: customer[0] || null });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

// PATCH /api/invoices/[id] - Update status, record payment
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await request.json();
    const { status, amountPaid } = body;

    const updates: any = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (amountPaid !== undefined) updates.amountPaid = amountPaid;

    await db.update(invoices).set(updates).where(eq(invoices.id, invoiceId));

    const updated = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}
