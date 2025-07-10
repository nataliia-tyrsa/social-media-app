import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { usersApi, postsApi, commentsApi, uploadApi, Post, User } from "../../services/api";
import useAuthStore from "../../store/authStore";
import PostModal from "../../components/PostModal";
import CreatePostModal from "../../components/CreatePostModal";
import { timeAgo } from '../../utils/timeAgo';
import { UserAvatar } from '../../utils/userAvatar';

import styles from "./Profile.module.css";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      setLoading(true);
      
      if (isOwnProfile && currentUser) {
        console.log('Using currentUser for own profile:', currentUser);
        setUser(currentUser);
      } else if (userId) {
        console.log('Fetching user by ID:', userId);
        try {
          const userData = await usersApi.getUserById(userId);
          console.log('Fetched user data:', userData);
          setUser(userData);
          setIsFollowing(userData.followers?.includes(currentUser?._id || '') || false);
        } catch (userError) {
          console.error('Error fetching user by ID:', userError);
          throw userError;
        }
      }

      if (userId) {
        console.log('Fetching posts for user:', userId);
        try {
          const userPosts = await postsApi.getUserPosts(userId);
          console.log('Fetched posts:', userPosts);
          setPosts(userPosts);
        } catch (postsError) {
          console.error('Error fetching posts:', postsError);
          // Don't throw here, just log the error
          setPosts([]);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError(`Failed to load user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const handleMessage = () => {
    if (!isOwnProfile && userId) {
      navigate('/messages', { state: { userId } });
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
      fileInputRef.current?.click();
    }
  };

  const handlePostCreated = async () => {
    if (userId) {
      const userPosts = await postsApi.getUserPosts(userId);
      setPosts(userPosts);
    }
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
    setActivePost(updatedPost);
  };

  const handlePostDeleted = () => {
    if (activePost) {
      setPosts(prevPosts => 
        prevPosts.filter(post => post._id !== activePost._id)
      );
      setActivePost(null);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isOwnProfile) return;

    try {
      // Upload image
      const uploadResult = await uploadApi.uploadImage(file);
      
      // Update profile with new avatar URL
      const updatedUser = await usersApi.updateProfile({
        avatarUrl: uploadResult.url
      });
      
      // Update local state
      setUser(updatedUser);
      
      // Update auth store
      useAuthStore.getState().updateUser(updatedUser);
      
      // Force refresh user data to ensure consistency
      await loadUserData();
      
      console.log('Avatar updated successfully:', uploadResult.url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
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
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <UserAvatar
              key={user.avatarUrl || 'no-avatar'}
              avatarUrl={user.avatarUrl}
              username={user.username}
              userId={user._id}
              size={150}
              className={styles.avatar}
            />
            {isOwnProfile && (
              <div 
                className={styles.avatarOverlay}
                onClick={handleAvatarClick}
              >
                <span>Change Photo</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.actionRow}>
            <h1 className={styles.username}>{user.username || 'Unknown User'}</h1>
            
            <div className={styles.actionButtons}>
              {isOwnProfile ? (
                <>
                  <Link to="/edit-profile" className={styles.primaryButton}>
                    Edit Profile
                  </Link>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleFollow}
                    className={`${styles.primaryButton} ${isFollowing ? styles.following : ''}`}
                    disabled={!currentUser}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button 
                    onClick={handleMessage}
                    className={styles.secondaryButton}
                    disabled={!currentUser}
                  >
                    Message
                  </button>
                </>
              )}
            </div>

            <div className={styles.statsSection}>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>{posts.length}</span>
                  <span className={styles.statLabel}>posts</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>{user.followers?.length || 0}</span>
                  <span className={styles.statLabel}>followers</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>{user.following?.length || 0}</span>
                  <span className={styles.statLabel}>following</span>
                </div>
              </div>
            </div>
          </div>
          
          {user.bio && (
            <div className={styles.bio}>
              <div className={styles.bioText}>
                {user.bio.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            </div>
          )}
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
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
        />
      )}
      
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}
