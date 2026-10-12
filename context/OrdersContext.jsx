"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AUTH_CHANGED_EVENT,
  ORDERS_CHANGED_EVENT,
  customerAuthHeaders,
  emitOrdersChanged,
  readCustomerAccessToken,
} from "@/lib/adminSession";
import { readLocalOrders, saveLocalOrder } from "@/lib/storage";

const OrdersContext = createContext(null);

async function fetchAccountOrders(token) {
  if (!token) return null;
  const response = await fetch("/api/orders/mine", {
    headers: customerAuthHeaders(token),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Unable to load orders.");
  const data = await response.json().catch(() => ({}));
  return Array.isArray(data.orders) ? data.orders : [];
}

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [isAccount, setIsAccount] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const load = useCallback(async () => {
    const token = readCustomerAccessToken();
    if (!token) {
      setIsAccount(false);
      setOrders(readLocalOrders());
      setIsReady(true);
      return;
    }

    setIsAccount(true);
    setIsReady(false);
    try {
      const remote = await fetchAccountOrders(token);
      if (!remote) {
        setIsAccount(false);
        setOrders(readLocalOrders());
        return;
      }
      setOrders(remote);
    } catch {
      setOrders([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(AUTH_CHANGED_EVENT, load);
    window.addEventListener(ORDERS_CHANGED_EVENT, load);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, load);
      window.removeEventListener(ORDERS_CHANGED_EVENT, load);
    };
  }, [load]);

  const rememberGuestOrder = useCallback((order) => {
    if (!order?.id) return;
    saveLocalOrder(order);
    if (!readCustomerAccessToken()) {
      setOrders(readLocalOrders());
    }
    emitOrdersChanged();
  }, []);

  const value = useMemo(
    () => ({
      orders,
      count: orders.length,
      isReady,
      isAccount,
      reload: load,
      rememberGuestOrder,
    }),
    [isAccount, isReady, load, orders, rememberGuestOrder]
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within OrdersProvider");
  }
  return context;
}
