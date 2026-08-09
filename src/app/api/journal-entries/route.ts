import { NextResponse } from "next/server";
import { db } from "@/db";
import { journalEntries, journalEntryLines, accounts } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// GET /api/journal-entries — List all journal entries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const entries = await db
      .select()
      .from(journalEntries)
      .orderBy(desc(journalEntries.date))
      .limit(limit)
      .offset(offset);

    // Fetch lines for each entry
    const entriesWithLines = await Promise.all(
      entries.map(async (entry) => {
        const lines = await db
          .select({
            lineId: journalEntryLines.id,
            accountId: journalEntryLines.accountId,
            debit: journalEntryLines.debit,
            credit: journalEntryLines.credit,
            lineDescription: journalEntryLines.description,
            accountCode: accounts.code,
            accountName: accounts.name,
          })
          .from(journalEntryLines)
          .leftJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
          .where(eq(journalEntryLines.journalEntryId, entry.id));

        return { ...entry, lines };
      })
    );

    return NextResponse.json(entriesWithLines);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal entries" },
      { status: 500 }
    );
  }
}

// POST /api/journal-entries — Create a new journal entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, description, reference, lines } = body;

    if (!date || !description || !lines || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json(
        { error: "Date, description, and at least 2 journal lines are required" },
        { status: 400 }
      );
    }

    // Validate lines
    let totalDebits = 0;
    let totalCredits = 0;
    for (const line of lines) {
      if (!line.accountId || (line.debit === undefined && line.credit === undefined)) {
        return NextResponse.json(
          { error: "Each line must have an accountId and either a debit or credit amount" },
          { status: 400 }
        );
      }
      totalDebits += parseFloat(line.debit) || 0;
      totalCredits += parseFloat(line.credit) || 0;
    }

    // Debits must equal credits
    if (Math.abs(totalDebits - totalCredits) > 0.001) {
      return NextResponse.json(
        { error: `Debits ($${totalDebits.toFixed(2)}) must equal Credits ($${totalCredits.toFixed(2)})` },
        { status: 400 }
      );
    }

    // Generate entry number (JE-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(journalEntries)
      .where(sql`entry_number LIKE ${"JE-" + dateStr + "-%"}`);
    const count = (countResult[0]?.count || 0) + 1;
    const entryNumber = `JE-${dateStr}-${String(count).padStart(3, "0")}`;

    // Insert journal entry
    const entryResult = await db.insert(journalEntries).values({
      entryNumber,
      date: new Date(date),
      description,
      reference: reference || null,
      totalAmount: totalDebits,
    }).returning();

    const entryId = entryResult[0].id;

    // Insert journal entry lines
    for (const line of lines) {
      const debitAmount = parseFloat(line.debit) || 0;
      const creditAmount = parseFloat(line.credit) || 0;
      if (debitAmount === 0 && creditAmount === 0) continue;

      await db.insert(journalEntryLines).values({
        journalEntryId: entryId,
        accountId: line.accountId,
        debit: debitAmount,
        credit: creditAmount,
        description: line.description || null,
      });
    }

    // Update account balances
    for (const line of lines) {
      const debitAmount = parseFloat(line.debit) || 0;
      const creditAmount = parseFloat(line.credit) || 0;
      if (debitAmount === 0 && creditAmount === 0) continue;

      const accountResult = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, line.accountId))
        .limit(1);

      if (accountResult.length === 0) continue;

      const account = accountResult[0];
      let balanceChange = 0;

      // Assets & Expenses: Debit increases, Credit decreases
      // Liabilities, Equity, Revenue: Credit increases, Debit decreases
      if (account.type === "asset" || account.type === "expense") {
        balanceChange = debitAmount - creditAmount;
      } else {
        balanceChange = creditAmount - debitAmount;
      }

      await db
        .update(accounts)
        .set({
          currentBalance: account.currentBalance + balanceChange,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, line.accountId));
    }

    return NextResponse.json({ ...entryResult[0], lines }, { status: 201 });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return NextResponse.json(
      { error: "Failed to create journal entry" },
      { status: 500 }
    );
  }
}
