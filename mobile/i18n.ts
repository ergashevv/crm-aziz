export type Locale = 'uz' | 'ru';

const translations = {
  uz: {
    appTitle: 'Haydovchi',
    appSub: 'Buyurtmalarni boshqarish',
    login: 'Login',
    password: 'Parol',
    signIn: 'Kirish',
    settings: 'Sozlamalar',
    serverIp: 'Server manzili',
    port: 'Port',
    portPlaceholder: "Bo'sh yoki 3000",
    save: 'Saqlash',
    language: 'Til',
    enterCredentials: 'Login va parolni kiriting',
    loginError: 'Kirishda xatolik',
    connectionError: "Serverga ulanib bo'lmadi",
    saveSettingsError: 'Sozlamalarni saqlashda xatolik',
    understood: 'Tushunarli',
    hello: 'Salom',
    active: 'Faol',
    tabToday: 'Bugun',
    history: 'Tarix',
    calendar: 'Jadval',
    nextTask: 'Hozir bajarish',
    doNow: 'Boshlash',
    openOrder: 'Batafsil',
    otherOrders: 'Keyingi buyurtmalar',
    stepOf: 'Qadam',
    stepAccept: 'Qabul',
    stepOnWay: 'Yo\'lda',
    stepContainer: 'Konteyner',
    stepPayment: 'To\'lov',
    whatToDo: 'Nima qilish kerak:',
    waitingPayment: 'Mijozdan to\'lovni oling',
    queueNext: 'Keyingi',
    tapCardHint: 'Batafsil uchun bosing',
    btnAccept: 'QABUL QILDIM',
    btnStart: 'YO\'LGA CHIQDIM',
    btnDrop: 'KONTEYNERNI TUSHIRDIM',
    btnPickup: 'KONTEYNERNI OLDIM',
    btnPayCash: 'NAQD OLDIM',
    btnPayCard: 'KARTA OLDIM',
    btnPayOnline: 'ONLAYN OLDIM',
    btnComplete: 'YAKUNLASH',
    paidBeznal: 'To\'langan (Beznal)',
    updating: 'Saqlanmoqda...',
    sessionExpired: 'Sessiya tugadi',
    sessionExpiredMessage: 'Ma\'lumotlar yangilandi. Qayta kiring (login: driver, parol: driver123).',
    loadErrorRetry: 'Buyurtmalarni yuklab bo\'lmadi. Internetni tekshiring yoki qayta kiring.',
    allDone: 'Hammasi tayyor!',
    allDoneSub: 'Yangi buyurtma tushganda shu yerda ko\'rinadi',
    showDetails: 'Batafsil ma\'lumot',
    hideDetails: 'Yashirish',
    callClient: 'Mijozga qo\'ng\'iroq',
    all: 'Barchasi',
    noOrders: "Buyurtmalar yo'q",
    noOrdersSub: 'Hozircha buyurtma topilmadi',
    noOrdersOnDate: 'Bu kunda buyurtma yo\'q',
    today: 'Bugun',
    tomorrow: 'Ertaga',
    order: 'Buyurtma',
    status: 'Holat',
    client: 'Mijoz',
    address: 'Manzil',
    details: 'Tafsilotlar',
    container: 'Konteyner',
    duration: 'Muddati',
    operatorNote: 'Operator izohi',
    actions: 'Harakatlar',
    steps: 'Buyurtma bosqichlari',
    acceptOrder: 'Buyurtmani qabul qildim',
    startTrip: 'Yo\'lga chiqdim',
    dropContainer: 'Konteynerni tushirdim',
    pickUpNow: 'Konteynerni oldim (darhol)',
    pickUp: 'Konteynerni oldim',
    completeWithPayment: 'To\'lovni qabul qilib yakunlash',
    cashReceived: 'Naqd pul oldim',
    cardReceived: 'Karta orqali oldim',
    onlineReceived: 'Onlayn o\'tkazma',
    currency: 'so\'m',
    call: 'Qo\'ng\'iroq qilish',
    newOrderTitle: 'Yangi buyurtma!',
    newOrderMessage: 'Sizga yangi buyurtma biriktirildi',
    orderCompletedTitle: 'Tayyor!',
    orderCompletedMessage: 'Buyurtma yopildi va to\'lov qabul qilindi',
    statusUpdateError: 'Holatni yangilab bo\'lmadi',
    completeError: 'Buyurtmani yakunlab bo\'lmadi',
    loadError: 'Ma\'lumot yuklashda xatolik',
    gpsPermissionTitle: 'Joylashuv ruxsati',
    gpsPermissionMessage: 'Yo\'lda bo\'lganda joylashuvingiz operatorga yuboriladi. Sozlamalardan GPS ni yoqing.',
    gpsAlwaysTitle: '«Har doim» ruxsati kerak',
    gpsAlwaysMessage: 'Xaritada doim ko\'rinish uchun: Sozlamalar → Driver CRM → Joylashuv → «Har doim» / «Allow all the time».',
    openSettings: 'Sozlamalarni ochish',
    gpsLoginHint: 'Keyingi oynada avval «Ilova ishlaganda», keyin «Har doim» ni tanlang.',
    gpsTracking: 'Joylashuv yuborilmoqda (yo\'ldasiz)',
    gpsIdle: 'Joylashuv o\'chiq — yo\'lga chiqganda yoqiladi',
    gpsWhy: 'GPS faqat «Yo\'lda» holatida ishlaydi. Buyurtma tugagach avtomatik o\'chadi.',
    status_new: 'Yangi',
    status_assigned: 'Biriktirilgan',
    status_in_progress: 'Yo\'lda',
    status_container_placed: 'Konteyner joylashtirildi',
    status_picked_up: 'Olib ketildi',
    status_completed: 'Tugallangan',
    rental_1_day: '1 kun',
    rental_1_week: '1 hafta',
    rental_1_month: '1 oy',
    payment_cash: 'Naqd',
    payment_card: 'Karta',
    payment_online: 'Onlayn',
    currentOrder: 'Hozir bajarilayotgan',
    scheduledAt: 'Reja vaqti',
    acceptAnytimeHint: 'Qabul qilish — istalgan vaqtda',
    earlyTripHint: 'Yo\'lga chiqish — reja vaqtidan oldin ham mumkin (yo\'l hisobi)',
    finishCurrentFirst: 'Avval joriy buyurtmani tugating. Keyingi buyurtmada faqat «Qabul qildim» bosiladi.',
    lockedAction: 'Bu buyurtma navbatda',
    calendarDayOrders: 'Kun buyurtmalari',
    calendarSchedule: 'Kun jadvali',
    calendarActiveCount: 'Faol',
    calendarDoneCount: 'Tugallangan',
    goToToday: 'Bugunga',
    statusBadge: 'Holat',
  },
  ru: {
    appTitle: 'Водитель',
    appSub: 'Управление заказами',
    login: 'Логин',
    password: 'Пароль',
    signIn: 'Войти',
    settings: 'Настройки',
    serverIp: 'Адрес сервера',
    port: 'Порт',
    portPlaceholder: 'Пусто или 3000',
    save: 'Сохранить',
    language: 'Язык',
    enterCredentials: 'Введите логин и пароль',
    loginError: 'Ошибка входа',
    connectionError: 'Не удалось подключиться к серверу',
    saveSettingsError: 'Ошибка сохранения настроек',
    understood: 'Понятно',
    hello: 'Здравствуйте',
    active: 'Активные',
    tabToday: 'Сегодня',
    history: 'История',
    calendar: 'Календарь',
    nextTask: 'Сейчас сделать',
    doNow: 'Начать',
    openOrder: 'Подробнее',
    otherOrders: 'Следующие заказы',
    stepOf: 'Шаг',
    stepAccept: 'Принять',
    stepOnWay: 'В пути',
    stepContainer: 'Контейнер',
    stepPayment: 'Оплата',
    whatToDo: 'Что сделать:',
    waitingPayment: 'Примите оплату от клиента',
    queueNext: 'Следующий',
    tapCardHint: 'Нажмите для подробностей',
    btnAccept: 'ПРИНЯЛ ЗАКАЗ',
    btnStart: 'ВЫЕХАЛ В ПУТЬ',
    btnDrop: 'КОНТЕЙНЕР УСТАНОВЛЕН',
    btnPickup: 'ЗАБРАЛ КОНТЕЙНЕР',
    btnPayCash: 'НАЛИЧНЫЕ',
    btnPayCard: 'КАРТА',
    btnPayOnline: 'ОНЛАЙН',
    btnComplete: 'ЗАВЕРШИТЬ',
    paidBeznal: 'Оплачено (Безнал)',
    updating: 'Сохранение...',
    sessionExpired: 'Сессия истекла',
    sessionExpiredMessage: 'Данные обновлены. Войдите снова (логин: driver, пароль: driver123).',
    loadErrorRetry: 'Не удалось загрузить заказы. Проверьте интернет или войдите снова.',
    allDone: 'Всё готово!',
    allDoneSub: 'Новые заказы появятся здесь',
    showDetails: 'Подробнее',
    hideDetails: 'Скрыть',
    callClient: 'Позвонить клиенту',
    all: 'Все',
    noOrders: 'Заказов нет',
    noOrdersSub: 'Заказы не найдены',
    noOrdersOnDate: 'На этот день заказов нет',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    order: 'Заказ',
    status: 'Статус',
    client: 'Клиент',
    address: 'Адрес',
    details: 'Детали',
    container: 'Контейнер',
    duration: 'Срок',
    operatorNote: 'Заметка оператора',
    actions: 'Действия',
    steps: 'Этапы заказа',
    acceptOrder: 'Принял заказ',
    startTrip: 'Выехал в путь',
    dropContainer: 'Контейнер установлен',
    pickUpNow: 'Забрал контейнер сразу',
    pickUp: 'Забрал контейнер',
    completeWithPayment: 'Принять оплату и завершить',
    cashReceived: 'Наличные получены',
    cardReceived: 'Оплата картой',
    onlineReceived: 'Онлайн перевод',
    currency: 'руб.',
    call: 'Позвонить',
    newOrderTitle: 'Новый заказ!',
    newOrderMessage: 'Вам назначен новый заказ',
    orderCompletedTitle: 'Готово!',
    orderCompletedMessage: 'Заказ закрыт, оплата получена',
    statusUpdateError: 'Не удалось обновить статус',
    completeError: 'Не удалось завершить заказ',
    loadError: 'Ошибка загрузки данных',
    gpsPermissionTitle: 'Доступ к геолокации',
    gpsPermissionMessage: 'В пути ваше местоположение отправляется оператору. Включите GPS в настройках.',
    gpsAlwaysTitle: 'Нужен доступ «Всегда»',
    gpsAlwaysMessage: 'Для карты: Настройки → Driver CRM → Геолокация → «Всегда» / «Разрешить всё время».',
    openSettings: 'Открыть настройки',
    gpsLoginHint: 'В следующих окнах выберите «При использовании», затем «Всегда».',
    gpsTracking: 'Геолокация отправляется (в пути)',
    gpsIdle: 'Геолокация выкл. — включится при выезде',
    gpsWhy: 'GPS работает только в статусе «В пути». После завершения заказа отключается.',
    status_new: 'Новый',
    status_assigned: 'Назначен',
    status_in_progress: 'В пути',
    status_container_placed: 'Контейнер установлен',
    status_picked_up: 'Забран',
    status_completed: 'Завершен',
    rental_1_day: '1 день',
    rental_1_week: '1 неделя',
    rental_1_month: '1 месяц',
    payment_cash: 'Наличные',
    payment_card: 'Карта',
    payment_online: 'Онлайн',
    currentOrder: 'Сейчас в работе',
    scheduledAt: 'Запланировано',
    acceptAnytimeHint: 'Принять заказ — в любое время',
    earlyTripHint: 'Выезд — можно раньше запланированного (расчёт маршрута)',
    finishCurrentFirst: 'Сначала завершите текущий заказ. В следующем доступно только «Принял заказ».',
    lockedAction: 'Заказ в очереди',
    calendarDayOrders: 'Заказы на день',
    calendarSchedule: 'Расписание дня',
    calendarActiveCount: 'Активные',
    calendarDoneCount: 'Завершены',
    goToToday: 'Сегодня',
    statusBadge: 'Статус',
  },
} as const;

const MONTHS: Record<Locale, string[]> = {
  uz: [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
  ],
  ru: [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ],
};

const WEEKDAYS: Record<Locale, string[]> = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};

const WEEKDAYS_SHORT: Record<Locale, string[]> = {
  uz: ['Ya', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};

export function getWeekdayShort(locale: Locale, date: Date): string {
  return WEEKDAYS_SHORT[locale][date.getDay()] ?? '';
}

export function getWeekdayLong(locale: Locale, date: Date): string {
  return WEEKDAYS[locale][date.getDay()] ?? '';
}

export function formatMonthYear(locale: Locale, date: Date): string {
  const month = MONTHS[locale][date.getMonth()] ?? '';
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${date.getFullYear()}`;
}

export function formatCalendarDayTitle(locale: Locale, date: Date): string {
  const day = date.getDate();
  const month = MONTHS[locale][date.getMonth()] ?? '';
  const year = date.getFullYear();
  const weekday = getWeekdayLong(locale, date);
  return `${weekday}, ${day} ${month} ${year}`;
}

export function formatTimeOnly(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export type TranslationKey = keyof typeof translations.uz;

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] ?? translations.uz[key] ?? key;
}

export function getStatusLabel(locale: Locale, status: string): { label: string; color: string; bg: string } {
  const key = `status_${status}` as TranslationKey;
  const label = translations[locale][key as keyof typeof translations.uz]
    ? t(locale, key)
    : status;
  const colors: Record<string, { color: string; bg: string }> = {
    new: { color: '#3b82f6', bg: '#eff6ff' },
    assigned: { color: '#6366f1', bg: '#e0e7ff' },
    in_progress: { color: '#f59e0b', bg: '#fef3c7' },
    container_placed: { color: '#f97316', bg: '#ffedd5' },
    picked_up: { color: '#14b8a6', bg: '#f0fdfa' },
    completed: { color: '#10b981', bg: '#ecfdf5' },
  };
  const c = colors[status] ?? { color: '#64748b', bg: '#f8fafc' };
  return { label, ...c };
}

export function getRentalLabel(locale: Locale, duration: string): string {
  const key = `rental_${duration}` as TranslationKey;
  return translations[locale][key as keyof typeof translations.uz]
    ? t(locale, key)
    : duration.replace('_', ' ');
}

export function getPaymentLabel(locale: Locale, type: string): string {
  const key = `payment_${type}` as TranslationKey;
  return translations[locale][key as keyof typeof translations.uz]
    ? t(locale, key)
    : type;
}

export const STATUS_FILTERS = ['all', 'new', 'assigned', 'in_progress', 'container_placed', 'picked_up'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export function getFilterLabel(locale: Locale, filter: StatusFilter): string {
  if (filter === 'all') return t(locale, 'all');
  return getStatusLabel(locale, filter).label;
}
