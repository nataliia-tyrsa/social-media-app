import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi, postsApi, Notification } from '../../services/api';
import useAuthStore from '../../store/authStore';
import PostModal from '../../components/PostModal';
import { UserAvatar } from '../../utils/userAvatar';
import { timeAgo } from '../../utils/timeAgo';
import styles from './Notifications.module.css';

const Notifications = () => {
  const currentUser = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loadingPost, setLoadingPost] = useState(false);

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

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.post?._id) {
          // Если мобильное устройство, переход на страницу поста
          if (window.innerWidth <= 768) {
            navigate(`/post/${notification.post._id}`);
            return;
          }
          setLoadingPost(true);
          try {
            // Load full post data
            const fullPost = await postsApi.getPostById(notification.post._id);
            setSelectedPost(fullPost);
          } catch (error) {
            console.error('Error loading post:', error);
            // Fallback to basic post data
            setSelectedPost(notification.post);
          } finally {
            setLoadingPost(false);
          }
        }
        break;
      case 'follow':
        // Navigate to the follower's profile
        navigate(`/profile/${notification.from._id}`);
        break;
      default:
        break;
    }
  };

  const handlePostUpdate = (updatedPost: any) => {
    setSelectedPost(updatedPost);
  };

  const handlePostDelete = () => {
    setSelectedPost(null);
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'понравился ваш пост';
      case 'comment':
        return notification.comment?.content 
          ? `прокомментировал: "${notification.comment.content}"`
          : 'прокомментировал ваш пост';
      case 'follow':
        return 'подписался на вас';
      default:
        return 'взаимодействовал с вашим контентом';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Загрузка уведомлений...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <div className={styles.container}>Войдите в систему для просмотра уведомлений</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Уведомления</h2>
      
      {notifications.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔔</div>
          <h3>Пока нет уведомлений</h3>
          <p>Когда кто-то поставит лайк, прокомментирует или подпишется на вас, вы увидите это здесь.</p>
        </div>
      ) : (
        <div className={styles.notifications}>
          {notifications.map((notification) => (
            <div 
              key={notification._id} 
              className={`${styles.notification} ${!notification.read ? styles.unread : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className={styles.notificationIcon}>
                {getNotificationIcon(notification.type)}
              </div>
              
              <UserAvatar
                avatarUrl={notification.from.avatarUrl}
                username={notification.from.username}
                userId={notification.from._id}
                size={40}
                className={styles.avatar}
              />
              
              <div className={styles.content}>
                <div className={styles.text}>
                  <strong>{notification.from.username}</strong> {getNotificationText(notification)}
                </div>
                <div className={styles.time}>
                  {timeAgo(notification.createdAt)}
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

      {loadingPost && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
            <p>Загрузка поста...</p>
          </div>
        </div>
      )}

      {selectedPost && currentUser && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={async () => {
            // Handle like in modal
          }}
          onComment={async (content) => {
            // Handle comment in modal
          }}
          currentUser={currentUser}
          onPostUpdated={handlePostUpdate}
          onPostDeleted={handlePostDelete}
        />
      )}
    </div>
  );
};

export default Notifications; 