import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Button } from './button';
import { Download } from 'lucide-react';
import { exportData, ExportFormat } from '../../lib/export';

interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (value: any) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  allowExport?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  title,
  allowExport = false,
}: DataTableProps<T>) {
  const handleExport = async (format: ExportFormat) => {
    const exportDataCreated = data.map(row => {
      const exportRow: any = {};
      columns.forEach(column => {
        exportRow[column.header] = row[column.accessorKey];
      });
      return exportRow;
    });

    await exportData(exportDataCreated, format, title || 'data');
  };

  return (
    <div className="w-full">
      {(title || allowExport) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {allowExport && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('xlsx')}
              >
                <Download className="w-4 h-4 mr-2" />
                XLSX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead key={String(column.accessorKey)}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {columns.map(column => (
                  <TableCell key={String(column.accessorKey)}>
                    {column.accessorKey === 'customer'
                      ? (row as any).customer?.name || 'N/A'
                      : column.cell
                        ? column.cell(row[column.accessorKey])
                        : String(row[column.accessorKey])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
