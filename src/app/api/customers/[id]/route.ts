import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const customerId = parseInt(id);
    if (isNaN(customerId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await db.update(customers).set({ ...body, updatedAt: new Date() }).where(eq(customers.id, customerId));
    const updated = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);
    if (isNaN(customerId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    await db.delete(customers).where(eq(customers.id, customerId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
