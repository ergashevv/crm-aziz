'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { createOrder, updateOrder } from '@/app/actions/entities';
import { Plus, Edit2, MapPin, ExternalLink, Phone, User } from 'lucide-react';
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

const CONTAINER_SIZES = [8, 20, 27];
const RENTAL_PRESETS = ['2 часа', '24 часа', '1 день', '1 неделя', '1 месяц'];

interface Client { id: number; name: string; phone: string; address: string; mapUrl?: string | null; }
interface Dispatcher { id: number; name: string; phone: string; }
interface Driver { id: number; name: string; vehiclePlate: string; }

export function OrderForm({
  dict,
  order,
  clients,
  drivers,
  dispatchers,
}: {
  dict: any;
  order?: any;
  clients: Client[];
  drivers: Driver[];
  dispatchers: Dispatcher[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const defaultDateTime = formatLocalDate(new Date());

  const getInitialFormData = () => {
    if (order) {
      const client = clients.find(c => c.id === order.clientId);
      const dispatcher = dispatchers.find(d => d.id === order.dispatcherId);
      return {
        clientId: String(order.clientId || ''),
        clientName: client?.name || '',
        clientPhone: client?.phone || '',
        clientAddress: client?.address || '',
        clientMapUrl: client?.mapUrl || '',
        driverId: String(order.driverId || ''),
        operatorNote: order.operatorNote || '',
        address: order.address || '',
        mapUrl: order.mapUrl || '',
        scheduledAt: formatLocalDate(order.scheduledAt),
        containerSizeM3: String(order.containerSizeM3 || '8'),
        containerNumber: order.containerNumber || '',
        rentalDuration: order.rentalDuration || '1 день',
        paymentAmount: String(order.paymentAmount || ''),
        paymentType: order.paymentType || 'cash',
        status: order.status || 'new',
        paymentStatus: order.paymentStatus || 'pending',
        clientCategory: order.clientCategory || 'direct',
        dispatcherId: String(order.dispatcherId || ''),
        dispatcherName: dispatcher?.name || '',
        dispatcherPhone: dispatcher?.phone || '',
        dispatcherFee: String(order.dispatcherFee || ''),
        referralName: order.referralName || '',
        referralPercent: String(order.referralPercent || ''),
      };
    }
    return {
      clientId: '',
      clientName: '',
      clientPhone: '',
      clientAddress: '',
      clientMapUrl: '',
      driverId: '',
      operatorNote: '',
      address: '',
      mapUrl: '',
      scheduledAt: defaultDateTime,
      containerSizeM3: '8',
      containerNumber: '',
      rentalDuration: '1 день',
      paymentAmount: '',
      paymentType: 'cash',
      status: 'new',
      paymentStatus: 'pending',
      clientCategory: 'direct',
      dispatcherId: '',
      dispatcherName: '',
      dispatcherPhone: '',
      dispatcherFee: '',
      referralName: '',
      referralPercent: '',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [displayAmount, setDisplayAmount] = useState(order ? formatNumberWithSpaces(order.paymentAmount) : '');
  const [displayDispatcherFee, setDisplayDispatcherFee] = useState(order ? formatNumberWithSpaces(order.dispatcherFee) : '');
  const [customRental, setCustomRental] = useState(!RENTAL_PRESETS.includes(order?.rentalDuration || '1 день'));

  const set = (key: string, val: string) => setFormData(p => ({ ...p, [key]: val }));

  const handleClientSelect = (clientId: string) => {
    if (clientId === '' || clientId === 'new') {
      set('clientId', clientId);
      set('clientName', '');
      set('clientPhone', '');
      set('clientAddress', '');
      set('clientMapUrl', '');
    } else {
      const client = clients.find(c => String(c.id) === clientId);
      if (client) {
        setFormData(p => ({
          ...p,
          clientId,
          clientName: client.name,
          clientPhone: client.phone,
          clientAddress: client.address,
          clientMapUrl: client.mapUrl || '',
        }));
      }
    }
  };

  const handleDispatcherSelect = (dispId: string) => {
    if (dispId === '' || dispId === 'new') {
      set('dispatcherId', dispId);
      set('dispatcherName', '');
      set('dispatcherPhone', '');
    } else {
      const disp = dispatchers.find(d => String(d.id) === dispId);
      if (disp) {
        setFormData(p => ({
          ...p,
          dispatcherId: dispId,
          dispatcherName: disp.name,
          dispatcherPhone: disp.phone,
        }));
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setDisplayAmount(raw ? formatNumberWithSpaces(raw) : '');
    set('paymentAmount', raw);
  };

  const handleDispatcherFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setDisplayDispatcherFee(raw ? formatNumberWithSpaces(raw) : '');
    set('dispatcherFee', raw);
  };

  const handleRentalChange = (val: string) => {
    if (val === '__custom__') {
      setCustomRental(true);
      set('rentalDuration', '');
    } else {
      setCustomRental(false);
      set('rentalDuration', val);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setError(null);
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
        const fresh = getInitialFormData();
        setFormData(fresh);
        setDisplayAmount('');
        setDisplayDispatcherFee('');
        setCustomRental(false);
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = clients.map(c => ({ value: String(c.id), label: c.name, sub: c.phone }));
  const dispatcherOptions = dispatchers.map(d => ({ value: String(d.id), label: d.name, sub: d.phone }));
  const driverOptions = [
    { value: 'none', label: dict.unassigned || 'Не назначен' },
    ...drivers.map(d => ({ value: String(d.id), label: d.name, sub: d.vehiclePlate })),
  ];

  const isDispatcher = formData.clientCategory === 'dispatcher';

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

      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border-slate-200/80 shadow-2xl bg-white/98 backdrop-blur-xl p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-extrabold text-slate-900">
            {order ? '✎ Редактировать заказ' : dict.new_order}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-5">
          {error && (
            <div className="p-3 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl">
              {error}
            </div>
          )}

          {/* === CLIENT CATEGORY TOGGLE === */}
          <div>
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Тип клиента</Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              {(['direct', 'dispatcher'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => set('clientCategory', cat)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                    formData.clientCategory === cat
                      ? 'bg-white text-primary shadow-sm ring-1 ring-primary/20'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {cat === 'direct' ? '👤 Прямой клиент' : '📞 Диспетчер'}
                </button>
              ))}
            </div>
          </div>

          {/* === CLIENT SECTION === */}
          <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Клиент
            </p>

            <div>
              <Label className="text-xs mb-1.5 block">Выбрать существующего</Label>
              <SearchableSelect
                options={clientOptions}
                value={formData.clientId === 'new' ? '' : formData.clientId}
                onChange={handleClientSelect}
                placeholder="Поиск клиента..."
                addNewLabel="+ Новый клиент"
                onAddNew={() => handleClientSelect('new')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Имя *</Label>
                <Input
                  value={formData.clientName}
                  onChange={e => set('clientName', e.target.value)}
                  placeholder="Имя клиента"
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Телефон *
                </Label>
                <Input
                  value={formData.clientPhone}
                  onChange={e => set('clientPhone', e.target.value)}
                  placeholder="+998 __ ___ __ __"
                  required
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* === DISPATCHER SECTION (only if category = dispatcher) === */}
          {isDispatcher && (
            <div className="space-y-3 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Диспетчер
              </p>

              <div>
                <Label className="text-xs mb-1.5 block">Выбрать диспетчера</Label>
                <SearchableSelect
                  options={dispatcherOptions}
                  value={formData.dispatcherId === 'new' ? '' : formData.dispatcherId}
                  onChange={handleDispatcherSelect}
                  placeholder="Поиск диспетчера..."
                  addNewLabel="+ Новый диспетчер"
                  onAddNew={() => handleDispatcherSelect('new')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Имя диспетчера</Label>
                  <Input
                    value={formData.dispatcherName}
                    onChange={e => set('dispatcherName', e.target.value)}
                    placeholder="Имя"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Телефон диспетчера</Label>
                  <Input
                    value={formData.dispatcherPhone}
                    onChange={e => set('dispatcherPhone', e.target.value)}
                    placeholder="+998 __ ___ __ __"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block font-semibold text-indigo-700">
                  💰 Услуга диспетчера (сумма)
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={displayDispatcherFee}
                    onChange={handleDispatcherFeeChange}
                    className="rounded-xl font-bold pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">RUB</span>
                </div>
              </div>
            </div>
          )}

          {/* === ADDRESS + MAP === */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label className="flex items-center gap-1.5 text-xs mb-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-500" /> {dict.address}
              </Label>
              <Input value={formData.address} onChange={e => set('address', e.target.value)} placeholder="Адрес доставки" required className="rounded-xl" />
            </div>
            <div>
              <Label className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                  Ссылка на карту (Google Maps / Yandex)
                </span>
                {formData.mapUrl && (
                  <a href={formData.mapUrl} target="_blank" rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 text-[10px] font-semibold flex items-center gap-1"
                    onClick={e => e.stopPropagation()}>
                    <MapPin className="h-3 w-3" /> Открыть
                  </a>
                )}
              </Label>
              <Input
                value={formData.mapUrl}
                onChange={e => set('mapUrl', e.target.value)}
                placeholder="https://maps.google.com/... или https://yandex.ru/maps/..."
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          {/* === DATE + CONTAINER === */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">
                {dict.scheduled_date} <span className="text-primary font-bold">(с временем)</span>
              </Label>
              <Input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={e => set('scheduledAt', e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">{dict.container_size} (m³)</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {CONTAINER_SIZES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('containerSizeM3', String(s))}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                      formData.containerSizeM3 === String(s)
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'
                    }`}
                  >
                    {s}³
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* === CONTAINER NUMBER + RENTAL DURATION === */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Номер контейнера</Label>
              <Input
                value={formData.containerNumber}
                onChange={e => set('containerNumber', e.target.value)}
                placeholder="Напр. КТ-001"
                className="rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">{dict.rental_duration}</Label>
              {!customRental ? (
                <Select value={formData.rentalDuration} onValueChange={handleRentalChange}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RENTAL_PRESETS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                    <SelectItem value="__custom__">✏️ Другое...</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-1.5">
                  <Input
                    value={formData.rentalDuration}
                    onChange={e => set('rentalDuration', e.target.value)}
                    placeholder="напр. 3 дня, 6 часов"
                    className="rounded-xl"
                    required
                    autoFocus
                  />
                  <Button type="button" variant="outline" size="icon" className="rounded-xl flex-shrink-0"
                    onClick={() => { setCustomRental(false); set('rentalDuration', '1 день'); }}>
                    ×
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* === PAYMENT === */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block flex items-center justify-between">
                <span>{dict.amount} (RUB)</span>
                {displayAmount && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                    {displayAmount}
                  </span>
                )}
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={displayAmount}
                onChange={handleAmountChange}
                className="rounded-xl font-bold text-slate-800"
                required
              />
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">{dict.payment_type || 'Тип оплаты'}</Label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { val: 'cash', label: '💵 Нал.' },
                  { val: 'online', label: '📱 Онлайн' },
                  { val: 'card', label: '💳 Безнал' },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set('paymentType', val)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.paymentType === val
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* === DRIVER === */}
          <div>
            <Label className="text-xs mb-1.5 block">{dict.driver} ({dict.optional || 'необязательно'})</Label>
            <SearchableSelect
              options={driverOptions}
              value={formData.driverId || 'none'}
              onChange={val => set('driverId', val === 'none' ? '' : val)}
              placeholder={dict.select_driver || 'Выбрать водителя...'}
            />
          </div>

          {/* === STATUS (edit only) === */}
          {order && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">{dict.status}</Label>
                <Select value={formData.status} onValueChange={val => set('status', val)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['new','assigned','in_progress','container_placed','picked_up','completed'].map(s => (
                      <SelectItem key={s} value={s}>{dict[s] || s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">{dict.payment_status}</Label>
                <Select value={formData.paymentStatus} onValueChange={val => set('paymentStatus', val)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['pending','received','entered'].map(s => (
                      <SelectItem key={s} value={s}>{dict[s] || s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* === NOTES === */}
          <div>
            <Label className="text-xs mb-1.5 block">{dict.operator_note}</Label>
            <Textarea value={formData.operatorNote} onChange={e => set('operatorNote', e.target.value)} className="rounded-xl resize-none" rows={2} />
          </div>

          <Button type="submit" className="w-full rounded-2xl h-11 text-base font-bold" disabled={loading}>
            {loading ? '...' : order ? (dict.save || 'Сохранить') : (dict.create || 'Создать')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
