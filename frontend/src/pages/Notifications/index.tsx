import { useState, useEffect } from 'react';
import { notificationsApi, Notification } from '../../services/api';
import useAuthStore from '../../store/authStore';
import styles from './Notifications.module.css';

const Notifications = () => {
  const currentUser = useAuthStore(state => state.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      default:
        return 'interacted with your content';
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading notifications...</div>;
  }

  if (!currentUser) {
    return <div className={styles.container}>Please log in to view notifications</div>;
  }

  return (
    <div className={styles.container}>
      <h2>Notifications</h2>
      
      {notifications.length === 0 ? (
        <div className={styles.empty}>
          <p>No notifications yet</p>
          <p>When someone likes or comments on your posts, you'll see it here.</p>
        </div>
      ) : (
        <div className={styles.notifications}>
          {notifications.map((notification) => (
            <div 
              key={notification._id} 
              className={`${styles.notification} ${!notification.read ? styles.unread : ''}`}
              onClick={() => !notification.read && markAsRead(notification._id)}
            >
              <img 
                src={notification.from.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'} 
                alt="avatar" 
                className={styles.avatar} 
              />
              <div className={styles.content}>
                <div className={styles.text}>
                  <strong>{notification.from.username}</strong> {getNotificationText(notification)}
                  {notification.type === 'comment' && notification.comment && (
                    <span className={styles.commentText}>: "{notification.comment.content}"</span>
                  )}
                </div>
                <div className={styles.time}>
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </div>
              
              {notification.post?.imageUrl && (
                <div className={styles.postPreview}>
                  <img 
                    src={notification.post.imageUrl} 
                    alt="post" 
                    className={styles.postImage} 
                  />
                </div>
              )}
              
              {!notification.read && <div className={styles.unreadDot}></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications; 