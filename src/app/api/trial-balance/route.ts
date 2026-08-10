import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// GET /api/trial-balance — Get trial balance report
export async function GET() {
  try {
    // Get all active accounts ordered by code
    const allAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.isActive, true))
      .orderBy(accounts.code);

    // Group by type and calculate totals
    const typeOrder = ["asset", "liability", "equity", "revenue", "expense"];
    const typeLabels: Record<string, string> = {
      asset: "Assets",
      liability: "Liabilities",
      equity: "Equity",
      revenue: "Revenue",
      expense: "Expenses",
    };

    const grouped = typeOrder.map((type) => {
      const typeAccounts = allAccounts.filter((a) => a.type === type);
      const groupDebit = typeAccounts.reduce((sum, a) => {
        // Assets and expenses normally have debit balances
        if (type === "asset" || type === "expense") {
          return sum + Math.max(0, a.currentBalance);
        }
        return sum + Math.max(0, -a.currentBalance);
      }, 0);
      const groupCredit = typeAccounts.reduce((sum, a) => {
        if (type === "asset" || type === "expense") {
          return sum + Math.max(0, -a.currentBalance);
        }
        return sum + Math.max(0, a.currentBalance);
      }, 0);

      return {
        type,
        label: typeLabels[type],
        accounts: typeAccounts,
        groupDebit,
        groupCredit,
      };
    });

    const totalDebit = grouped.reduce((s, g) => s + g.groupDebit, 0);
    const totalCredit = grouped.reduce((s, g) => s + g.groupCredit, 0);

    return NextResponse.json({
      grouped,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating trial balance:", error);
    return NextResponse.json(
      { error: "Failed to generate trial balance" },
      { status: 500 }
    );
  }
}
