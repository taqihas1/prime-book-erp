import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const conditions = [];
    if (type) conditions.push(eq(accounts.type, type as any));
    if (search) conditions.push(sql`${accounts.name} LIKE ${"%" + search + "%"} OR ${accounts.code} LIKE ${"%" + search + "%"}`);
    let allAccounts;
    if (conditions.length > 0) {
      allAccounts = await db.select().from(accounts).where(conditions.length === 1 ? conditions[0] : sql`(${conditions.join(" AND ")})`).orderBy(accounts.code);
    } else {
      allAccounts = await db.select().from(accounts).orderBy(accounts.code);
    }
    return NextResponse.json(allAccounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, type, subtype, description, openingBalance } = body;
    if (!code || !name || !type) return NextResponse.json({ error: "Code, name, and type are required" }, { status: 400 });
    const existing = await db.select().from(accounts).where(eq(accounts.code, code)).limit(1);
    if (existing.length > 0) return NextResponse.json({ error: "Account code already exists" }, { status: 409 });
    await db.insert(accounts).values({ code, name, type, subtype: subtype || null, description: description || null, openingBalance: openingBalance || 0, currentBalance: openingBalance || 0 });
    const newAccount = await db.select().from(accounts).where(eq(accounts.code, code)).limit(1);
    return NextResponse.json(newAccount[0], { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
