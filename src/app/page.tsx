import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, TrendingUp, DollarSign, Users } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Dashboard</h1><p className="text-muted-foreground mt-1">Overview of your business</p></div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total Revenue</CardDescription><CardTitle className="text-2xl flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-500" />$0.00</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Expenses</CardDescription><CardTitle className="text-2xl flex items-center gap-2"><TrendingUp className="h-5 w-5 text-red-500" />$0.00</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Net Income</CardDescription><CardTitle className="text-2xl flex items-center gap-2"><DollarSign className="h-5 w-5 text-blue-500" />$0.00</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Active Accounts</CardDescription><CardTitle className="text-2xl flex items-center gap-2"><Users className="h-5 w-5 text-amber-500" />24</CardTitle></CardHeader></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Quick Actions</CardTitle><CardDescription>Get started with Prime Book</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            <a href="/accounts" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"><BookOpen className="h-5 w-5 text-primary" /><div><p className="font-medium">Chart of Accounts</p><p className="text-xs text-muted-foreground">View and manage accounts</p></div></a>
            <a href="/journal" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"><DollarSign className="h-5 w-5 text-primary" /><div><p className="font-medium">Journal Entries</p><p className="text-xs text-muted-foreground">Record transactions</p></div></a>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Recent Activity</CardTitle><CardDescription>Latest updates</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">No recent activity yet. Start by adding accounts!</p></CardContent></Card>
      </div>
    </div>
  );
}
