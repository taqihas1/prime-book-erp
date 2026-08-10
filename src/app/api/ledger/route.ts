import { NextResponse } from "next/server";
import { db } from "@/db";
import { journalEntryLines, journalEntries, accounts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/ledger?accountId=123 — Get all transactions for an account
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    const accountIdNum = parseInt(accountId);
    if (isNaN(accountIdNum)) {
      return NextResponse.json({ error: "Invalid accountId" }, { status: 400 });
    }

    // Get account info
    const accountResult = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountIdNum))
      .limit(1);

    if (accountResult.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get all journal entry lines for this account with entry details
    const lines = await db
      .select({
        lineId: journalEntryLines.id,
        debit: journalEntryLines.debit,
        credit: journalEntryLines.credit,
        lineDescription: journalEntryLines.description,
        entryId: journalEntries.id,
        entryNumber: journalEntries.entryNumber,
        entryDate: journalEntries.date,
        entryDescription: journalEntries.description,
        entryReference: journalEntries.reference,
      })
      .from(journalEntryLines)
      .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
      .where(eq(journalEntryLines.accountId, accountIdNum))
      .orderBy(desc(journalEntries.date));

    // Calculate running balance
    let runningBalance = 0;
    const account = accountResult[0];
    const linesWithBalance = lines.map((line) => {
      if (account.type === "asset" || account.type === "expense") {
        runningBalance += (line.debit || 0) - (line.credit || 0);
      } else {
        runningBalance += (line.credit || 0) - (line.debit || 0);
      }
      return { ...line, runningBalance };
    });

    return NextResponse.json({
      account: accountResult[0],
      transactions: linesWithBalance,
      summary: {
        totalDebits: lines.reduce((s, l) => s + (l.debit || 0), 0),
        totalCredits: lines.reduce((s, l) => s + (l.credit || 0), 0),
        netChange: account.type === "asset" || account.type === "expense"
          ? lines.reduce((s, l) => s + (l.debit || 0) - (l.credit || 0), 0)
          : lines.reduce((s, l) => s + (l.credit || 0) - (l.debit || 0), 0),
        transactionCount: lines.length,
      },
    });
  } catch (error) {
    console.error("Error fetching ledger:", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger" },
      { status: 500 }
    );
  }
}
