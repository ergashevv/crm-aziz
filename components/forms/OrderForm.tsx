'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createOrder, updateOrder } from '@/app/actions/entities';
import { Plus, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formatLocalDate = (dateInput: any) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatNumberWithSpaces = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = String(val).replace(/\D/g, '');
  if (!numStr) return '';
  return new Intl.NumberFormat('ru-RU').format(parseInt(numStr, 10));
};

export function OrderForm({ dict, order, clients, drivers }: { dict: any, order?: any, clients: any[], drivers: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isUz = dict.new_order?.includes('Yangi');
  const defaultDateTime = formatLocalDate(new Date());

  const [formData, setFormData] = useState(order ? {
    ...order,
    scheduledAt: formatLocalDate(order.scheduledAt),
  } : {
    clientId: '',
    driverId: '',
    operatorNote: '',
    address: '',
    scheduledAt: defaultDateTime,
    containerSizeM3: '8',
    rentalDuration: '1_day',
    paymentAmount: '',
    paymentType: 'cash',
    status: 'new',
    paymentStatus: 'pending',
    referralName: '',
    referralPercent: ''
  });

  const [displayAmount, setDisplayAmount] = useState(
    order ? formatNumberWithSpaces(order.paymentAmount) : ''
  );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setError(null);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setDisplayAmount('');
      setFormData({ ...formData, paymentAmount: '' });
    } else {
      const formatted = formatNumberWithSpaces(rawValue);
      setDisplayAmount(formatted);
      setFormData({ ...formData, paymentAmount: rawValue });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let res;
      if (order) {
        res = await updateOrder(order.id, formData);
      } else {
        res = await createOrder(formData);
      }

      if (res && !res.success) {
        setError(res.error);
        return;
      }

      setOpen(false);
      router.refresh();
      
      if (!order) {
        setFormData({
          clientId: '', driverId: '', operatorNote: '', address: '',
          scheduledAt: defaultDateTime, containerSizeM3: '8', rentalDuration: '1_day',
          paymentAmount: '', paymentType: 'cash', status: 'new', paymentStatus: 'pending',
          referralName: '', referralPercent: ''
        });
        setDisplayAmount('');
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {order ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="rounded-full px-6 py-2.5 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105">
            <Plus className="h-4 w-4 mr-2" /> {dict.new_order}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-slate-200/80 shadow-2xl bg-white/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{order ? dict.new_order.replace('+', '✎') : dict.new_order}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="p-3 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{dict.client}</Label>
              <Select value={formData.clientId.toString()} onValueChange={val => setFormData({...formData, clientId: val})} required>
                <SelectTrigger><SelectValue placeholder={dict.select_client || "Select client"} /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{dict.driver} ({dict.optional || "Optional"})</Label>
              <Select value={formData.driverId?.toString() || 'none'} onValueChange={val => setFormData({...formData, driverId: val === 'none' ? '' : val})}>
                <SelectTrigger><SelectValue placeholder={dict.select_driver || "Select driver"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{dict.unassigned || "Unassigned"}</SelectItem>
                  {drivers.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>{dict.address}</Label>
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{dict.scheduled_date}</span>
                <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {isUz ? "Sana va Vaqt" : "Дата и Время"}
                </span>
              </Label>
              <Input 
                type="datetime-local" 
                value={formData.scheduledAt} 
                onChange={e => setFormData({...formData, scheduledAt: e.target.value})} 
                className="transition-all duration-200 focus:border-primary/80 focus:ring-1 focus:ring-primary/80"
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label>{dict.container_size} (m³)</Label>
              <Input type="number" value={formData.containerSizeM3} onChange={e => setFormData({...formData, containerSizeM3: e.target.value})} required />
            </div>

            <div className="space-y-2">
              <Label>{dict.rental_duration}</Label>
              <Select value={formData.rentalDuration} onValueChange={val => setFormData({...formData, rentalDuration: val})} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_day">{dict['1_day'] || '1 Day'}</SelectItem>
                  <SelectItem value="1_week">{dict['1_week'] || '1 Week'}</SelectItem>
                  <SelectItem value="1_month">{dict['1_month'] || '1 Month'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{dict.amount} (RUB)</span>
                {displayAmount && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    {displayAmount} RUB
                  </span>
                )}
              </Label>
              <Input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9 ]*"
                placeholder="0"
                value={displayAmount} 
                onChange={handleAmountChange} 
                className="transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>{dict.payment_type || "Payment Type"}</Label>
              <Select value={formData.paymentType} onValueChange={val => setFormData({...formData, paymentType: val})} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{dict.cash || 'Cash'}</SelectItem>
                  <SelectItem value="card">{dict.card || 'Card'}</SelectItem>
                  <SelectItem value="online">{dict.online || 'Online'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {order && (
               <div className="space-y-2">
                 <Label>{dict.status}</Label>
                 <Select value={formData.status} onValueChange={val => setFormData({...formData, status: val})}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     {['new', 'assigned', 'in_progress', 'container_placed', 'picked_up', 'completed'].map(s => (
                       <SelectItem key={s} value={s}>{dict[s] || s}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
            )}
            
            {order && (
               <div className="space-y-2">
                 <Label>{dict.payment_status}</Label>
                 <Select value={formData.paymentStatus} onValueChange={val => setFormData({...formData, paymentStatus: val})}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     {['pending', 'received', 'entered'].map(s => (
                       <SelectItem key={s} value={s}>{dict[s] || s}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
            )}
            
            <div className="space-y-2 col-span-2">
              <Label>{dict.operator_note}</Label>
              <Textarea value={formData.operatorNote} onChange={e => setFormData({...formData, operatorNote: e.target.value})} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : order ? (dict.save || 'Save') : (dict.create || 'Create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
