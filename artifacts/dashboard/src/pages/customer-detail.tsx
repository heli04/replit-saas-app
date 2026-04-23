import * as React from "react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/shell";
import { 
  useGetCustomer,
  getGetCustomerQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, Mail, Calendar, CreditCard, Building2, TrendingUp, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function CustomerDetailPage() {
  const [, params] = useRoute("/customers/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data, isLoading } = useGetCustomer(id, {
    query: {
      enabled: !!id,
      queryKey: getGetCustomerQueryKey(id)
    }
  });

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-6">
              <Skeleton className="h-[300px] w-full" />
            </div>
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-[150px] w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Customer not found</h2>
          <Button asChild variant="link" className="mt-4">
            <Link href="/customers">Back to Customers</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const { customer, lifetimeValue, recentRevenue } = data;

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="h-10 w-10 shrink-0">
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0 flex justify-between items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{customer.name}</h1>
                <Badge 
                  variant={customer.status === "active" ? "default" : "secondary"}
                  className={customer.status === "active" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-0" : ""}
                >
                  {customer.status}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm sm:text-base">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{customer.email}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Plan Tier</span>
                    <span className="font-medium capitalize">{customer.plan}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Monthly Recurring</span>
                    <span className="font-medium">{formatCurrency(customer.mrr)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Customer Since</span>
                    <span className="font-medium">{format(new Date(customer.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-primary text-primary-foreground border-0">
              <CardContent className="p-6 flex flex-col justify-center min-h-[140px]">
                <div className="flex items-center gap-2 mb-2 text-primary-foreground/80">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-medium">Lifetime Value</span>
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight break-all">
                  {formatCurrency(lifetimeValue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Revenue</CardTitle>
                <CardDescription>Payment history for this customer</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRevenue.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No revenue records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentRevenue.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {format(new Date(log.occurredAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {log.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(log.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
