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
  const type = 'outbound';
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
          <Plus className="h-4 w-4 mr-2" /> {dict.log_waste || 'Журнал отходов'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.log_waste || 'Добавить новую запись'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          


          <div className="space-y-3">
            <Label htmlFor="volumeM3">Объем (m³)</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{dict.note || 'Заметка'}</Label>
            <Textarea 
              id="note" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="Дополнительная информация..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !volumeM3}>
            {loading ? '...' : (dict.create || 'Сохранить')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
