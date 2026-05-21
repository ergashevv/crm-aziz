import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  StatusBar,
  Vibration,
} from 'react-native';
import {
  Warehouse,
  User,
  Lock,
  LogOut,
  Settings,
  ClipboardList,
  Car,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Phone,
  Truck,
  CreditCard,
  RefreshCw,
  X,
  PlusCircle,
  Coins
} from 'lucide-react-native';

export default function App() {
  // Connection states
  const [serverIp, setServerIp] = useState('crm-aziz.vercel.app'); // Developer default, editable in app
  const [port, setPort] = useState('');

  // Auth states
  const [username, setUsername] = useState('driver');
  const [password, setPassword] = useState('driver123');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [driver, setDriver] = useState<any>(null);

  // App states
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  // For real-time simulation check
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  const getApiUrl = useCallback(() => {
    if (serverIp.includes('.vercel.app') || (serverIp.includes('.') && !/^[0-9.]+$/.test(serverIp))) {
      return `https://${serverIp}/api`;
    }
    const portSuffix = port ? `:${port}` : '';
    return `http://${serverIp}${portSuffix}/api`;
  }, [serverIp, port]);

  // Login Function
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Xatolik / Ошибка', 'Login va parolni kiriting / Введите логин и пароль');
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

      if (!response.ok) {
        throw new Error(data.error || 'Login xato / Ошибка входа');
      }

      setDriver(data);
      setIsLoggedIn(true);
      Vibration.vibrate(100);
    } catch (error: any) {
      Alert.alert('Xatolik / Ошибка', error.message || 'Serverga ulanib bo\'lmadi. IP manzilingizni sozlamalardan tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Orders
  const fetchOrders = useCallback(async (showIndicator = true) => {
    if (!driver) return;
    if (showIndicator) setLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/driver/orders?driverId=${driver.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ma\'lumot yuklashda xatolik');
      }

      setOrders(data);

      // Notification Simulation on New Orders
      if (data.length > prevOrderCount && prevOrderCount > 0) {
        Vibration.vibrate([0, 500, 200, 500]);
        Alert.alert('Yangi buyurtma! / Новый заказ!', 'Sizga yangi buyurtma biriktirildi! / Вам назначен новый заказ!');
      }
      setPrevOrderCount(data.length);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driver, getApiUrl, prevOrderCount]);

  // Handle pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  // Real-time polling simulation (every 10 seconds to check for new assigned orders)
  useEffect(() => {
    if (isLoggedIn && driver) {
      fetchOrders();
      const interval = setInterval(() => {
        fetchOrders(false);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, driver]);

  // Update Order Status
  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/driver/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Statusni yangilab bo\'lmadi');

      // Update locally
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
      Vibration.vibrate(100);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message);
    }
  };

  // Complete Order with Payment method selection
  const handleCompleteOrder = async (orderId: number, payType: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/driver/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          paymentType: payType,
          paymentStatus: 'received'
        }),
      });

      if (!response.ok) throw new Error('Buyurtmani yakunlab bo\'lmadi');

      // Update locally
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: 'completed',
        paymentType: payType,
        paymentStatus: 'received'
      } : o));

      setSelectedOrder(null);
      Vibration.vibrate([0, 200, 100, 200]);
      Alert.alert('Muvaffaqiyatli!', 'Buyurtma to\'liq bajarildi va daromad qayd etildi.');
    } catch (error: any) {
      Alert.alert('Xatolik', error.message);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return { uz: 'Yangi', ru: 'Новый', color: '#3b82f6', bg: '#eff6ff' };
      case 'assigned': return { uz: 'Biriktirildi', ru: 'Назначен', color: '#6366f1', bg: '#e0e7ff' };
      case 'in_progress': return { uz: 'Yo\'lda', ru: 'В пути', color: '#f59e0b', bg: '#fef3c7' };
      case 'container_placed': return { uz: 'Konteyner qo\'yildi', ru: 'Установлен', color: '#f97316', bg: '#ffedd5' };
      case 'picked_up': return { uz: 'Yuklandi', ru: 'Забран', color: '#14b8a6', bg: '#f0fdfa' };
      case 'completed': return { uz: 'Yakunlandi', ru: 'Завершен', color: '#10b981', bg: '#ecfdf5' };
      default: return { uz: status, ru: status, color: '#64748b', bg: '#f8fafc' };
    }
  };

  // Filter orders based on Active vs History
  const filteredOrders = orders.filter(o => {
    if (activeTab === 'active') {
      return o.status !== 'completed';
    } else {
      return o.status === 'completed';
    }
  });

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Settings color="#94a3b8" size={24} />
          </TouchableOpacity>

          <View style={styles.headerArea}>
            <View style={styles.logoCircle}>
              <Warehouse color="#fff" size={40} />
            </View>
            <Text style={styles.appTitle}>Driver CRM</Text>
            <Text style={styles.appSub}>Haydovchilar operator paneli / Панель водителя</Text>
          </View>

          {showSettings ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>IP Sozlamalari / Настройки IP</Text>
              <Text style={styles.label}>Server IP manzili (Wi-Fi):</Text>
              <TextInput
                style={styles.input}
                value={serverIp}
                onChangeText={setServerIp}
                placeholder="Masalan: 192.168.1.10"
                keyboardType="numeric"
              />
              <Text style={styles.label}>Port:</Text>
              <TextInput
                style={styles.input}
                value={port}
                onChangeText={setPort}
                placeholder="3000"
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.saveBtn} onPress={() => setShowSettings(false)}>
                <Text style={styles.saveBtnText}>Saqlash / Сохранить</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Kirish / Вход</Text>

              <View style={styles.inputContainer}>
                <User color="#94a3b8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Username / Логин"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password / Пароль"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>Tizimga kirish / Войти</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.footerText}>© 2026 CRM Waste Management</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* App Header */}
      <View style={styles.appHeader}>
        <View style={styles.driverInfoArea}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{driver.name[0]}</Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>Salom, {driver.name}!</Text>
            <View style={styles.vehiclePlateRow}>
              <Car size={14} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={styles.plateText}>{driver.vehiclePlate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => fetchOrders(true)}
          >
            <RefreshCw size={20} color="#1e293b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              setIsLoggedIn(false);
              setDriver(null);
            }}
          >
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'active' && styles.tabButtonTextActive]}>
            Faollar / Активные ({orders.filter(o => o.status !== 'completed').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>
            Tarix / История ({orders.filter(o => o.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView
        contentContainerStyle={styles.ordersListContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ClipboardList size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Buyurtmalar yo'q</Text>
            <Text style={styles.emptySub}>Sizga hozircha buyurtma biriktirilmagan.</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = getStatusLabel(order.status);
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => setSelectedOrder(order)}
              >
                <View style={styles.orderCardHeader}>
                  <Text style={styles.orderIdText}>Buyurtma #{order.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                      {statusConfig.uz}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDivider} />

                <View style={styles.orderInfoRow}>
                  <MapPin size={16} color="#64748b" style={styles.infoIcon} />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {order.address}
                  </Text>
                </View>

                <View style={styles.orderInfoRow}>
                  <Calendar size={16} color="#64748b" style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    {new Date(order.scheduledAt).toLocaleDateString('uz-UZ')} {new Date(order.scheduledAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={styles.orderInfoRow}>
                  <DollarSign size={16} color="#64748b" style={styles.infoIcon} />
                  <Text style={styles.amountText}>
                    {order.paymentAmount.toLocaleString()} RUB
                  </Text>
                  <Text style={styles.paymentTypeBadge}>
                    {order.paymentType === 'cash' ? '💵 Naqd' : order.paymentType === 'card' ? '💳 Karta' : '📱 Onlayn'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedOrder}
          onRequestClose={() => setSelectedOrder(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Buyurtma #{selectedOrder.id}</Text>
                <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                  <X size={24} color="#1e293b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>

                {/* Status bar */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Status / Статус</Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusLabel(selectedOrder.status).bg }]}>
                      <Text style={[styles.statusBadgeLargeText, { color: getStatusLabel(selectedOrder.status).color }]}>
                        {getStatusLabel(selectedOrder.status).uz} / {getStatusLabel(selectedOrder.status).ru}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Client detail */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Mijoz / Клиент</Text>
                  <Text style={styles.clientNameText}>{selectedOrder.clientName}</Text>
                  <TouchableOpacity
                    style={styles.phoneRow}
                    onPress={() => Alert.alert('Qo\'ng\'iroq', `${selectedOrder.clientPhone} raqamiga qo'ng'iroq qilinmoqda...`)}
                  >
                    <Phone size={16} color="#4f46e5" style={{ marginRight: 6 }} />
                    <Text style={styles.phoneText}>{selectedOrder.clientPhone}</Text>
                  </TouchableOpacity>
                </View>

                {/* Address details */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Manzil / Адрес</Text>
                  <Text style={styles.modalInfoText}>{selectedOrder.address}</Text>
                </View>

                {/* Container specs */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Tafsilotlar / Детали</Text>
                  <View style={styles.specsRow}>
                    <View style={styles.specBox}>
                      <Text style={styles.specTitle}>Konteyner</Text>
                      <Text style={styles.specValue}>{selectedOrder.containerSizeM3} m³</Text>
                    </View>
                    <View style={styles.specBox}>
                      <Text style={styles.specTitle}>Muddati</Text>
                      <Text style={styles.specValue}>{selectedOrder.rentalDuration.replace('_', ' ')}</Text>
                    </View>
                  </View>
                </View>

                {/* Operator notes */}
                {selectedOrder.operatorNote && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Operator izohi / Заметка оператора</Text>
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText}>{selectedOrder.operatorNote}</Text>
                    </View>
                  </View>
                )}

                {/* Actions based on status */}
                {selectedOrder.status !== 'completed' && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Harakatlar / Действия</Text>

                    {selectedOrder.status === 'assigned' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                        onPress={() => handleUpdateStatus(selectedOrder.id, 'in_progress')}
                      >
                        <Truck size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.actionBtnText}>Yo'lga chiqish / В пути</Text>
                      </TouchableOpacity>
                    )}

                    {selectedOrder.status === 'in_progress' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#f97316' }]}
                        onPress={() => handleUpdateStatus(selectedOrder.id, 'container_placed')}
                      >
                        <CheckCircle size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.actionBtnText}>Konteyner qo'yildi / Установлен</Text>
                      </TouchableOpacity>
                    )}

                    {selectedOrder.status === 'container_placed' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#14b8a6' }]}
                        onPress={() => handleUpdateStatus(selectedOrder.id, 'picked_up')}
                      >
                        <Truck size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.actionBtnText}>Konteynerni yuklash / Забран</Text>
                      </TouchableOpacity>
                    )}

                    {/* Completion actions (requires payment selection) */}
                    {(selectedOrder.status === 'picked_up' || selectedOrder.status === 'container_placed') && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.paymentSelectTitle}>To'lov usuli bilan yakunlash / Завершить с оплатой:</Text>

                        <TouchableOpacity
                          style={[styles.paymentBtn, { backgroundColor: '#10b981' }]}
                          onPress={() => handleCompleteOrder(selectedOrder.id, 'cash')}
                        >
                          <Coins size={20} color="#fff" style={{ marginRight: 8 }} />
                          <Text style={styles.paymentBtnText}>💵 Naqd pul oldim / Наличные</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.paymentBtn, { backgroundColor: '#3b82f6' }]}
                          onPress={() => handleCompleteOrder(selectedOrder.id, 'card')}
                        >
                          <CreditCard size={20} color="#fff" style={{ marginRight: 8 }} />
                          <Text style={styles.paymentBtnText}>💳 Karta orqali oldim / Карта</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.paymentBtn, { backgroundColor: '#6366f1' }]}
                          onPress={() => handleCompleteOrder(selectedOrder.id, 'online')}
                        >
                          <PlusCircle size={20} color="#fff" style={{ marginRight: 8 }} />
                          <Text style={styles.paymentBtnText}>📱 Onlayn o'tkazma / Онлайн</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  settingsBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  appSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  loginBtn: {
    backgroundColor: '#4f46e5',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 12,
    marginTop: 40,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  driverInfoArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  vehiclePlateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  plateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#1e293b',
    fontWeight: '700',
  },
  ordersListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  amountText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10b981',
    flex: 1,
  },
  paymentTypeBadge: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalScroll: {
    flex: 1,
    marginTop: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusBadgeLargeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clientNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  phoneText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
  },
  modalInfoText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
  },
  specTitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  noteBox: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  paymentSelectTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 10,
    marginTop: 10,
  },
  paymentBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  paymentBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
