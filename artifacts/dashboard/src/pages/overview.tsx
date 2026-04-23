import * as React from "react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/shell";
import { 
  useGetOverviewMetrics, 
  useGetRevenueSeries, 
  useGetPlanBreakdown, 
  useGetRecentActivity,
  getGetOverviewMetricsQueryKey,
  getGetRevenueSeriesQueryKey,
  getGetPlanBreakdownQueryKey,
  getGetRecentActivityQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus, Activity, DollarSign, Users, TrendingUp, CreditCard, UserPlus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function formatPercent(value: number) {
  return `${(value).toFixed(1)}%`;
}

function TrendIndicator({ trend, positiveIsGood, deltaPercent }: { trend: "up" | "down" | "flat", positiveIsGood: boolean, deltaPercent: number }) {
  const isGood = trend === "flat" ? true : (trend === "up" ? positiveIsGood : !positiveIsGood);
  const colorClass = isGood ? "text-emerald-500" : "text-destructive";
  
  if (trend === "flat") return <span className="flex items-center text-xs text-muted-foreground"><Minus className="w-3 h-3 mr-1" /> Flat</span>;
  
  return (
    <span className={`flex items-center text-xs font-medium ${colorClass}`}>
      {trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
      {Math.abs(deltaPercent).toFixed(1)}%
    </span>
  );
}

function StatCard({ title, icon: Icon, isLoading, data }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-24 mb-1" />
            <Skeleton className="h-4 w-16" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {data.format === 'currency' && formatCurrency(data.value)}
              {data.format === 'number' && formatNumber(data.value)}
              {data.format === 'percent' && formatPercent(data.value)}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <TrendIndicator trend={data.trend} positiveIsGood={data.positiveIsGood} deltaPercent={data.deltaPercent} />
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function OverviewPage() {
  const { data: metrics, isLoading: isMetricsLoading } = useGetOverviewMetrics({ query: { queryKey: getGetOverviewMetricsQueryKey() } });
  const { data: revenueSeries, isLoading: isRevenueLoading } = useGetRevenueSeries({ query: { queryKey: getGetRevenueSeriesQueryKey() } });
  const { data: planBreakdown, isLoading: isPlansLoading } = useGetPlanBreakdown({ query: { queryKey: getGetPlanBreakdownQueryKey() } });
  const { data: recentActivity, isLoading: isActivityLoading } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Your SaaS business at a glance.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Monthly Recurring Revenue" icon={DollarSign} isLoading={isMetricsLoading} data={metrics?.mrr} />
          <StatCard title="Active Customers" icon={Users} isLoading={isMetricsLoading} data={metrics?.activeUsers} />
          <StatCard title="Revenue Churn Rate" icon={Activity} isLoading={isMetricsLoading} data={metrics?.churnRate} />
          <StatCard title="Avg Revenue Per User" icon={TrendingUp} isLoading={isMetricsLoading} data={metrics?.avgRevenue} />
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Trailing 12 months MRR growth</CardDescription>
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
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                      <Tooltip 
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
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-3 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Plan Breakdown</CardTitle>
                <CardDescription>Active customers by subscription tier</CardDescription>
              </CardHeader>
              <CardContent>
                {isPlansLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {planBreakdown?.map((plan) => (
                      <div key={plan.plan} className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium capitalize">{plan.plan}</span>
                          <span className="text-xs text-muted-foreground">{plan.customers} customers</span>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(plan.revenue)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest customer events</CardDescription>
              </CardHeader>
              <CardContent>
                {isActivityLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity?.map((activity) => {
                      let Icon = Activity;
                      let colorClass = "text-muted-foreground bg-muted";
                      let actionText = "";
                      
                      if (activity.type === 'signup') {
                        Icon = UserPlus; colorClass = "text-emerald-500 bg-emerald-500/10"; actionText = "signed up";
                      } else if (activity.type === 'payment') {
                        Icon = CreditCard; colorClass = "text-blue-500 bg-blue-500/10"; actionText = "made a payment";
                      } else if (activity.type === 'churn') {
                        Icon = ArrowDownCircle; colorClass = "text-destructive bg-destructive/10"; actionText = "canceled their subscription";
                      } else if (activity.type === 'upgrade') {
                        Icon = ArrowUpCircle; colorClass = "text-primary bg-primary/10"; actionText = "upgraded their plan";
                      }

                      return (
                        <div key={activity.id} className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-full", colorClass)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 flex justify-between items-center min-w-0">
                            <div className="flex flex-col truncate pr-2">
                              <span className="text-sm font-medium truncate">{activity.customerName}</span>
                              <span className="text-xs text-muted-foreground truncate">{actionText}</span>
                            </div>
                            <div className="flex flex-col items-end whitespace-nowrap">
                              {activity.amount && (
                                <span className="text-sm font-medium">{formatCurrency(activity.amount)}</span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(activity.occurredAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
