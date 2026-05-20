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

export function OrderForm({ dict, order, clients, drivers }: { dict: any, order?: any, clients: any[], drivers: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultDate = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState(order ? {
    ...order,
    scheduledAt: new Date(order.scheduledAt).toISOString().split('T')[0],
  } : {
    clientId: '',
    driverId: '',
    operatorNote: '',
    address: '',
    scheduledAt: defaultDate,
    containerSizeM3: '8',
    rentalDuration: '1_day',
    paymentAmount: '',
    paymentType: 'cash',
    status: 'new',
    paymentStatus: 'pending',
    referralName: '',
    referralPercent: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (order) {
        await updateOrder(order.id, formData);
      } else {
        await createOrder(formData);
      }
      setOpen(false);
      if (!order) {
        setFormData({
          clientId: '', driverId: '', operatorNote: '', address: '',
          scheduledAt: defaultDate, containerSizeM3: '8', rentalDuration: '1_day',
          paymentAmount: '', paymentType: 'cash', status: 'new', paymentStatus: 'pending',
          referralName: '', referralPercent: ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? dict.new_order.replace('+', '✎') : dict.new_order}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
              <Label>{dict.scheduled_date}</Label>
              <Input type="date" value={formData.scheduledAt} onChange={e => setFormData({...formData, scheduledAt: e.target.value})} required />
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
              <Label>{dict.amount} (RUB)</Label>
              <Input type="number" value={formData.paymentAmount} onChange={e => setFormData({...formData, paymentAmount: e.target.value})} required />
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
