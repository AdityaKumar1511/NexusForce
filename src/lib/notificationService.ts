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
import { db } from './firebase';
import { Notification } from './types';

const notificationsCol = collection(db, 'notifications');

export async function createNotification(notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) {
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
  const q = query(
    notificationsCol,
    where('recipient', '==', recipient),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snap) => {
    const notifications = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: (d.data().timestamp as any)?.toDate() || new Date(),
    })) as Notification[];
    callback(notifications);
  });
}

export async function markAsRead(notificationId: string) {
  const ref = doc(db, 'notifications', notificationId);
  await updateDoc(ref, { isRead: true });
}

export async function markAllAsRead(recipient: string, notifications: Notification[]) {
  const unread = notifications.filter(n => !n.isRead && n.recipient === recipient);
  const promises = unread.map(n => markAsRead(n.id));
  await Promise.all(promises);
}
