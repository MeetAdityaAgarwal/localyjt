import React from 'react';
import { trpc } from '../../lib/trpc';
import { format } from 'date-fns';
import { 
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { LineChart } from '../../components/ui/charts/LineChart';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../hooks/useAuth';

export function ManagerDashboard() {
  const { user } = useAuth();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (user?.historyAccess || 30));

  const { data: riders } = trpc.user.getRiders.useQuery();
  const { data: pendingCollections } = trpc.collection.getPending.useQuery();
  
  const approveCollection = trpc.collection.approve.useMutation();

  if (!riders || !pendingCollections) {
    return <div>Loading...</div>;
  }

  const riderColumns = [
    { header: 'Rider', accessorKey: 'email' as const },
    { header: 'Collections Today', accessorKey: 'collectionsToday' as const },
    { header: 'Total Amount', accessorKey: 'totalAmount' as const,
      cell: (value: number) => `$${value.toFixed(2)}` },
    { header: 'Approval Rate', accessorKey: 'approvalRate' as const,
      cell: (value: number) => `${(value * 100).toFixed(1)}%` },
  ];

  const collectionColumns = [
    { header: 'Rider', accessorKey: 'rider.email' as const },
    { header: 'Customer', accessorKey: 'customer.name' as const },
    { header: 'Amount', accessorKey: 'amount' as const,
      cell: (value: number) => `$${value.toFixed(2)}` },
    { header: 'Date', accessorKey: 'createdAt' as const,
      cell: (value: Date) => format(new Date(value), 'MMM d, yyyy') },
    { header: 'Actions', accessorKey: 'id' as const,
      cell: (value: string) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => approveCollection.mutate({ collectionId: value })}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {/* Implement reject */}}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manager Dashboard</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Riders"
          value={riders.length}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="Pending Collections"
          value={pendingCollections.length}
          icon={<CreditCard className="h-6 w-6" />}
        />
        <StatCard
          title="Total Collected Today"
          value={`$${pendingCollections.reduce((sum, col) => sum + col.amount, 0).toFixed(2)}`}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* Pending Collections */}
      <div className="bg-white p-6 rounded-lg shadow">
        <DataTable
          title="Pending Collections"
          data={pendingCollections}
          columns={collectionColumns}
          allowExport={true}
        />
      </div>

      {/* Rider Performance */}
      <div className="bg-white p-6 rounded-lg shadow">
        <DataTable
          title="Rider Performance"
          data={riders}
          columns={riderColumns}
          allowExport={true}
        />
      </div>
    </div>
  );
}