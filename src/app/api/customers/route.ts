import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// GET /api/customers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const conditions = [];
    if (search) {
      conditions.push(sql`${customers.name} LIKE ${"%" + search + "%"} OR ${customers.email} LIKE ${"%" + search + "%"}`);
    }

    let allCustomers;
    if (conditions.length > 0) {
      allCustomers = await db.select().from(customers).where(conditions[0]).orderBy(customers.name);
    } else {
      allCustomers = await db.select().from(customers).orderBy(customers.name);
    }

    return NextResponse.json(allCustomers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, country, taxId } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await db.insert(customers).values({
      name, email: email || null, phone: phone || null,
      address: address || null, city: city || null, country: country || null, taxId: taxId || null,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
