'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addWarehouseTransaction } from '@/app/actions/entities';
import { Plus, ArrowDown, ArrowUp } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function WarehouseTransactionForm({ dict }: { dict: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'inbound' | 'outbound'>('inbound');
  
  const [volumeM3, setVolumeM3] = useState('');
  const [note, setNote] = useState('');

  const OUTBOUND_OPTIONS = [20, 27, 30];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addWarehouseTransaction({
        type,
        volumeM3: parseInt(volumeM3),
        note
      });
      setOpen(false);
      // reset
      setType('inbound');
      setVolumeM3('');
      setNote('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full px-6 py-2.5 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> {dict.log_waste || 'Qayd qilish'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.log_waste || 'Yangi yozuv qo\'shish'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          
          <div className="space-y-3">
            <Label>Amaliyot turi</Label>
            <RadioGroup 
              value={type} 
              onValueChange={(val: 'inbound' | 'outbound') => {
                setType(val);
                setVolumeM3('');
              }} 
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inbound" id="inbound" />
                <Label htmlFor="inbound" className="flex items-center gap-1 cursor-pointer">
                  <ArrowDown className="w-4 h-4 text-emerald-500" />
                  Kiruvchi (Inbound)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outbound" id="outbound" />
                <Label htmlFor="outbound" className="flex items-center gap-1 cursor-pointer">
                  <ArrowUp className="w-4 h-4 text-rose-500" />
                  Chiquvchi (Outbound)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label htmlFor="volumeM3">Hajmi (m³)</Label>
            {type === 'outbound' ? (
              <div className="flex gap-3">
                {OUTBOUND_OPTIONS.map(opt => (
                  <Button
                    key={opt}
                    type="button"
                    variant={volumeM3 === String(opt) ? "default" : "outline"}
                    onClick={() => setVolumeM3(String(opt))}
                    className="flex-1"
                  >
                    {opt} m³
                  </Button>
                ))}
              </div>
            ) : (
              <Input 
                id="volumeM3" 
                type="number"
                min="1"
                value={volumeM3} 
                onChange={(e) => setVolumeM3(e.target.value)} 
                required 
                placeholder="Masalan: 8"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{dict.note || 'Izoh'}</Label>
            <Textarea 
              id="note" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="Qo'shimcha ma'lumotlar..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !volumeM3}>
            {loading ? '...' : (dict.create || 'Saqlash')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
