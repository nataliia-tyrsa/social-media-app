import React, { useState, useEffect } from 'react';
import { postsApi, Post } from '../../services/api';
import useAuthStore from '../../store/authStore';
import styles from './PostManagement.module.css';

interface PostManagementProps {
  onClose: () => void;
}

const PostManagement: React.FC<PostManagementProps> = ({ onClose }) => {
  const currentUser = useAuthStore(state => state.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadUserPosts();
    }
  }, [currentUser]);

  const loadUserPosts = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userPosts = await postsApi.getUserPosts(currentUser._id);
      setPosts(userPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setDeletingPostId(postId);
      await postsApi.deletePost(postId);
      setPosts(prev => prev.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Ошибка при удалении поста');
    } finally {
      setDeletingPostId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h2>Управление постами</h2>
            <button onClick={onClose} className={styles.closeButton}>×</button>
          </div>
          <div className={styles.loading}>Загрузка постов...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Управление постами</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.content}>
          {posts.length === 0 ? (
            <div className={styles.empty}>
              <p>У вас пока нет постов</p>
            </div>
          ) : (
            <div className={styles.postsList}>
              <div className={styles.stats}>
                <p>Всего постов: <strong>{posts.length}</strong></p>
              </div>
              
              {posts.map((post) => (
                <div key={post._id} className={styles.postItem}>
                  <div className={styles.postContent}>
                    {post.imageUrl && (
                      <img 
                        src={post.imageUrl} 
                        alt="Post" 
                        className={styles.postImage}
                      />
                    )}
                    <div className={styles.postText}>
                      <p>{post.content}</p>
                      <div className={styles.postMeta}>
                        <span className={styles.date}>{formatDate(post.createdAt)}</span>
                        <span className={styles.stats}>
                          ❤️ {post.likes.length} | 💬 {post.comments.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.postActions}>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      disabled={deletingPostId === post._id}
                      className={styles.deleteButton}
                    >
                      {deletingPostId === post._id ? 'Удаление...' : '🗑️ Удалить'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostManagement; 