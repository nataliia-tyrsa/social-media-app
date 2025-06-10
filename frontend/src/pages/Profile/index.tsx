import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usersApi, postsApi, commentsApi, Post, User } from "../../services/api";
import useAuthStore from "../../store/authStore";
import PostModal from "../../components/PostModal";
import CreatePostModal from "../../components/CreatePostModal";
import styles from "./Profile.module.css";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore(state => state.user);
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState('');
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const userId = id || currentUser?._id;
  const isOwnProfile = !id || id === currentUser?._id;

  console.log('Profile component state:');
  console.log('- id from params:', id);
  console.log('- currentUser:', currentUser);
  console.log('- currentUser._id:', currentUser?._id);
  console.log('- userId:', userId);
  console.log('- isOwnProfile:', isOwnProfile);

  useEffect(() => {
    console.log('Profile useEffect triggered, userId:', userId);
    if (userId) {
      loadUserData();
    } else {
      console.log('No userId, setting error');
      setError('User not found');
      setLoading(false);
    }
  }, [userId]);

  const loadUserData = async () => {
    console.log('loadUserData called with userId:', userId, 'isOwnProfile:', isOwnProfile);
    try {
      setError('');
      
      if (isOwnProfile && currentUser) {
        console.log('Using currentUser for own profile:', currentUser);
        setUser(currentUser);
      } else if (userId) {
        console.log('Fetching user by ID:', userId);
        const userData = await usersApi.getUserById(userId);
        console.log('Fetched user data:', userData);
        setUser(userData);
        setIsFollowing(userData.followers?.includes(currentUser?._id || '') || false);
      }

      if (userId) {
        console.log('Fetching posts for user:', userId);
        const userPosts = await postsApi.getUserPosts(userId);
        console.log('Fetched posts:', userPosts);
        setPosts(userPosts);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!userId || isOwnProfile || !currentUser) return;
    
    try {
      if (isFollowing) {
        await usersApi.unfollowUser(userId);
      } else {
        await usersApi.followUser(userId);
      }
      setIsFollowing(!isFollowing);
      
      if (user) {
        const updatedFollowers = isFollowing 
          ? user.followers.filter(id => id !== currentUser._id)
          : [...user.followers, currentUser._id];
        setUser({ ...user, followers: updatedFollowers });
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };

  const handlePostClick = (post: Post) => {
    setActivePost(post);
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

  const handleAvatarClick = () => {
    if (isOwnProfile) {
      navigate('/edit-profile');
    }
  };

  const handlePostCreated = async () => {
    if (userId) {
      const userPosts = await postsApi.getUserPosts(userId);
      setPosts(userPosts);
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (error || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error || 'User not found'}
          <button onClick={() => navigate('/')} className={styles.backButton}>
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  console.log('Profile user avatar:', user.avatarUrl);

  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarWrapper}>
          <img
            src={user.avatarUrl || "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face"}
            alt={`${user.username || 'User'} avatar`}
            className={styles.avatar}
            onClick={handleAvatarClick}
            style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face';
            }}
          />
        </div>
        <div className={styles.userInfo}>
          <div className={styles.usernameRow}>
            <h2>{user.username || 'Unknown User'}</h2>
            {isOwnProfile ? (
              <Link to="/edit-profile" className={styles.editButton}>
                Edit Profile
              </Link>
            ) : (
              <button 
                onClick={handleFollow}
                className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
                disabled={!currentUser}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
          
          <div className={styles.stats}>
            <span><strong>{posts.length}</strong> posts</span>
            <span><strong>{user.followers?.length || 0}</strong> followers</span>
            <span><strong>{user.following?.length || 0}</strong> following</span>
          </div>
          
          <div className={styles.bio}>
            {user.fullName && <strong>{user.fullName}</strong>}
            {user.bio && <p>{user.bio}</p>}
          </div>
        </div>
      </div>

      <div className={styles.gallery}>
        {isOwnProfile && (
          <div 
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            <svg className={styles.createIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <span className={styles.createText}>Create</span>
          </div>
        )}

        {posts.length === 0 && !isOwnProfile && (
          <div className={styles.noPosts}>
            <p>No posts yet.</p>
          </div>
        )}
        
        {posts.length > 0 && posts.map((post) => {
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
                <span>❤️ {post.likes.length}</span>
                <span>💬 {post.comments.length}</span>
              </div>
            </div>
          );
        })}
      </div>

      {activePost && currentUser && (
        <PostModal
          post={activePost}
          onClose={() => setActivePost(null)}
          onLike={handleLike}
          onComment={handleComment}
          currentUser={currentUser}
        />
      )}
      
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
