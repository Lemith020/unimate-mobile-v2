import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationBar from '../component/home_page/navigation_bar/NavigationBar';

const API_URL = 'http://10.0.2.2:5000/api/orders/my';
const PAGE_SIZE = 20;

type OrderItem = {
  id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
};

type Order = {
  id: string;
  place_id: string | null;
  shop_name: string | null;
  shop_address: string | null;
  order_type: string;
  status: string;
  total_amount: number;
  contact_phone: string;
  delivery_address: string | null;
  note: string | null;
  created_at: string;
  items: OrderItem[];
};

type Session = {
  id: string;
  token: string;
};

type StatusStyle = {
  label: string;
  background: string;
  color: string;
};

const STATUS_STYLES: Record<string, StatusStyle> = {
  placed: {
    label: 'Placed',
    background: '#FFF7ED',
    color: '#C2410C',
  },
  accepted: {
    label: 'Accepted',
    background: '#DBEAFE',
    color: '#1D4ED8',
  },
  preparing: {
    label: 'Preparing',
    background: '#FEF3C7',
    color: '#A16207',
  },
  ready: {
    label: 'Ready',
    background: '#DCFCE7',
    color: '#15803D',
  },
  completed: {
    label: 'Completed',
    background: '#D1FAE5',
    color: '#047857',
  },
  cancelled: {
    label: 'Cancelled',
    background: '#FEE2E2',
    color: '#B91C1C',
  },
  rejected: {
    label: 'Rejected',
    background: '#FEE2E2',
    color: '#B91C1C',
  },
};

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatus(status: string): StatusStyle {
  return STATUS_STYLES[status] || {
    label: titleCase(status),
    background: '#F5F5F4',
    color: '#57534E',
  };
}

function money(value: number) {
  return `Rs. ${value.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleString('en-GB', {
    timeZone: 'Asia/Colombo',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeOrder(value: unknown): Order {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid order response.');
  }

  const row = value as Record<string, unknown>;

  if (
    typeof row.id !== 'string' ||
    typeof row.status !== 'string' ||
    typeof row.created_at !== 'string' ||
    typeof row.total_amount !== 'number' ||
    !Number.isFinite(row.total_amount) ||
    row.total_amount < 0 ||
    !Array.isArray(row.items)
  ) {
    throw new Error('Invalid order response.');
  }

  const items: OrderItem[] = row.items.map((value: unknown) => {
    if (!value || typeof value !== 'object') {
      throw new Error('Invalid order item.');
    }

    const item = value as Record<string, unknown>;

    if (
      typeof item.id !== 'string' ||
      typeof item.item_name !== 'string' ||
      typeof item.unit_price !== 'number' ||
      !Number.isFinite(item.unit_price) ||
      item.unit_price < 0 ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new Error('Invalid order item.');
    }

    return {
      id: item.id,
      item_name: item.item_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
    };
  });

  return {
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    total_amount: row.total_amount,
    items,
    place_id: typeof row.place_id === 'string' ? row.place_id : null,
    shop_name: typeof row.shop_name === 'string' ? row.shop_name : null,
    shop_address:
      typeof row.shop_address === 'string' ? row.shop_address : null,
    order_type:
      typeof row.order_type === 'string' ? row.order_type : 'pickup',
    contact_phone:
      typeof row.contact_phone === 'string' ? row.contact_phone : '',
    delivery_address:
      typeof row.delivery_address === 'string'
        ? row.delivery_address
        : null,
    note: typeof row.note === 'string' ? row.note : null,
  };
}

class SessionError extends Error {}

function StatusBadge({ status }: { status: string }) {
  const appearance = getStatus(status);

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: appearance.background },
      ]}
    >
      <Text style={[styles.statusText, { color: appearance.color }]}>
        {appearance.label}
      </Text>
    </View>
  );
}

export default function MyOrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');
  const [error, setError] = useState('');
  const [moreError, setMoreError] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const sessionRef = useRef<Session | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const activeRef = useRef(false);
  const busyRef = useRef(false);
  const requestVersion = useRef(0);
  const offsetRef = useRef(0);

  const loadOrders = useCallback(
    async (mode: 'initial' | 'refresh' | 'more') => {
      if (!activeRef.current) return;
      if (mode === 'more' && busyRef.current) return;

      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      const version = ++requestVersion.current;
      busyRef.current = true;

      const isCurrent = () =>
        activeRef.current &&
        requestVersion.current === version &&
        !controller.signal.aborted;

      if (mode === 'initial') {
        setLoading(true);
        setOrders([]);
        setHasMore(false);
        sessionRef.current = null;
      }

      setRefreshing(mode === 'refresh');
      setLoadingMore(mode === 'more');
      setError('');
      setMoreError('');

      if (mode !== 'more') setSelectedOrder(null);

      try {
        const stored = await AsyncStorage.getItem('userData');
        if (!isCurrent()) return;

        const user = stored ? JSON.parse(stored) : null;

        if (
          typeof user?.id !== 'string' ||
          typeof user?.token !== 'string' ||
          !user.token.trim()
        ) {
          throw new SessionError(
            'Log in to view your orders. If you are already logged in, please log in again.'
          );
        }

        const session: Session = {
          id: user.id,
          token: user.token,
        };

        const previous = sessionRef.current;
        const accountChanged =
          previous !== null &&
          (previous.id !== session.id || previous.token !== session.token);

        const append = mode === 'more' && !accountChanged;
        const offset = append ? offsetRef.current : 0;

        if (accountChanged) {
          setOrders([]);
          setSelectedOrder(null);
          setHasMore(false);
        }

        sessionRef.current = session;
        setLoginRequired(false);
        setSessionMessage('');

        const response = await fetch(
          `${API_URL}?limit=${PAGE_SIZE}&offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
            signal: controller.signal,
          }
        );

        if (response.status === 401 || response.status === 403) {
          throw new SessionError(
            'Please log in again to view your orders.'
          );
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load your orders.');
        }

        if (!Array.isArray(data.orders)) {
          throw new Error('Invalid response from the server.');
        }

        const received = data.orders.map(normalizeOrder);

        if (!isCurrent()) return;

        setOrders((current) => {
          if (!append) return received;

          const combined = new Map(
            current.map((order) => [order.id, order])
          );

          received.forEach((order: Order) => {
            combined.set(order.id, order);
          });

          return Array.from(combined.values());
        });

        offsetRef.current = offset + received.length;
        setHasMore(data.has_more === true);
      } catch (loadError) {
        if (!isCurrent()) return;

        if (loadError instanceof SessionError) {
          sessionRef.current = null;
          offsetRef.current = 0;
          setOrders([]);
          setSelectedOrder(null);
          setHasMore(false);
          setLoginRequired(true);
          setSessionMessage(loadError.message);
        } else {
          const message =
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load your orders. Please try again.';

          if (mode === 'more') setMoreError(message);
          else setError(message);
        }
      } finally {
        if (isCurrent()) {
          busyRef.current = false;
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      activeRef.current = true;
      loadOrders('initial');

      return () => {
        activeRef.current = false;
        requestVersion.current += 1;
        busyRef.current = false;
        controllerRef.current?.abort();
      };
    }, [loadOrders])
  );

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home_page');
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const quantity = item.items.reduce(
      (sum, food) => sum + food.quantity,
      0
    );

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.85}
        onPress={() => setSelectedOrder(item)}
        accessibilityRole="button"
        accessibilityLabel={`View order from ${item.shop_name || 'shop'}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.shopIcon}>
            <Ionicons
              name="restaurant-outline"
              size={23}
              color="#EA580C"
            />
          </View>

          <View style={styles.flex}>
            <Text style={styles.shopName} numberOfLines={1}>
              {item.shop_name || 'Shop unavailable'}
            </Text>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </View>

          <StatusBadge status={item.status} />
        </View>

        <Text style={styles.foodNames} numberOfLines={2}>
          {item.items.length
            ? item.items
                .map((food) => `${food.item_name} × ${food.quantity}`)
                .join(', ')
            : 'No item details available'}
        </Text>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.total}>{money(item.total_amount)}</Text>
            <Text style={styles.smallText}>
              {quantity} {quantity === 1 ? 'item' : 'items'}
              {' · '}
              {titleCase(item.order_type)}
            </Text>
          </View>

          <View style={styles.detailsLink}>
            <Text style={styles.detailsText}>Details</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="#EA580C"
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
   <SafeAreaView
  style={styles.screen}
  edges={['top', 'left', 'right']}
>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={23} color="#431407" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Orders</Text>

        <TouchableOpacity
          style={styles.iconButton}
          disabled={loading || refreshing}
          onPress={() => loadOrders('refresh')}
          accessibilityRole="button"
          accessibilityLabel="Refresh orders"
        >
          <Ionicons name="refresh" size={22} color="#EA580C" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.message}>Loading your orders...</Text>
        </View>
      ) : loginRequired ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="lock-closed-outline" size={42} color="#F97316" />
          </View>
          <Text style={styles.emptyTitle}>Your orders await</Text>
          <Text style={styles.message}>{sessionMessage}</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryText}>Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(order) => order.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadOrders('refresh')}
          ListHeaderComponent={
            <View>
              <View style={styles.intro}>
                <Ionicons name="receipt-outline" size={28} color="#EA580C" />
                <View style={styles.flex}>
                  <Text style={styles.introTitle}>Every meal, in one place</Text>
                  <Text style={styles.introText}>
                    Pull down to check the latest order status.
                  </Text>
                </View>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity
                    style={styles.textButton}
                    onPress={() => loadOrders('refresh')}
                  >
                    <Text style={styles.detailsText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            !error ? (
              <View style={styles.emptyContent}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="bag-handle-outline" size={44} color="#F97316" />
                </View>
                <Text style={styles.emptyTitle}>No orders yet</Text>
                <Text style={styles.message}>
                  Your food orders will appear here after you place an order.
                </Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push('/food')}
                >
                  <Text style={styles.primaryText}>Explore food shops</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListFooterComponent={
            <View style={styles.listFooter}>
              {moreError ? (
                <Text style={styles.errorText}>{moreError}</Text>
              ) : null}

              {hasMore ? (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  disabled={loadingMore || refreshing}
                  onPress={() => loadOrders('more')}
                >
                  {loadingMore ? (
                    <ActivityIndicator color="#EA580C" />
                  ) : (
                    <Text style={styles.detailsText}>
                      {moreError ? 'Retry loading more' : 'Load more orders'}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}

      <Modal
        visible={selectedOrder !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>


          
          <SafeAreaView
            style={styles.modalSheet}
            edges={['bottom']}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order details</Text>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setSelectedOrder(null)}
                accessibilityRole="button"
                accessibilityLabel="Close order details"
              >
                <Ionicons name="close" size={23} color="#57534E" />
              </TouchableOpacity>
            </View>

            {selectedOrder ? (
              <ScrollView
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.detailShopName}>
                  {selectedOrder.shop_name || 'Shop unavailable'}
                </Text>

                <Text style={styles.date}>
                  {formatDate(selectedOrder.created_at)}
                </Text>

                <View style={styles.detailStatus}>
                  <StatusBadge status={selectedOrder.status} />
                </View>

                <Text style={styles.fieldLabel}>Order ID</Text>
                <Text selectable style={styles.orderId}>
                  {selectedOrder.id}
                </Text>

                <Text style={styles.sectionTitle}>Your items</Text>

                {selectedOrder.items.map((food) => (
                  <View key={food.id} style={styles.itemRow}>
                    <View style={styles.flex}>
                      <Text style={styles.itemName}>{food.item_name}</Text>
                      <Text style={styles.smallText}>
                        {money(food.unit_price)} × {food.quantity}
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>
                      {money(food.unit_price * food.quantity)}
                    </Text>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={styles.sectionTitle}>Total</Text>
                  <Text style={styles.total}>
                    {money(selectedOrder.total_amount)}
                  </Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.fieldLabel}>Order type</Text>
                  <Text style={styles.fieldValue}>
                    {titleCase(selectedOrder.order_type)}
                  </Text>

                  {selectedOrder.contact_phone ? (
                    <>
                      <Text style={styles.fieldLabel}>Contact number</Text>
                      <Text style={styles.fieldValue}>
                        {selectedOrder.contact_phone}
                      </Text>
                    </>
                  ) : null}

                  {selectedOrder.shop_address ? (
                    <>
                      <Text style={styles.fieldLabel}>Shop address</Text>
                      <Text style={styles.fieldValue}>
                        {selectedOrder.shop_address}
                      </Text>
                    </>
                  ) : null}

                  {selectedOrder.delivery_address ? (
                    <>
                      <Text style={styles.fieldLabel}>Delivery address</Text>
                      <Text style={styles.fieldValue}>
                        {selectedOrder.delivery_address}
                      </Text>
                    </>
                  ) : null}

                  {selectedOrder.note ? (
                    <>
                      <Text style={styles.fieldLabel}>Your note</Text>
                      <Text style={styles.fieldValue}>
                        {selectedOrder.note}
                      </Text>
                    </>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setSelectedOrder(null)}
                >
                  <Text style={styles.primaryText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>
      <NavigationBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8EE' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFEDD5',
  },
  headerTitle: {
    flex: 1,
    fontSize: 21,
    fontWeight: '700',
    color: '#431407',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: '#78716C',
  },
  listContent: { flexGrow: 1, padding: 18 },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFEDD5',
    padding: 17,
    borderRadius: 17,
    marginBottom: 18,
  },
  introTitle: { fontSize: 15, fontWeight: '700', color: '#9A3412' },
  introText: { marginTop: 5, fontSize: 12, lineHeight: 18, color: '#9A3412' },
  orderCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: 13,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shopIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: { fontSize: 14, fontWeight: '700', color: '#292524' },
  date: { fontSize: 10, color: '#78716C', marginTop: 5 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  foodNames: { fontSize: 13, lineHeight: 21, color: '#57534E', marginTop: 15 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#FFF1E6',
    paddingTop: 13,
    marginTop: 13,
  },
  total: { fontSize: 18, fontWeight: '700', color: '#EA580C' },
  smallText: { fontSize: 11, lineHeight: 18, color: '#78716C', marginTop: 4 },
  detailsLink: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  detailsText: { fontSize: 12, fontWeight: '700', color: '#EA580C' },
  emptyContent: { paddingVertical: 45, alignItems: 'center', gap: 17 },
  emptyIcon: {
    width: 94,
    height: 94,
    borderRadius: 30,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#431407' },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#F97316',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  errorBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#FEF2F2',
  },
  errorText: { fontSize: 12, lineHeight: 19, color: '#B91C1C' },
  textButton: { alignSelf: 'flex-start', paddingVertical: 12 },
  listFooter: { paddingVertical: 10, gap: 10 },
  loadMoreButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEDD5',
  },
  modalTitle: { fontSize: 19, fontWeight: '700', color: '#431407' },
  modalContent: { padding: 20, paddingBottom: 28 },
  detailShopName: { fontSize: 22, fontWeight: '700', color: '#292524' },
  detailStatus: { marginTop: 12, marginBottom: 8 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78716C',
    marginTop: 14,
  },
  orderId: { fontSize: 11, lineHeight: 18, color: '#57534E', marginTop: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#431407', marginTop: 20 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  itemName: { fontSize: 14, fontWeight: '600', color: '#292524' },
  itemTotal: { fontSize: 13, fontWeight: '600', color: '#44403C' },
  totalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 18,
  },
  infoBox: {
    backgroundColor: '#FAFAF9',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingBottom: 16,
    marginBottom: 20,
  },
  fieldValue: { fontSize: 13, lineHeight: 21, color: '#44403C', marginTop: 5 },
});