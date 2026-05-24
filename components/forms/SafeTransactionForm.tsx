'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createSafeTransaction } from '@/app/actions/entities';
import { Plus, Minus } from 'lucide-react';

const formatNum = (val: string | number) => {
  const n = String(val).replace(/\D/g, '');
  if (!n) return '';
  return new Intl.NumberFormat('ru-RU').format(parseInt(n, 10));
};

export function SafeTransactionForm({ dict, type }: { dict: any, type: 'income' | 'expense' }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amountRub: '',
    note: ''
  });

  const [amt, setAmt] = useState('');

  const handleAmtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmt(raw ? formatNum(raw) : '');
    setFormData({ ...formData, amountRub: raw });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createSafeTransaction({
        type,
        amountRub: parseInt(formData.amountRub) || 0,
        note: formData.note
      });
      setOpen(false);
      setFormData({ amountRub: '', note: '' });
      setAmt('');
    } finally {
      setLoading(false);
    }
  };

  const isIncome = type === 'income';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className={`rounded-full px-6 py-2.5 font-semibold shadow-lg transition-all hover:scale-105 ${
            isIncome 
              ? "shadow-emerald-500/30 bg-emerald-600 hover:bg-emerald-700" 
              : "shadow-rose-500/30 bg-rose-600 hover:bg-rose-700"
          }`}
        >
          {isIncome ? <Plus className="h-4 w-4 mr-2" /> : <Minus className="h-4 w-4 mr-2" />} 
          {isIncome ? dict.log_safe_income : dict.log_safe_expense}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isIncome ? dict.log_safe_income : dict.log_safe_expense}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="amountRub">{dict.amount} (RUB)</Label>
            <Input 
              id="amountRub" 
              type="text" 
              inputMode="numeric"
              value={amt} 
              onChange={handleAmtChange} 
              required 
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">{dict.note}</Label>
            <Textarea id="note" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : (dict.create || 'Create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
