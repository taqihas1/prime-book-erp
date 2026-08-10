"use client";

import { Suspense } from "react";
import LedgerContent from "./LedgerContent";

export default function LedgerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading ledger...</div>}>
      <LedgerContent />
    </Suspense>
  );
}
