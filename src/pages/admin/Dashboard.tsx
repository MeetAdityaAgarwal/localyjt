import React from 'react';
import { trpc } from '../../lib/trpc';
import { format } from 'date-fns';
import {
  Users,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { LineChart } from '../../components/ui/charts/LineChart';
import { BarChart } from '../../components/ui/charts/BarChart';
import { DataTable } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';

let startDate = new Date(Date.now() - 300 * 24 * 60 * 60 * 1000)
let endDate = new Date()


export function AdminDashboard() {
  console.log('firststartDate:', startDate.toISOString());
  console.log('firstendDate:', endDate);

  const { data: customerAnalytics, isLoading: isCustomerAnalyticsLoading } = trpc.analytics.getCustomerAnalytics.useQuery();

  const { data: cashflowAnalytics, isLoading: isCashflowAnalyticsLoading } = trpc.analytics.getCashflowAnalytics.useQuery();

  if (!isCustomerAnalyticsLoading || !isCashflowAnalyticsLoading) {
    return <div>Loading...</div>;
  }

  if (!customerAnalytics || !cashflowAnalytics) {
    return <div>NoData...</div>;
  }

  const customerColumns = [
    { header: 'Customer', accessorKey: 'name' as const },
    {
      header: 'Balance', accessorKey: 'balance' as const,
      cell: (value: number) => `$${value.toFixed(2)}`
    },
    {
      header: 'Risk Level', accessorKey: 'riskLevel' as const,
      cell: (value: any) => <RiskBadge risk={value} />
    },
    { header: 'Credit Score', accessorKey: 'creditScore' as const },
    { header: 'Days Since Payment', accessorKey: 'daysSinceLastPayment' as const },
    { header: 'Overdue Invoices', accessorKey: 'overdueInvoices' as const },
  ];

  const dailyCashflowData = Object.entries(cashflowAnalytics.dailyCashflow).map(
    ([date, amount]) => ({
      date: format(new Date(date), 'MMM d'),
      amount,
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Outstanding"
          value={`$${customerAnalytics.summary.totalOutstanding.toFixed(2)}`}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatCard
          title="High Risk Customers"
          value={customerAnalytics.summary.highRiskCustomers}
          icon={<AlertTriangle className="h-6 w-6" />}
          trend={{
            value: 12,
            isPositive: false
          }}
        />
        <StatCard
          title="Average Collection Cycle"
          value={`${Math.round(cashflowAnalytics.averageCollectionCycle)} days`}
          icon={<Clock className="h-6 w-6" />}
        />
      </div>

      {/* Cashflow Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <LineChart
          title="Daily Cashflow"
          data={dailyCashflowData}
          xKey="date"
          yKey="amount"
          height={300}
        />
      </div>

      {/* Balance Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <BarChart
          title="Current Balance Distribution"
          data={[
            { type: 'With Riders', amount: cashflowAnalytics.balances.withRiders },
            { type: 'With Managers', amount: cashflowAnalytics.balances.withManagers },
          ]}
          xKey="type"
          yKey="amount"
          height={250}
        />
      </div>

      {/* High Risk Customers */}
      <div className="bg-white p-6 rounded-lg shadow">
        <DataTable
          title="High Risk Customers"
          data={customerAnalytics.customers.filter(c =>
            c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL'
          )}
          columns={customerColumns}
          allowExport={true}
        />
      </div>
    </div>
  );
}
