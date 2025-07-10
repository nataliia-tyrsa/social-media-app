import { useState, useEffect } from 'react';
import { postsApi, Post } from '../../services/api';
import useAuthStore from '../../store/authStore';
import PostModal from '../../components/PostModal';
import { useNavigate } from 'react-router-dom';
import styles from './Explore.module.css';

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const currentUser = useAuthStore(state => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const allPosts = await postsApi.getAllPosts();
      const shuffledPosts = [...allPosts].sort(() => Math.random() - 0.5);
      setPosts(shuffledPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (post: Post) => {
    if (window.innerWidth <= 768) navigate(`/post/${post._id}`);
    else setActivePost(post);
  };

  const handleCloseModal = async () => {
    if (activePost) {
      try {
        const updatedPost = await postsApi.getPostById(activePost._id);
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === activePost._id ? updatedPost : post
          )
        );
      } catch (error) {
        // ... existing code ...
      }
    }
    setActivePost(null);
  };

  const handleLike = async () => {
    if (!currentUser || !activePost) return;
    
    try {
      const result = await postsApi.likePost(activePost._id);
      
      const isLiked = result.isLiked;
      const newLikes = isLiked 
        ? [...activePost.likes, currentUser._id]
        : activePost.likes.filter(id => id !== currentUser._id);

      const updatedPost = { ...activePost, likes: newLikes };
      setActivePost(updatedPost);
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === activePost._id ? updatedPost : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (content: string) => {
    if (!currentUser || !activePost) return;
    
    try {
      const updatedPost = await postsApi.addComment(activePost._id, content);
      
      if (activePost && updatedPost) {
        if (!updatedPost.author.avatarUrl && activePost.author.avatarUrl) {
          updatedPost.author.avatarUrl = activePost.author.avatarUrl;
        }
        if (!updatedPost.author.fullName && activePost.author.fullName) {
          updatedPost.author.fullName = activePost.author.fullName;
        }
        
        if (currentUser) {
          const lastComment = updatedPost.comments[updatedPost.comments.length - 1];
          if (lastComment && lastComment.author._id === currentUser._id) {
            lastComment.author.avatarUrl = currentUser.avatarUrl;
            lastComment.author.username = currentUser.username;
            lastComment.author.fullName = currentUser.fullName;
          }
        }
      }
      
      setActivePost(updatedPost);
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === activePost._id ? updatedPost : post
        )
      );
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Lade Posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.gallery}>
        {posts.length === 0 ? (
          <div className={styles.noPosts}>
            <p>Keine Posts verfügbar</p>
          </div>
        ) : (
          posts.map((post) => {
            const displayImage = post.imageUrl || post.image;
            return (
              <div 
                key={post._id} 
                className={styles.postItem}
                onClick={() => handlePostClick(post)}
              >
                {displayImage ? (
                  <img 
                    src={displayImage} 
                    alt="post" 
                    className={styles.postImage}
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                    }}
                  />
                ) : (
                  <div className={styles.textPost}>
                    <p>{post.content}</p>
                  </div>
                )}
                <div className={styles.postOverlay}>
                  <div className={styles.postStats}>
                    <span>❤️ {post.likes.length}</span>
                    <span>💬 {post.comments.length}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activePost && currentUser && (
        <PostModal
          post={activePost}
          onClose={handleCloseModal}
          onLike={handleLike}
          onComment={handleComment}
          currentUser={currentUser}
        />
      )}
    </div>
  );
} 