import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';

export function WarehouseTransactionTable({ transactions, dict }: { transactions: any[], dict: any }) {
  return (
    <Table>
      <TableHeader className="bg-slate-50/80">
        <TableRow>
          <TableHead>{dict.date || 'Дата'}</TableHead>
          <TableHead>Тип</TableHead>
          <TableHead>{dict.note || 'Заметка'}</TableHead>
          <TableHead className="text-right">Объем (m³)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell className="text-xs text-slate-500 font-medium">
              {format(new Date(tx.recordedAt), 'dd.MM.yyyy HH:mm')}
            </TableCell>
            <TableCell>
              {tx.type === 'inbound' ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-bold">
                  <ArrowDown className="w-3 h-3" /> Приход
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 font-bold">
                  <ArrowUp className="w-3 h-3" /> Расход
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-xs text-slate-600 font-medium">
              {tx.orderId ? (
                <Link href={`/orders/${tx.orderId}`} className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 w-max">
                  Заказ #{tx.orderId}
                </Link>
              ) : (
                <span className="text-slate-600">{tx.note || '-'}</span>
              )}
            </TableCell>
            <TableCell className="text-right font-extrabold text-slate-800">
              {tx.type === 'inbound' ? (
                <span className="text-emerald-600">+{tx.volumeM3}</span>
              ) : (
                <span className="text-rose-600">-{tx.volumeM3}</span>
              )}
              <span className="text-[10px] text-slate-400 ml-1">m³</span>
            </TableCell>
          </TableRow>
        ))}
        {transactions.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-slate-500 font-medium">
              Данные не найдены.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
