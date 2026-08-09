import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function JournalPage() {
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1><p className="text-muted-foreground mt-1">Record and manage transactions</p></div>
      <Card><CardHeader><CardTitle>Coming Soon</CardTitle><CardDescription>Journal entries will be available in Phase 2</CardDescription></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground max-w-sm">Journal entries, general ledger, and transaction recording are under development. Start by setting up your Chart of Accounts!</p>
          <a href="/accounts" className="mt-4 text-primary hover:underline">Go to Chart of Accounts →</a>
        </CardContent>
      </Card>
    </div>
  );
}
