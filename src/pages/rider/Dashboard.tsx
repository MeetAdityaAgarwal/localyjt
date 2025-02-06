import { trpc } from '../../lib/trpc';
import { format } from 'date-fns';
import {
  CreditCard,
  Users,
  CheckCircle,
  Clock
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/button';
// import { useAuth } from '../../hooks/useAuth';

export function RiderDashboard() {
  // const { user } = useAuth();
  // const startDate = new Date();
  // startDate.setDate(startDate.getDate() - (user?.collectionAccess || 7));
  //
  const startDate = new Date();
  const endDate = new Date();
  startDate.setDate(startDate.getDate() - 300); // 7 days from today

  const { data: collection, isLoading: isCollectionLoading } = trpc.collection.getCollection.useQuery();
  const { data: customer, isLoading: isCustomerLoading } = trpc.customer.getCustomer.useQuery();

  if (isCollectionLoading || isCustomerLoading) {
    return <div>Loading...</div>;
  }
  // Create safe arrays for table data

  const collections = Array.isArray(collection) ? collection : collection ? [collection] : [];
  const customers = Array.isArray(customer) ? customer : customer ? [customer] : [];

  if (!collection) {
    return <div>collection...</div>;
  }

  if (!customer) {
    return <div>customer...</div>;
  }
  console.log("FETCHED COLLECTIONS: ", collections);

  const customerColumns = [
    { header: 'Customer', accessorKey: 'name' as const },
    {
      header: 'Balance', accessorKey: 'balance' as const,
      cell: (value: number) => `$${value.toFixed(2)}`
    },
    {
      header: 'Last Payment', accessorKey: 'lastPayment' as const,
      cell: (value: Date) => value ? format(new Date(value), 'MMM d, yyyy') : 'Never'
    },
    {
      header: 'Actions', accessorKey: 'id' as const,
      cell: (value: string) => (
        <Button
          size="sm"
          onClick={() => {/* Implement collection modal */ }}
        >
          Collect
        </Button>
      ),
    },
  ];

  const collectionColumns = [
    {
      header: 'Customer', accessorKey: 'customer',
      cell: (row: { customer?: { name?: string } }) => row.customer?.name || 'N/A'
    },
    {
      header: 'Amount', accessorKey: 'amount' as const,
      cell: (value: number) => `$${value.toFixed(2)}`
    },
    {
      header: 'Status', accessorKey: 'status' as const,
      cell: (value: string) => (
        <div className="flex items-center">
          {value === 'APPROVED' ? (
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <Clock className="w-4 h-4 text-yellow-500 mr-1" />
          )}
          {value}
        </div>
      ),
    },
    {
      header: 'Date', accessorKey: 'createdAt' as const,
      cell: (value: Date) => format(new Date(value), 'MMM d, yyyy')
    },
  ];

  const approvedCollections = collections.filter(c => c.status === 'APPROVED');
  const approvalRate = collections.length > 0
    ? approvedCollections.length / collections.length
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rider Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Customers"
          value={customers.length}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="Collections Today"
          value={collections.filter(c =>
            format(new Date(c.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          ).length}
          icon={<CreditCard className="h-6 w-6" />}
        />
        <StatCard
          title="Approval Rate"
          value={`${(approvalRate * 100).toFixed(1)}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          trend={{
            value: 5,
            isPositive: true
          }}
        />
      </div>

      {/* Assigned Customers */}
      <div className="bg-white p-6 rounded-lg shadow">
        <DataTable
          title="Assigned Customers"
          data={customers}
          columns={customerColumns}
        />
      </div>

      Recent Collections
      <div className="bg-white p-6 rounded-lg shadow">
        <DataTable
          title="Recent Collections"
          data={collections}
          columns={collectionColumns}
          allowExport={true}
        />
      </div>
    </div>
  );
}
