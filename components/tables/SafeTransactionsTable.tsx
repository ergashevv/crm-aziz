'use client';

import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSortableTable } from '@/hooks/use-sortable-table';

interface SafeTransactionData {
  transaction: {
    id: string;
    recordedAt: string | Date;
    type: string;
    note: string | null;
    amountRub: number;
  };
  operator: {
    name: string | null;
  } | null;
}

interface SafeTransactionsTableProps {
  transactions: SafeTransactionData[];
  dict: any;
}

export function SafeTransactionsTable({ transactions, dict }: SafeTransactionsTableProps) {
  const { items: sortedTransactions, requestSort, sortConfig } = useSortableTable({
    items: transactions,
    initialSort: { key: 'date', direction: 'desc' },
  });

  return (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow>
          <SortableTableHead 
            sortKey="date" 
            currentSort={sortConfig} 
            onSort={requestSort}
            getValue={(t: SafeTransactionData) => new Date(t.transaction.recordedAt).getTime()}
          >
            {dict.date}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="type" 
            currentSort={sortConfig} 
            onSort={requestSort}
            getValue={(t: SafeTransactionData) => t.transaction.type}
          >
            {dict.transaction_type || 'Тип'}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="note" 
            currentSort={sortConfig} 
            onSort={requestSort}
            getValue={(t: SafeTransactionData) => t.transaction.note || ''}
          >
            {dict.note}
          </SortableTableHead>
          <SortableTableHead 
            sortKey="operator" 
            currentSort={sortConfig} 
            onSort={requestSort}
            getValue={(t: SafeTransactionData) => t.operator?.name || ''}
          >
            Оператор
          </SortableTableHead>
          <SortableTableHead 
            sortKey="amount" 
            currentSort={sortConfig} 
            onSort={requestSort}
            className="text-right"
            getValue={(t: SafeTransactionData) => t.transaction.amountRub}
          >
            {dict.amount} (RUB)
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTransactions.map((t) => (
          <TableRow key={t.transaction.id}>
            <TableCell>{format(new Date(t.transaction.recordedAt), 'dd.MM.yyyy')}</TableCell>
            <TableCell>
              <Badge variant={t.transaction.type === 'income' ? 'outline' : 'secondary'} className={t.transaction.type === 'income' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}>
                {t.transaction.type === 'income' ? (dict.safe_income || 'Приход') : (dict.safe_expense || 'Расход')}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{t.transaction.note || '-'}</TableCell>
            <TableCell>{t.operator?.name || 'Система'}</TableCell>
            <TableCell className={`text-right font-medium ${t.transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {t.transaction.type === 'income' ? '+' : '-'}{t.transaction.amountRub.toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
        {sortedTransactions.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
              {dict.no_safe_transactions || 'Транзакций в сейфе не найдено.'}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
