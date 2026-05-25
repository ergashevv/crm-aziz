'use client';

import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { WarehouseIncomeForm } from '@/components/forms/WarehouseIncomeForm';

interface WarehouseIncomeData {
  id: number;
  recordedAt: string | Date;
  source: string;
  note: string | null;
  amountRub: number;
}

interface WarehouseIncomeTableProps {
  incomes: WarehouseIncomeData[];
  dict: any;
}

export function WarehouseIncomeTable({ incomes, dict }: WarehouseIncomeTableProps) {
  const { sortedData: sortedIncomes, sortKey, sortDirection, toggleSort } = useSortableTable(incomes);

  return (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow>
          <SortableTableHead 
            sortKey="recordedAt" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.date}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="source" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.source}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="note" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
          >
            {dict.note}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="amountRub" 
            currentSortKey={sortKey as string} 
            currentSortDirection={sortDirection} 
            onSort={toggleSort}
            className="text-right"
          >
            {dict.amount} (RUB)
          </SortableTableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedIncomes.map((inc) => (
          <TableRow key={inc.id}>
            <TableCell>{format(new Date(inc.recordedAt), 'dd.MM.yyyy')}</TableCell>
            <TableCell>
              <Badge variant={inc.source === 'external_vehicle_rental' ? 'secondary' : 'outline'}>
                {dict[inc.source as keyof typeof dict] || inc.source.replace(/_/g, ' ')}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{inc.note}</TableCell>
            <TableCell className="text-right font-medium text-green-600">
              +{inc.amountRub.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              <WarehouseIncomeForm dict={dict} income={inc as any} />
            </TableCell>
          </TableRow>
        ))}
        {sortedIncomes.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
              {dict.no_warehouse_income}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
