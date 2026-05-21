import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StatusBar,
  Vibration,
  Platform,
  Animated,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  Warehouse as LucideWarehouse,
  User as LucideUser,
  Lock as LucideLock,
  LogOut as LucideLogOut,
  Settings as LucideSettings,
  ClipboardList as LucideClipboardList,
  Calendar as LucideCalendar,
  CheckCircle as LucideCheckCircle,
  Phone as LucidePhone,
  RefreshCw as LucideRefreshCw,
  X as LucideX,
  AlertCircle as LucideAlertCircle,
  Navigation as LucideNavigation,
  ChevronRight as LucideChevronRight,
  Home as LucideHome,
} from 'lucide-react-native';
import {
  t,
  Locale,
  TranslationKey,
  getStatusLabel,
  getRentalLabel,
  getPaymentLabel,
} from './i18n';
import './locationTask';
import {
  requestFullLocationAccess,
  hasBackgroundLocationPermission,
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
} from './locationTask';

const Warehouse = LucideWarehouse as React.ComponentType<{ color?: string; size?: number }>;
const User = LucideUser as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Lock = LucideLock as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const LogOut = LucideLogOut as React.ComponentType<{ color?: string; size?: number }>;
const Settings = LucideSettings as React.ComponentType<{ color?: string; size?: number }>;
const ClipboardList = LucideClipboardList as React.ComponentType<{ color?: string; size?: number }>;
const Calendar = LucideCalendar as React.ComponentType<{ color?: string; size?: number }>;
const CheckCircle = LucideCheckCircle as React.ComponentType<{ color?: string; size?: number }>;
const Phone = LucidePhone as React.ComponentType<{ color?: string; size?: number }>;
const RefreshCw = LucideRefreshCw as React.ComponentType<{ color?: string; size?: number }>;
const X = LucideX as React.ComponentType<{ color?: string; size?: number }>;
const AlertCircle = LucideAlertCircle as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const Navigation = LucideNavigation as React.ComponentType<{ color?: string; size?: number; style?: object }>;
const ChevronRight = LucideChevronRight as React.ComponentType<{ color?: string; size?: number }>;
const Home = LucideHome as React.ComponentType<{ color?: string; size?: number }>;

type Order = {
  id: number;
  status: string;
  address: string;
  scheduledAt: string;
  paymentAmount: number;
  paymentType: string;
  clientName: string;
  clientPhone: string;
  containerSizeM3: number;
  rentalDuration: string;
  operatorNote?: string;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

const STATUS_PRIORITY: Record<string, number> = {
  in_progress: 0,
  new: 1,
  assigned: 2,
  container_placed: 3,
  picked_up: 4,
};

function sortActiveOrders(list: Order[]): Order[] {
  return list
    .filter(o => o.status !== 'completed')
    .sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status] ?? 99;
      const pb = STATUS_PRIORITY[b.status] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
}

function getPrimaryActionKey(status: string): TranslationKey | null {
  switch (status) {
    case 'new': return 'acceptOrder';
    case 'assigned': return 'startTrip';
    case 'in_progress': return 'dropContainer';
    case 'container_placed': return 'pickUp';
    case 'picked_up': return 'completeWithPayment';
    default: return null;
  }
}

function getPrimaryActionColor(status: string): string {
  switch (status) {
    case 'new': return '#6366f1';
    case 'assigned': return '#f59e0b';
    case 'in_progress': return '#f97316';
    case 'container_placed': return '#14b8a6';
    case 'picked_up': return '#10b981';
    default: return '#4f46e5';
  }
}

function AlertModal({
  visible,
  title,
  message,
  onClose,
  locale,
  onOpenSettings,
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  locale: Locale;
  onOpenSettings?: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.alertOverlay}>
        <View style={styles.alertBox}>
          <AlertCircle size={48} color="#4f46e5" style={{ marginBottom: 16 }} />
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          {onOpenSettings ? (
            <TouchableOpacity
              style={[styles.alertBtn, { marginBottom: 10 }]}
              onPress={() => { onOpenSettings(); onClose(); }}
            >
              <Text style={styles.alertBtnText}>{t(locale, 'openSettings')}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={[styles.alertBtn, onOpenSettings && styles.alertBtnSecondary]} onPress={onClose}>
            <Text style={[styles.alertBtnText, onOpenSettings && styles.alertBtnTextSecondary]}>{t(locale, 'understood')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const [serverIp, setServerIp] = useState('crm-aziz.vercel.app');
  const [port, setPort] = useState('');
  const [locale, setLocale] = useState<Locale>('uz');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [driver, setDriver] = useState<{ id: number; name: string; vehiclePlate: string } | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'calendar'>('home');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(startOfDay(new Date()));

  const knownOrderIds = useRef<Set<number>>(new Set());
  const initialFetchDone = useRef(false);

  const [isTrackingGps, setIsTrackingGps] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    openSettings?: boolean;
  }>({ visible: false, title: '', message: '' });

  const showAlert = useCallback((title: string, message: string, openSettings = false) => {
    setCustomAlert({ visible: true, title, message, openSettings });
  }, []);

  const getApiUrl = useCallback(() => {
    if (serverIp.includes('.vercel.app') || (serverIp.includes('.') && !/^[0-9.]+$/.test(serverIp))) {
      return `https://${serverIp}/api`;
    }
    const portSuffix = port ? `:${port}` : '';
    return `http://${serverIp}${portSuffix}/api`;
  }, [serverIp, port]);

  const formatDate = useCallback((dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  }, []);

  const formatDateShort = useCallback((d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }, []);

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedIp = await AsyncStorage.getItem('@server_ip');
        const savedPort = await AsyncStorage.getItem('@server_port');
        const savedDriver = await AsyncStorage.getItem('@driver_data');
        const savedLocale = await AsyncStorage.getItem('@locale');

        if (savedIp !== null) setServerIp(savedIp);
        if (savedPort !== null) setPort(savedPort);
        if (savedLocale === 'ru' || savedLocale === 'uz') setLocale(savedLocale);
        if (savedDriver !== null) {
          setDriver(JSON.parse(savedDriver));
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Failed to load persisted app states:', e);
      }
    };
    loadPersistedData();
  }, []);

  const toggleLocale = async () => {
    const next: Locale = locale === 'uz' ? 'ru' : 'uz';
    setLocale(next);
    await AsyncStorage.setItem('@locale', next);
    Vibration.vibrate(20);
  };

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (isTrackingGps) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        ])
      );
      anim.start();
    } else {
      pulseAnim.setValue(0.4);
    }
    return () => { if (anim) anim.stop(); };
  }, [isTrackingGps, pulseAnim]);

  const postLocation = useCallback(
    async (latitude: number, longitude: number) => {
      if (!driver) return;
      try {
        await fetch(`${getApiUrl()}/driver/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driverId: driver.id, latitude, longitude }),
        });
      } catch {
        /* retry on next tick */
      }
    },
    [driver, getApiUrl]
  );

  const hasInProgress = orders.some(o => o.status === 'in_progress');

  useEffect(() => {
    let active = true;

    const startTracking = async () => {
      if (!isLoggedIn || !driver || !hasInProgress) {
        if (locationSubscription.current) {
          locationSubscription.current.remove();
          locationSubscription.current = null;
        }
        await stopBackgroundLocationTracking();
        setIsTrackingGps(false);
        return;
      }

      const fg = await Location.getForegroundPermissionsAsync();
      if (fg.status !== 'granted') {
        showAlert(t(locale, 'gpsPermissionTitle'), t(locale, 'gpsPermissionMessage'), true);
        return;
      }

      const bgGranted = await hasBackgroundLocationPermission();
      if (bgGranted) {
        try {
          const started = await startBackgroundLocationTracking();
          if (started && active) {
            if (locationSubscription.current) {
              locationSubscription.current.remove();
              locationSubscription.current = null;
            }
            setIsTrackingGps(true);
            Vibration.vibrate([0, 150, 100, 150]);
            return;
          }
        } catch (e) {
          console.warn('Background location start failed:', e);
        }
      }

      if (!locationSubscription.current && active) {
        setIsTrackingGps(true);
        Vibration.vibrate([0, 150, 100, 150]);
        try {
          locationSubscription.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 10 },
            (loc) => postLocation(loc.coords.latitude, loc.coords.longitude)
          );
        } catch {
          setIsTrackingGps(false);
        }
      }
    };

    startTracking();

    return () => {
      active = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [hasInProgress, isLoggedIn, driver, locale, showAlert, postLocation]);

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert(t(locale, 'loginError'), t(locale, 'enterCredentials'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/driver/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t(locale, 'loginError'));

      setDriver(data);
      setIsLoggedIn(true);
      knownOrderIds.current = new Set();
      initialFetchDone.current = false;
      await AsyncStorage.setItem('@driver_data', JSON.stringify(data));
      Vibration.vibrate([0, 80, 40, 80]);

      const perms = await requestFullLocationAccess();
      if (!perms.foreground) {
        showAlert(t(locale, 'gpsPermissionTitle'), t(locale, 'gpsPermissionMessage'), true);
      } else if (!perms.background) {
        showAlert(t(locale, 'gpsAlwaysTitle'), t(locale, 'gpsAlwaysMessage'), true);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t(locale, 'connectionError');
      showAlert(t(locale, 'loginError'), msg);
    } finally {
      setLoading(false);
    }
  };

  const detectNewOrders = useCallback((data: Order[]) => {
    const activeStatuses = new Set(['new', 'assigned']);
    const newAssignments = data.filter(
      o => activeStatuses.has(o.status) && !knownOrderIds.current.has(o.id)
    );

    if (initialFetchDone.current && newAssignments.length > 0) {
      Vibration.vibrate([0, 500, 200, 500]);
      showAlert(t(locale, 'newOrderTitle'), t(locale, 'newOrderMessage'));
    }

    knownOrderIds.current = new Set(data.map(o => o.id));
    initialFetchDone.current = true;
  }, [locale, showAlert]);

  const fetchOrders = useCallback(async (showIndicator = true) => {
    if (!driver) return;
    if (showIndicator) setLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/driver/orders?driverId=${driver.id}&t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' },
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || t(locale, 'loadError'));

      setOrders(data);
      detectNewOrders(data);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driver, getApiUrl, locale, detectNewOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  useEffect(() => {
    if (isLoggedIn && driver) {
      fetchOrders();
      const interval = setInterval(() => fetchOrders(false), 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, driver, fetchOrders]);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/driver/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error(t(locale, 'statusUpdateError'));

      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : null));
      }
      Vibration.vibrate(100);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t(locale, 'statusUpdateError');
      showAlert(t(locale, 'loginError'), msg);
    }
  };

  const handleCompleteOrder = async (orderId: number, payType: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/driver/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          paymentType: payType,
          paymentStatus: 'received',
        }),
      });

      if (!response.ok) throw new Error(t(locale, 'completeError'));

      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? { ...o, status: 'completed', paymentType: payType, paymentStatus: 'received' }
            : o
        )
      );

      setSelectedOrder(null);
      Vibration.vibrate([0, 200, 100, 200]);
      showAlert(t(locale, 'orderCompletedTitle'), t(locale, 'orderCompletedMessage'));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t(locale, 'completeError');
      showAlert(t(locale, 'loginError'), msg);
    }
  };

  const callClient = (phone: string) => {
    const tel = phone.replace(/\s/g, '');
    Linking.openURL(`tel:${tel}`).catch(() => {
      showAlert(t(locale, 'call'), phone);
    });
  };

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const base = startOfDay(new Date());
    for (let i = -2; i <= 12; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const getDayLabel = (d: Date) => {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (isSameDay(d, today)) return t(locale, 'today');
    if (isSameDay(d, tomorrow)) return t(locale, 'tomorrow');
    return formatDateShort(d);
  };

  const ordersForCalendarDay = useMemo(() => {
    return orders
      .filter(o => isSameDay(new Date(o.scheduledAt), selectedCalendarDate))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [orders, selectedCalendarDate]);

  const activeOrders = useMemo(() => sortActiveOrders(orders), [orders]);
  const focusOrder = activeOrders[0] ?? null;
  const otherActiveOrders = focusOrder ? activeOrders.filter(o => o.id !== focusOrder.id) : [];
  const historyOrders = useMemo(
    () => orders.filter(o => o.status === 'completed').sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    [orders]
  );

  const openOrder = (order: Order) => {
    Vibration.vibrate(40);
    setShowOrderDetails(false);
    setSelectedOrder(order);
  };

  const runPrimaryAction = (order: Order) => {
    Vibration.vibrate([0, 80]);
    switch (order.status) {
      case 'new':
        handleUpdateStatus(order.id, 'assigned');
        break;
      case 'assigned':
        handleUpdateStatus(order.id, 'in_progress');
        break;
      case 'in_progress':
        handleUpdateStatus(order.id, 'container_placed');
        break;
      case 'container_placed':
        handleUpdateStatus(order.id, 'picked_up');
        break;
      default:
        break;
    }
  };

  const renderCompactCard = (order: Order, highlight = false) => {
    const statusConfig = getStatusLabel(locale, order.status);
    const timeOnly = formatDate(order.scheduledAt).split(' ')[1] || formatDate(order.scheduledAt);
    return (
      <TouchableOpacity
        key={order.id}
        style={[styles.orderCard, highlight && styles.orderCardHighlight]}
        onPress={() => openOrder(order)}
        activeOpacity={0.85}
      >
        <View style={[styles.statusStripe, { backgroundColor: statusConfig.color }]} />
        <View style={styles.orderCardBody}>
          <View style={styles.orderCardTop}>
            <Text style={styles.orderTime}>{timeOnly}</Text>
            <Text style={[styles.orderStatusMini, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
          <Text style={styles.orderAddress} numberOfLines={2}>{order.address}</Text>
          <Text style={styles.orderMeta}>#{order.id} · {order.clientName}</Text>
        </View>
        <ChevronRight size={20} color="#cbd5e1" />
      </TouchableOpacity>
    );
  };

  const renderHeroCard = (order: Order) => {
    const statusConfig = getStatusLabel(locale, order.status);
    const actionKey = getPrimaryActionKey(order.status);
    return (
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>{t(locale, 'nextTask')}</Text>
        <View style={[styles.heroStatusPill, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.heroStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
        <Text style={styles.heroTime}>{formatDate(order.scheduledAt)}</Text>
        <Text style={styles.heroAddress}>{order.address}</Text>
        <Text style={styles.heroClient}>{order.clientName}</Text>
        {actionKey && order.status !== 'picked_up' ? (
          <TouchableOpacity
            style={[styles.heroBtn, { backgroundColor: getPrimaryActionColor(order.status) }]}
            onPress={() => runPrimaryAction(order)}
          >
            <Text style={styles.heroBtnText}>{t(locale, actionKey)}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.heroLinkBtn} onPress={() => openOrder(order)}>
          <Text style={styles.heroLinkText}>{t(locale, 'openOrder')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.loginTopBar}>
            <TouchableOpacity style={styles.langBtn} onPress={toggleLocale}>
              <Text style={styles.langBtnText}>{locale === 'uz' ? 'RU' : 'UZ'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(!showSettings)}>
              <Settings color="#94a3b8" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerArea}>
            <View style={styles.logoCircle}>
              <Warehouse color="#fff" size={40} />
            </View>
            <Text style={styles.appTitle}>{t(locale, 'appTitle')}</Text>
            <Text style={styles.appSub}>{t(locale, 'appSub')}</Text>
          </View>

          {showSettings ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t(locale, 'settings')}</Text>
              <Text style={styles.label}>{t(locale, 'serverIp')}:</Text>
              <TextInput
                style={styles.input}
                value={serverIp}
                onChangeText={setServerIp}
                placeholder="crm-aziz.vercel.app"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.label}>{t(locale, 'port')}:</Text>
              <TextInput
                style={styles.input}
                value={port}
                onChangeText={setPort}
                placeholder={t(locale, 'portPlaceholder')}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  try {
                    await AsyncStorage.setItem('@server_ip', serverIp);
                    await AsyncStorage.setItem('@server_port', port);
                    setShowSettings(false);
                  } catch {
                    showAlert(t(locale, 'loginError'), t(locale, 'saveSettingsError'));
                  }
                }}
              >
                <Text style={styles.saveBtnText}>{t(locale, 'save')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t(locale, 'signIn')}</Text>
              <View style={styles.inputContainer}>
                <User color="#94a3b8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={t(locale, 'login')}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t(locale, 'password')}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>{t(locale, 'signIn')}</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <AlertModal
          visible={customAlert.visible}
          title={customAlert.title}
          message={customAlert.message}
          onClose={() => setCustomAlert(c => ({ ...c, visible: false }))}
          locale={locale}
          onOpenSettings={customAlert.openSettings ? () => Linking.openSettings() : undefined}
        />
      </SafeAreaView>
    );
  }

  const bottomTabs = [
    { id: 'home' as const, label: t(locale, 'tabToday'), Icon: Home, count: activeOrders.length },
    { id: 'calendar' as const, label: t(locale, 'calendar'), Icon: Calendar, count: 0 },
    { id: 'history' as const, label: t(locale, 'history'), Icon: CheckCircle, count: historyOrders.length },
  ];

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.appHeader}>
        <View style={styles.driverInfoArea}>
          <Text style={styles.welcomeText}>{driver!.name}</Text>
          <Text style={styles.plateText}>{driver!.vehiclePlate}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerMiniBtn} onPress={toggleLocale}>
            <Text style={styles.headerMiniBtnText}>{locale === 'uz' ? 'RU' : 'UZ'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => { Vibration.vibrate(30); fetchOrders(true); }}>
            <RefreshCw size={20} color="#4f46e5" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerMiniBtn}
            onPress={async () => {
              Vibration.vibrate([0, 100]);
              setIsLoggedIn(false);
              setDriver(null);
              knownOrderIds.current = new Set();
              initialFetchDone.current = false;
              await AsyncStorage.removeItem('@driver_data');
            }}
          >
            <LogOut size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {isTrackingGps && (
        <View style={styles.gpsActiveBar}>
          <View style={styles.pulseContainer}>
            <Animated.View style={[styles.pulseRing, { opacity: pulseAnim }]} />
            <View style={styles.pulseDot} />
          </View>
          <Navigation size={14} color="#065f46" style={{ marginRight: 6 }} />
          <Text style={styles.gpsActiveText}>{t(locale, 'gpsTracking')}</Text>
        </View>
      )}

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.ordersListContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 48 }} />
        ) : activeTab === 'home' ? (
          <>
            {focusOrder ? (
              renderHeroCard(focusOrder)
            ) : (
              <View style={styles.emptyHero}>
                <CheckCircle size={56} color="#10b981" />
                <Text style={styles.emptyTitle}>{t(locale, 'allDone')}</Text>
                <Text style={styles.emptySub}>{t(locale, 'allDoneSub')}</Text>
              </View>
            )}
            {otherActiveOrders.length > 0 && (
              <>
                <Text style={styles.sectionHeading}>{t(locale, 'otherOrders')}</Text>
                {otherActiveOrders.map(o => renderCompactCard(o))}
              </>
            )}
          </>
        ) : activeTab === 'calendar' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
              {calendarDays.map(day => {
                const selected = isSameDay(day, selectedCalendarDate);
                const count = orders.filter(o => isSameDay(new Date(o.scheduledAt), day)).length;
                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={[styles.calendarDay, selected && styles.calendarDaySelected]}
                    onPress={() => { Vibration.vibrate(20); setSelectedCalendarDate(startOfDay(day)); }}
                  >
                    <Text style={[styles.calendarDayLabel, selected && styles.calendarDayLabelSelected]}>
                      {getDayLabel(day)}
                    </Text>
                    <Text style={[styles.calendarDayDate, selected && styles.calendarDayLabelSelected]}>
                      {formatDateShort(day)}
                    </Text>
                    {count > 0 && (
                      <View style={[styles.calendarBadge, selected && styles.calendarBadgeSelected]}>
                        <Text style={[styles.calendarBadgeText, selected && { color: '#fff' }]}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {ordersForCalendarDay.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Calendar size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>{t(locale, 'noOrdersOnDate')}</Text>
              </View>
            ) : (
              ordersForCalendarDay.map(o => renderCompactCard(o))
            )}
          </>
        ) : historyOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ClipboardList size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>{t(locale, 'noOrders')}</Text>
          </View>
        ) : (
          historyOrders.map(o => renderCompactCard(o))
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        {bottomTabs.map(({ id, label, Icon, count }) => (
          <TouchableOpacity
            key={id}
            style={styles.bottomNavItem}
            onPress={() => { Vibration.vibrate(20); setActiveTab(id); }}
          >
            <Icon size={22} color={activeTab === id ? '#4f46e5' : '#94a3b8'} />
            <Text style={[styles.bottomNavLabel, activeTab === id && styles.bottomNavLabelActive]}>{label}</Text>
            {count > 0 && id !== 'calendar' ? (
              <View style={styles.bottomNavBadge}>
                <Text style={styles.bottomNavBadgeText}>{count > 9 ? '9+' : count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {selectedOrder && (() => {
        const st = getStatusLabel(locale, selectedOrder.status);
        const actionKey = getPrimaryActionKey(selectedOrder.status);
        return (
          <Modal animationType="slide" transparent visible onRequestClose={() => setSelectedOrder(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => { Vibration.vibrate(20); setSelectedOrder(null); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <X size={26} color="#1e293b" />
                  </TouchableOpacity>
                  <View style={[styles.modalStatusPill, { backgroundColor: st.bg }]}>
                    <Text style={[styles.modalStatusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                  <Text style={styles.modalOrderId}>#{selectedOrder.id}</Text>
                </View>

                <ScrollView style={styles.modalScrollFlex} contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 20 }}>
                  <Text style={styles.modalBigTime}>{formatDate(selectedOrder.scheduledAt)}</Text>
                  <Text style={styles.modalBigAddress}>{selectedOrder.address}</Text>
                  <Text style={styles.modalBigClient}>{selectedOrder.clientName}</Text>

                  <TouchableOpacity style={styles.callBtn} onPress={() => callClient(selectedOrder.clientPhone)}>
                    <Phone size={18} color="#4f46e5" />
                    <Text style={styles.callBtnText}>{t(locale, 'callClient')}</Text>
                  </TouchableOpacity>

                  {selectedOrder.operatorNote ? (
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText}>{selectedOrder.operatorNote}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity style={styles.detailsToggle} onPress={() => setShowOrderDetails(v => !v)}>
                    <Text style={styles.detailsToggleText}>
                      {showOrderDetails ? t(locale, 'hideDetails') : t(locale, 'showDetails')}
                    </Text>
                  </TouchableOpacity>

                  {showOrderDetails && (
                    <View style={styles.detailsBlock}>
                      <Text style={styles.detailsLine}>
                        {t(locale, 'container')}: {selectedOrder.containerSizeM3} m³
                      </Text>
                      <Text style={styles.detailsLine}>
                        {t(locale, 'duration')}: {getRentalLabel(locale, selectedOrder.rentalDuration)}
                      </Text>
                      <Text style={styles.detailsLine}>
                        {selectedOrder.paymentAmount.toLocaleString()} {t(locale, 'currency')} · {getPaymentLabel(locale, selectedOrder.paymentType)}
                      </Text>
                    </View>
                  )}

                  {selectedOrder.status === 'in_progress' && (
                    <TouchableOpacity
                      style={styles.altActionLink}
                      onPress={() => { Vibration.vibrate(40); handleUpdateStatus(selectedOrder.id, 'picked_up'); }}
                    >
                      <Text style={styles.altActionLinkText}>{t(locale, 'pickUpNow')}</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>

                {selectedOrder.status !== 'completed' && (
                  <View style={styles.modalFooter}>
                    {selectedOrder.status === 'picked_up' ? (
                      <View style={styles.paymentRow}>
                        <TouchableOpacity style={[styles.payChip, { backgroundColor: '#10b981' }]} onPress={() => handleCompleteOrder(selectedOrder.id, 'cash')}>
                          <Text style={styles.payChipText}>{t(locale, 'payment_cash')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.payChip, { backgroundColor: '#3b82f6' }]} onPress={() => handleCompleteOrder(selectedOrder.id, 'card')}>
                          <Text style={styles.payChipText}>{t(locale, 'payment_card')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.payChip, { backgroundColor: '#6366f1' }]} onPress={() => handleCompleteOrder(selectedOrder.id, 'online')}>
                          <Text style={styles.payChipText}>{t(locale, 'payment_online')}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : actionKey ? (
                      <TouchableOpacity
                        style={[styles.modalPrimaryBtn, { backgroundColor: getPrimaryActionColor(selectedOrder.status) }]}
                        onPress={() => runPrimaryAction(selectedOrder)}
                      >
                        <Text style={styles.modalPrimaryBtnText}>{t(locale, actionKey)}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          </Modal>
        );
      })()}

      <AlertModal
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert(c => ({ ...c, visible: false }))}
        locale={locale}
        onOpenSettings={customAlert.openSettings ? () => Linking.openSettings() : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#0B0F19', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  loginTopBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8, gap: 8 },
  settingsBtn: { padding: 8 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#334155' },
  langBtnText: { color: '#e2e8f0', fontWeight: '700', fontSize: 12 },
  langBtnLight: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#e0e7ff', marginRight: 4 },
  langBtnLightText: { color: '#4f46e5', fontWeight: '700', fontSize: 12 },
  headerArea: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', elevation: 10 },
  appTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 16 },
  appSub: { fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#1E293B', borderRadius: 24, padding: 24, elevation: 5 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  label: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#0F172A', borderColor: '#334155', borderWidth: 1, borderRadius: 12, padding: 12, color: '#fff', marginBottom: 16, fontSize: 16 },
  saveBtn: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderColor: '#334155', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16, height: 52 },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, color: '#fff', fontSize: 16, height: '100%' },
  loginBtn: { backgroundColor: '#4f46e5', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  gpsActiveBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 16, paddingVertical: 8 },
  pulseContainer: { height: 12, width: 12, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  pulseRing: { position: 'absolute', height: 20, width: 20, borderRadius: 10, backgroundColor: '#34d399' },
  pulseDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#10b981' },
  gpsActiveText: { fontSize: 12, color: '#065f46', fontWeight: '600', flex: 1 },
  mainContainer: { flex: 1, backgroundColor: '#f1f5f9', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  mainScroll: { flex: 1 },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff' },
  driverInfoArea: { flex: 1 },
  welcomeText: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  plateText: { fontSize: 13, color: '#64748b', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerMiniBtn: { padding: 8, borderRadius: 10, backgroundColor: '#f8fafc' },
  headerMiniBtnText: { fontSize: 12, fontWeight: '800', color: '#4f46e5' },
  actionIconBtn: { padding: 8, borderRadius: 10, backgroundColor: '#eef2ff' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingBottom: Platform.OS === 'ios' ? 4 : 8, paddingTop: 8 },
  bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, position: 'relative' },
  bottomNavLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  bottomNavLabelActive: { color: '#4f46e5', fontWeight: '800' },
  bottomNavBadge: { position: 'absolute', top: 0, right: '22%', backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  bottomNavBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  heroCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: '#4f46e5' },
  heroLabel: { fontSize: 12, fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroStatusPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 10 },
  heroStatusText: { fontSize: 13, fontWeight: '700' },
  heroTime: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 14 },
  heroAddress: { fontSize: 17, color: '#334155', marginTop: 8, lineHeight: 24 },
  heroClient: { fontSize: 15, color: '#64748b', marginTop: 6 },
  heroBtn: { marginTop: 20, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  heroLinkBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
  heroLinkText: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
  emptyHero: { backgroundColor: '#fff', borderRadius: 20, padding: 40, alignItems: 'center', marginBottom: 16 },
  sectionHeading: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 12, marginTop: 4 },
  calendarScroll: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  calendarDay: { width: 72, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8, alignItems: 'center' },
  calendarDaySelected: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  calendarDayLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  calendarDayDate: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },
  calendarDayLabelSelected: { color: '#fff' },
  calendarBadge: { marginTop: 6, backgroundColor: '#e0e7ff', borderRadius: 10, minWidth: 20, paddingHorizontal: 6, alignItems: 'center' },
  calendarBadgeSelected: { backgroundColor: 'rgba(255,255,255,0.3)' },
  calendarBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#4f46e5' },
  ordersListContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden', minHeight: 76 },
  orderCardHighlight: { borderWidth: 1, borderColor: '#c7d2fe' },
  statusStripe: { width: 5, alignSelf: 'stretch' },
  orderCardBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderTime: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  orderStatusMini: { fontSize: 11, fontWeight: '700' },
  orderAddress: { fontSize: 14, color: '#334155', lineHeight: 20 },
  orderMeta: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  orderInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { marginRight: 8 },
  infoText: { fontSize: 13, color: '#475569', flex: 1 },
  amountText: { fontSize: 15, fontWeight: 'bold', color: '#10b981' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#475569', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', minHeight: '55%', flexDirection: 'column' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 },
  modalStatusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  modalStatusText: { fontSize: 13, fontWeight: '700' },
  modalOrderId: { marginLeft: 'auto', fontSize: 15, fontWeight: '700', color: '#94a3b8' },
  modalScrollFlex: { flexShrink: 1, flexGrow: 1 },
  modalBigTime: { fontSize: 15, color: '#64748b', fontWeight: '600' },
  modalBigAddress: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 8, lineHeight: 30 },
  modalBigClient: { fontSize: 17, color: '#475569', marginTop: 8 },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: '#eef2ff' },
  callBtnText: { fontSize: 16, fontWeight: '700', color: '#4f46e5' },
  detailsToggle: { marginTop: 20, paddingVertical: 10 },
  detailsToggleText: { fontSize: 14, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  detailsBlock: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, gap: 6 },
  detailsLine: { fontSize: 14, color: '#475569' },
  altActionLink: { marginTop: 16, paddingVertical: 12, alignItems: 'center' },
  altActionLinkText: { fontSize: 15, color: '#14b8a6', fontWeight: '700' },
  noteBox: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, marginTop: 16 },
  noteText: { fontSize: 14, color: '#b45309', lineHeight: 20 },
  modalFooter: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' },
  modalPrimaryBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalPrimaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  paymentRow: { flexDirection: 'row', gap: 8 },
  payChip: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  payChipText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  alertBox: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', elevation: 5 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  alertMessage: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  alertBtn: { backgroundColor: '#4f46e5', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },
  alertBtnSecondary: { backgroundColor: '#e2e8f0' },
  alertBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  alertBtnTextSecondary: { color: '#475569' },
});
