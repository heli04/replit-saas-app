import * as React from "react";
import { Shell } from "@/components/layout/shell";
import { 
  useGetRevenueSeries, 
  useListRevenueLogs,
  getGetRevenueSeriesQueryKey,
  getListRevenueLogsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function RevenuePage() {
  const { data: revenueSeries, isLoading: isRevenueLoading } = useGetRevenueSeries({ query: { queryKey: getGetRevenueSeriesQueryKey() } });
  
  const { data: revenueLogs, isLoading: isLogsLoading } = useListRevenueLogs({ limit: 50 }, { 
    query: { queryKey: getListRevenueLogsQueryKey({ limit: 50 }) } 
  });

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Revenue</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Detailed breakdown of your income streams.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trailing 12 Months</CardTitle>
            <CardDescription>Monthly recurring revenue</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            {isRevenueLoading ? (
              <div className="h-[300px] w-full flex items-center justify-center">
                <Skeleton className="h-[280px] w-full ml-6" />
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenuePage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `$${value}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenuePage)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Log</CardTitle>
            <CardDescription>Recent transactions across all plans</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t border-border overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLogsLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : revenueLogs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                        No revenue records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    revenueLogs?.map((log) => {
                      const isRefund = log.type === 'refund';
                      return (
                        <TableRow key={log.id} className="group hover:bg-muted/30">
                          <TableCell className="font-medium text-foreground">
                            {log.customerName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(log.occurredAt), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "capitalize", 
                                isRefund && "border-destructive text-destructive"
                              )}
                            >
                              {log.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn("text-right font-medium", isRefund && "text-destructive")}>
                            {isRefund ? "-" : ""}{formatCurrency(log.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8">
                              <Link href={`/customers/${log.customerId}`} title="View Customer">
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

// utility to help with cn directly here if not exported from utils cleanly
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
