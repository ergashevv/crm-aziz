'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateOrderPayment } from '@/app/actions/order';
import { CheckCircle2 } from 'lucide-react';

export function ConfirmPaymentButton({ orderId, currentStatus }: { orderId: number, currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  if (currentStatus !== 'received') return null;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    try {
      await updateOrderPayment(orderId, 'entered');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      size="sm" 
      onClick={handleConfirm} 
      disabled={loading}
      className="h-8 gap-1.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 shadow-none border border-emerald-200 ml-2"
    >
      <CheckCircle2 className="h-4 w-4" />
      {loading ? '...' : 'Подтвердить'}
    </Button>
  );
}
