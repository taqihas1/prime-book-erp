import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, subtype, description, isActive, openingBalance } = body;
    const accountId = parseInt(id);
    if (isNaN(accountId)) return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    await db.update(accounts).set({ name, subtype, description, isActive, openingBalance, updatedAt: new Date() }).where(eq(accounts.id, accountId));
    const updated = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const accountId = parseInt(id);
    if (isNaN(accountId)) return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    await db.delete(accounts).where(eq(accounts.id, accountId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
