'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createWarehouseIncome, updateWarehouseIncome } from '@/app/actions/entities';
import { Plus, Edit2 } from 'lucide-react';

const INCOME_SOURCES = ['client_payment', 'external_vehicle_rental'];

export function WarehouseIncomeForm({ dict, income }: { dict: any, income?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(income || {
    source: '',
    amountRub: '',
    note: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (income) {
        await updateWarehouseIncome(income.id, formData);
      } else {
        await createWarehouseIncome(formData);
      }
      setOpen(false);
      if (!income) setFormData({ source: '', amountRub: '', note: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {income ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="rounded-full px-6 py-2.5 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> {dict.log_income}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{income ? dict.log_income.replace('+', '✎') : dict.log_income}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="source">{dict.source}</Label>
            <Select value={formData.source} onValueChange={val => setFormData({...formData, source: val})} required>
              <SelectTrigger>
                <SelectValue placeholder={dict.select_source || "Select source"} />
              </SelectTrigger>
              <SelectContent>
                {INCOME_SOURCES.map(c => (
                  <SelectItem key={c} value={c}>{dict[c] || c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amountRub">{dict.amount} (RUB)</Label>
            <Input id="amountRub" type="number" value={formData.amountRub} onChange={e => setFormData({...formData, amountRub: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">{dict.note}</Label>
            <Textarea id="note" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : income ? (dict.save || 'Save') : (dict.create || 'Create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
