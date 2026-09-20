"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { getOrdersByStore, createNotification } from "@/app/services/orderAPI";
import io from "socket.io-client";
import SERVERURL from "@/app/services/serverURL";
import { useQueryClient } from "@tanstack/react-query";

const NOTIFICATION_ENABLED_PATHS = [
  "/All-store-management/Orders",
  "/All-store-management/All-Orders",
  "/All-store-management/Order-Requests"
];

const RING_INTERVAL = 5000;
const MAX_RING_DURATION = 20 * 60 * 1000;
const POLLING_INTERVAL = 600000;
const SYNC_DEBOUNCE = 2000;
const MIN_SYNC_INTERVAL = 60000;

const OrderNotificationContext = createContext();

export function OrderNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRinging, setIsRinging] = useState(false);
  const pathname = usePathname();

  const queryClient = useQueryClient();

  const ringingIntervalRef = useRef(null);
  const ringingTimeoutRef = useRef(null);
  const isRingingRef = useRef(false);
  const audioRef = useRef(null);
  const notifIdsRef = useRef(new Set());
  const isAudioUnlocked = useRef(false);
  const socketRef = useRef(null);
  const isSocketConnected = useRef(false);
  const pollingIntervalRef = useRef(null);
  const pollingActiveRef = useRef(false);
  const isInitializedRef = useRef(false);
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef(null);
  const lastSyncTimeRef = useRef(0);

  // ---- Helper: get storeId only if the user is a store (role === 'store') ----
  const getStoreId = useCallback(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // ✅ Only store users have role 'store' – skip staff/pharmacist
        if (payload.role === 'store' && payload.id) {
          return payload.id; // ObjectId
        }
      } catch (_) {}
    }
    // Fallback to stored storeId if it looks like a valid ObjectId
    const storeId = localStorage.getItem('storeId') || sessionStorage.getItem('storeId');
    if (storeId && storeId.match(/^[0-9a-fA-F]{24}$/)) {
      return storeId;
    }
    return null;
  }, []);

  // ---- Preload audio ----
  useEffect(() => {
    audioRef.current = new Audio("/audio/notification-2.mp3");
    audioRef.current.preload = "auto";
    audioRef.current.volume = 0.7;
    audioRef.current.loop = false;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ---- Unlock audio ----
  useEffect(() => {
    const unlockAudio = () => {
      if (isAudioUnlocked.current) return;
      const silent = new Audio();
      silent.volume = 0;
      silent.play()
        .then(() => {
          silent.pause();
          isAudioUnlocked.current = true;
          document.removeEventListener("click", unlockAudio);
          document.removeEventListener("touchstart", unlockAudio);
          if (isRingingRef.current) playSound();
        })
        .catch(() => {});
    };
    document.addEventListener("click", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);
    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // ---- Play sound ----
  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    if (!audioRef.current) return;
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      const promise = audioRef.current.play();
      if (promise !== undefined) {
        promise.catch(() => {});
      }
    } catch (_) {}
  }, [soundEnabled]);

  // ---- Stop ringing ----
  const stopRinging = useCallback((reason) => {
    if (ringingIntervalRef.current) {
      clearInterval(ringingIntervalRef.current);
      ringingIntervalRef.current = null;
    }
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    if (isRingingRef.current) {
      isRingingRef.current = false;
      setIsRinging(false);
    }
  }, []);

  // ---- Start ringing ----
  const startRinging = useCallback(() => {
    if (isRingingRef.current) return;
    isRingingRef.current = true;
    setIsRinging(true);

    playSound();

    if (ringingIntervalRef.current) clearInterval(ringingIntervalRef.current);
    ringingIntervalRef.current = setInterval(() => {
      if (isRingingRef.current) playSound();
    }, RING_INTERVAL);

    if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
    ringingTimeoutRef.current = setTimeout(() => {
      if (isRingingRef.current) stopRinging("max duration");
    }, MAX_RING_DURATION);
  }, [playSound, stopRinging]);

  // ---- Ring on path & notifications change ----
  useEffect(() => {
    const isEnabled = NOTIFICATION_ENABLED_PATHS.some(p => pathname.startsWith(p));
    const unreadCount = notifications.filter(n => !n.read).length;

    if (isEnabled && unreadCount > 0 && !isRingingRef.current) {
      startRinging();
    } else if ((!isEnabled || unreadCount === 0) && isRingingRef.current) {
      stopRinging("unread zero or path disabled");
    }
  }, [pathname, notifications, startRinging, stopRinging]);

  // ---- Add new notifications ----
  const addNewNotifications = useCallback((newNotifs) => {
    if (newNotifs.length === 0) return;

    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const filtered = newNotifs.filter(n => !existingIds.has(n.id));
      return [...filtered, ...prev];
    });

    newNotifs.forEach(n => {
      const key = `${n.orderId}-${n.itemId}`;
      notifIdsRef.current.add(key);
    });

    queryClient.invalidateQueries({ queryKey: ['orders'] });

    const isEnabled = NOTIFICATION_ENABLED_PATHS.some(p => pathname.startsWith(p));
    if (isEnabled) {
      startRinging();
    }
  }, [startRinging, queryClient, pathname]);

  // ---- syncNotifications – only for store users ----
  const syncNotifications = useCallback(async (silent = false) => {
    const isEnabled = NOTIFICATION_ENABLED_PATHS.some(p => pathname.startsWith(p));
    if (!isEnabled) return;
    if (isSocketConnected.current && !silent) return;
    const now = Date.now();
    if (now - lastSyncTimeRef.current < MIN_SYNC_INTERVAL) return;
    if (isSyncingRef.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    const storeId = getStoreId();
    if (!storeId) {
      console.warn('⚠️ No storeId – skipping sync (user may be staff)');
      return;
    }

    syncTimeoutRef.current = setTimeout(async () => {
      lastSyncTimeRef.current = Date.now();
      isSyncingRef.current = true;
      try {
        const response = await getOrdersByStore(storeId);
        if (!response.success) {
          isSyncingRef.current = false;
          syncTimeoutRef.current = null;
          return;
        }
        const currentOrders = response.data || [];

        const pendingItemsMap = new Map();
        currentOrders.forEach(order => {
          (order.items || []).forEach(item => {
            const key = `${order._id}-${item._id}`;
            if (item.status === "pending") {
              pendingItemsMap.set(key, { order, item });
            }
          });
        });

        setNotifications(prev => {
          const filtered = prev.filter(notif => {
            const key = `${notif.orderId}-${notif.itemId}`;
            return pendingItemsMap.has(key);
          });
          return filtered;
        });

        const keysToRemove = [];
        notifIdsRef.current.forEach(key => {
          if (!pendingItemsMap.has(key)) keysToRemove.push(key);
        });
        keysToRemove.forEach(key => notifIdsRef.current.delete(key));

        if (pendingItemsMap.size === 0) {
          if (isRingingRef.current) stopRinging("no pending items");
          setNotifications([]);
          notifIdsRef.current.clear();
          isSyncingRef.current = false;
          syncTimeoutRef.current = null;
          return;
        }

        let newNotifs = [];
        for (const [key, { order, item }] of pendingItemsMap) {
          if (notifIdsRef.current.has(key)) continue;

          const shortId = order._id.substring(order._id.length - 8);
          const message = `New order #${shortId} - ${item.productName} (Qty: ${item.quantity || 1})`;
          try {
            const result = await createNotification(order._id, message);
            if (result.success) {
              newNotifs.push({
                id: result.data._id,
                orderId: order._id,
                itemId: item._id,
                message,
                productName: item.productName,
                timestamp: new Date(order.createdAt),
                read: false,
              });
            }
          } catch (_) {}
        }

        if (newNotifs.length > 0) {
          addNewNotifications(newNotifs);
          const isEnabled = NOTIFICATION_ENABLED_PATHS.some(p => pathname.startsWith(p));
          if (!silent && isEnabled) {
            toast.info(`📦 ${newNotifs.length} new order item${newNotifs.length > 1 ? "s" : ""} received`, { duration: 5000 });
          }
        }

        const currentUnread = notifications.filter(n => !n.read).length;
        if (currentUnread === 0 && isRingingRef.current) {
          stopRinging("no unread after sync");
        }

      } catch (_) {
        stopRinging("sync error");
      } finally {
        isSyncingRef.current = false;
        syncTimeoutRef.current = null;
      }
    }, SYNC_DEBOUNCE);
  }, [addNewNotifications, stopRinging, notifications, pathname, getStoreId]);

  // ---- Socket.IO listener ----
  useEffect(() => {
    const socket = io(SERVERURL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      isSocketConnected.current = true;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        pollingActiveRef.current = false;
      }

      const storeId = getStoreId();
      if (storeId) {
        socket.emit('join-store-room', storeId);
        console.log(`✅ Socket ${socket.id} joined room: store-${storeId}`);
      } else {
        console.warn('⚠️ No storeId – skipping room join (user may be staff)');
      }

      const isEnabled = NOTIFICATION_ENABLED_PATHS.some(p => pathname.startsWith(p));
      if (isEnabled && storeId) {
        const now = Date.now();
        if (now - lastSyncTimeRef.current > MIN_SYNC_INTERVAL) {
          syncNotifications(true);
        }
      }
    });

    socket.on("disconnect", () => {
      isSocketConnected.current = false;
      const isEnabled = NOTIFICATION_ENABLED_PATHS.some(p => pathname.startsWith(p));
      if (isEnabled && !pollingActiveRef.current) {
        setTimeout(() => {
          if (!isSocketConnected.current && !pollingActiveRef.current) {
            pollingActiveRef.current = true;
            pollingIntervalRef.current = setInterval(() => {
              syncNotifications(false);
            }, POLLING_INTERVAL);
          }
        }, 5000);
      }
    });

    socket.on("new_order", async (data) => {
      const { orderId, order } = data;
      if (!order || !order.items) return;

      const currentStoreId = getStoreId();
      if (!currentStoreId) {
        console.warn('⚠️ No storeId – ignoring order');
        return;
      }
      if (order.storeId && order.storeId !== currentStoreId) {
        console.warn(`⚠️ Ignoring order for different store (${order.storeId} vs ${currentStoreId})`);
        return;
      }

      const pendingItems = order.items.filter(item => item.status === "pending");
      if (pendingItems.length === 0) return;

      const newNotifs = [];
      for (const item of pendingItems) {
        const key = `${orderId}-${item._id}`;
        if (notifIdsRef.current.has(key)) continue;

        const shortId = orderId.substring(orderId.length - 8);
        const message = `New order #${shortId} - ${item.productName} (Qty: ${item.quantity || 1})`;

        try {
          const result = await createNotification(orderId, message);
          if (result.success) {
            newNotifs.push({
              id: result.data._id,
              orderId: orderId,
              itemId: item._id,
              message,
              productName: item.productName,
              timestamp: new Date(order.createdAt || Date.now()),
              read: false,
            });
          }
        } catch (_) {}
      }

      if (newNotifs.length > 0) {
        addNewNotifications(newNotifs);
        const isEnabled = NOTIFICATION_ENABLED_PATHS.some(p => pathname.startsWith(p));
        if (isEnabled) {
          toast.info(`📦 ${pendingItems.length} new order item${pendingItems.length > 1 ? "s" : ""} received!`, { duration: 5000 });
        }
      }
    });

    return () => {
      socket.off("new_order");
      socket.disconnect();
      socketRef.current = null;
      isSocketConnected.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        pollingActiveRef.current = false;
      }
    };
  }, [pathname, startRinging, addNewNotifications, syncNotifications, getStoreId]);

  // ---- triggerNewOrder ----
  const triggerNewOrder = useCallback(async (order) => {
    if (!order?.items) return;
    const pendingItems = order.items.filter(item => item.status === "pending");
    if (pendingItems.length === 0) return;

    const newNotifs = [];
    for (const item of pendingItems) {
      const key = `${order._id}-${item._id}`;
      if (notifIdsRef.current.has(key)) continue;
      const shortId = order._id.substring(order._id.length - 8);
      const message = `New order #${shortId} - ${item.productName} (Qty: ${item.quantity || 1})`;
      try {
        const result = await createNotification(order._id, message);
        if (result.success) {
          newNotifs.push({
            id: result.data._id,
            orderId: order._id,
            itemId: item._id,
            message,
            productName: item.productName,
            timestamp: new Date(order.createdAt),
            read: false,
          });
        }
      } catch (_) {}
    }
    if (newNotifs.length === 0) return;
    addNewNotifications(newNotifs);
    const isEnabled = NOTIFICATION_ENABLED_PATHS.some(p => pathname.startsWith(p));
    if (isEnabled) {
      toast.info(`📦 ${pendingItems.length} new order item${pendingItems.length > 1 ? "s" : ""} placed!`, { duration: 5000 });
    }
  }, [pathname, addNewNotifications]);

  // ---- Polling (fallback) – with path check ----
  useEffect(() => {
    const isEnabled = NOTIFICATION_ENABLED_PATHS.some(p => pathname.startsWith(p));

    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lastSyncTimeRef.current = 0;
      if (isEnabled) {
        syncNotifications(false);
      }
    }

    if (isEnabled && !isSocketConnected.current && !pollingActiveRef.current) {
      pollingActiveRef.current = true;
      pollingIntervalRef.current = setInterval(() => {
        syncNotifications(false);
      }, POLLING_INTERVAL);
    } else if (!isEnabled && pollingActiveRef.current) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      pollingActiveRef.current = false;
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        pollingActiveRef.current = false;
      }
      stopRinging("component unmount");
    };
  }, [pathname, syncNotifications, stopRinging]);

  // ---- Refresh functions ----
  const refreshNotificationsSilent = useCallback(() => {
    lastSyncTimeRef.current = 0;
    syncNotifications(true);
  }, [syncNotifications]);

  const refreshNotificationsWithSound = useCallback(() => {
    lastSyncTimeRef.current = 0;
    syncNotifications(false);
  }, [syncNotifications]);

  // ---- Mark all as read ----
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (isRingingRef.current) {
      stopRinging("mark all read");
    }
  }, [stopRinging]);

  // ---- markAsRead ----
  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setTimeout(() => {
      const unread = notifications.filter(n => !n.read).length;
      if (unread === 0 && isRingingRef.current) {
        stopRinging("all read");
      }
    }, 100);
  }, [notifications, stopRinging]);

  // ---- Clear all ----
  const clearAll = useCallback(() => {
    setNotifications([]);
    notifIdsRef.current.clear();
    stopRinging("clear all");
  }, [stopRinging]);

  // ---- Toggle sound ----
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  // ---- Test emit ----
  const testEmit = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("test_event", { from: "frontend", time: Date.now() });
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <OrderNotificationContext.Provider value={{
      notifications,
      unreadCount,
      isRinging,
      markAllAsRead,
      markAsRead,
      clearAll,
      soundEnabled,
      toggleSound,
      playNotificationSound: playSound,
      refreshNotificationsSilent,
      refreshNotificationsWithSound,
      triggerNewOrder,
      testEmit,
      stopRinging,
    }}>
      {children}
    </OrderNotificationContext.Provider>
  );
}

export function useOrderNotifications() {
  return useContext(OrderNotificationContext);
}