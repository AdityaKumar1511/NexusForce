import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db, isMock } from './firebase';
import * as mockDb from './mockDb';
import { Notification } from './types';

const notificationsCol = db ? collection(db, 'notifications') : null;

export async function createNotification(notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) {
  if (isMock) return mockDb.createNotification(notification);
  if (!notificationsCol) return null;
  try {
    const docRef = await addDoc(notificationsCol, {
      ...notification,
      isRead: false,
      timestamp: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export function subscribeToNotifications(recipient: string, callback: (notifications: Notification[]) => void) {
  if (isMock) {
    callback(mockDb.getNotifications(recipient));
    return mockDb.subscribe(() => callback(mockDb.getNotifications(recipient)));
  }
  if (!db || !notificationsCol) return () => {};
  const q = query(
    notificationsCol,
    where('recipient', '==', recipient),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, {
    next: (snap) => {
      const notifications = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: (d.data().timestamp as any)?.toDate() || new Date(),
      })) as Notification[];
      callback(notifications);
    },
    error: (err) => {
      console.warn('Firestore notifications subscription error:', err);
    }
  });
}

export async function markAsRead(notificationId: string) {
  if (isMock) return mockDb.markAsRead(notificationId);
  if (!db) return;
  const ref = doc(db, 'notifications', notificationId);
  await updateDoc(ref, { isRead: true });
}

export async function markAllAsRead(recipient: string, notifications: Notification[]) {
  if (isMock) return mockDb.markAllAsRead(recipient, notifications);
  const unread = notifications.filter(n => !n.isRead && n.recipient === recipient);
  const promises = unread.map(n => markAsRead(n.id));
  await Promise.all(promises);
}
