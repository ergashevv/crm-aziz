'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createExpense, updateExpense } from '@/app/actions/entities';
import { Plus, Edit2 } from 'lucide-react';

const EXPENSE_CATEGORIES = ['fuel', 'diesel', 'spare_parts', 'repair', 'utilization', 'base_rent', 'gai', 'driver_salary', 'worker_salary', 'dispatcher_salary', 'referral_fee', 'other'];

const formatNum = (val: string | number) => {
  const n = String(val).replace(/\D/g, '');
  if (!n) return '';
  return new Intl.NumberFormat('ru-RU').format(parseInt(n, 10));
};

export function ExpenseForm({ dict, expense }: { dict: any, expense?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(expense ? {
    category: expense.category || '',
    amountRub: String(expense.amountRub || ''),
    note: expense.note || ''
  } : {
    category: '',
    amountRub: '',
    note: ''
  });

  const [amt, setAmt] = useState(expense ? formatNum(expense.amountRub) : '');

  const handleAmtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmt(raw ? formatNum(raw) : '');
    setFormData({ ...formData, amountRub: raw });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (expense) {
        await updateExpense(expense.id, formData);
      } else {
        await createExpense(formData);
      }
      setOpen(false);
      if (!expense) {
        setFormData({ category: '', amountRub: '', note: '' });
        setAmt('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {expense ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="rounded-full px-6 py-2.5 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105">
            <Plus className="h-4 w-4 mr-2" /> {dict.add_expense}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? dict.edit_expense : dict.add_expense}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="category">{dict.category}</Label>
            <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})} required>
              <SelectTrigger>
                <SelectValue placeholder={dict.select_category} />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{dict[c] || c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            {loading ? '...' : expense ? dict.save : dict.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
