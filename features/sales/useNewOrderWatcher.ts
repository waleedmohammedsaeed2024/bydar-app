import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { CLIENT_ID } from '@/lib/tenant';
import { useNotificationsStore } from '@/stores/notifications';

const SOUND = (() => {
  try {
    return require('@/assets/sounds/new-order.mp3');
  } catch {
    return null;
  }
})();

// Show banners even when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Legacy fields for older SDKs:
    shouldShowAlert: true,
  }) as Notifications.NotificationBehavior,
});

async function ensureNotificationsReady() {
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted) {
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: true },
    });
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('new-orders', {
      name: 'طلبات جديدة',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  } catch {
    // older API or web
  }
}

export function useNewOrderWatcher() {
  const push = useNotificationsStore((s) => s.push);
  const qc = useQueryClient();
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    ensureNotificationsReady();

    if (SOUND) {
      try {
        const p = createAudioPlayer(SOUND);
        p.volume = 1.0;
        playerRef.current = p;
      } catch {
        playerRef.current = null;
      }
    }

    const channel = supabase
      .channel('sales_order_inserts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales_order',
          filter: `client_id=eq.${CLIENT_ID}`,
        },
        (payload) => {
          const row = payload.new as { id?: string } | null;
          const id = row?.id;
          if (!id) return;
          push(id);
          qc.invalidateQueries({ queryKey: ['salesOrders'] });

          Notifications.scheduleNotificationAsync({
            content: {
              title: 'طلب مبيعات جديد',
              body: `تم إنشاء طلب جديد · #${id.slice(0, 6)}`,
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
              data: { orderId: id },
            },
            trigger: Platform.OS === 'android'
              ? { channelId: 'new-orders' } as Notifications.NotificationTriggerInput
              : null,
          }).catch(() => {});

          try {
            const ap = playerRef.current;
            if (ap) {
              ap.seekTo(0);
              ap.play();
            }
          } catch {
            // ignore
          }
        },
      )
      .subscribe((status) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[sales_order realtime]', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      playerRef.current?.remove();
      playerRef.current = null;
    };
  }, [push, qc]);
}
