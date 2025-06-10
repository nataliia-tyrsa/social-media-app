import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Smile } from 'lucide-react';
import { postsApi, commentsApi, usersApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
import PostModal from '../../components/PostModal';
import EmojiPicker from '../../components/EmojiPicker';
import { timeAgo } from '../../utils/timeAgo';
import styles from './Feed.module.css';

interface Post {
  _id: string;
  author: {
    _id: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
  };
  imageUrl?: string;
  image?: string;
  content: string;
  createdAt: string;
  likes: Array<string | { _id: string; username: string }>;
  comments: {
    _id: string;
    author: {
      _id: string;
      username: string;
      fullName?: string;
      avatarUrl?: string;
    };
    content: string;
    createdAt: string;
    likes?: string[];
  }[];
  showComments?: boolean;
}

export default function Feed() {
  const { user: currentUser, isAuthChecked } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [imageLoadStates, setImageLoadStates] = useState<{[key: string]: boolean}>({});
  const [imageErrors, setImageErrors] = useState<{[key: string]: string}>({});
  const [followingStates, setFollowingStates] = useState<{[key: string]: boolean}>({});
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<{[key: string]: boolean}>({});
  const [commentTexts, setCommentTexts] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const loadPosts = async () => {
      try {
        console.log('Starting to load posts...');
        const startTime = Date.now();
        const data = await postsApi.getAllPosts();
        const loadTime = Date.now() - startTime;
        console.log(`Loaded ${data.length} posts in ${loadTime}ms:`, data);
        
        if (currentUser) {
          const updatedPosts = data.map(post => {
            if (post.author._id === currentUser._id) {
              return {
                ...post,
                author: {
                  ...post.author,
                  username: currentUser.username,
                  fullName: currentUser.fullName,
                  avatarUrl: currentUser.avatarUrl
                }
              };
            }
            return post;
          });
          setPosts(updatedPosts);
        } else {
          setPosts(data);
        }
      } catch (error) {
        console.error('Error loading posts:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Request setup error:', error.message);
        }
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthChecked) {
      console.log('Auth checked, loading posts...');
      loadPosts();
    } else {
      console.log('Auth not yet checked, waiting...');
    }
  }, [isAuthChecked, currentUser]);

  useEffect(() => {
    if (currentUser && posts.length > 0) {
      console.log('Updating posts with new user data:', currentUser);
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.author._id === currentUser._id) {
            const updatedPost = {
              ...post,
              author: {
                ...post.author,
                username: currentUser.username,
                fullName: currentUser.fullName,
                avatarUrl: currentUser.avatarUrl
              }
            };
            
            const updatedComments = post.comments.map(comment => {
              if (comment.author._id === currentUser._id) {
                return {
                  ...comment,
                  author: {
                    ...comment.author,
                    username: currentUser.username,
                    fullName: currentUser.fullName,
                    avatarUrl: currentUser.avatarUrl
                  }
                };
              }
              return comment;
            });
            
            return { ...updatedPost, comments: updatedComments };
          }
          
          const updatedComments = post.comments.map(comment => {
            if (comment.author._id === currentUser._id) {
              return {
                ...comment,
                author: {
                  ...comment.author,
                  username: currentUser.username,
                  fullName: currentUser.fullName,
                  avatarUrl: currentUser.avatarUrl
                }
              };
            }
            return comment;
          });
          
          return post.comments !== updatedComments ? { ...post, comments: updatedComments } : post;
        })
      );

      const initialFollowingStates: {[key: string]: boolean} = {};
      posts.forEach(post => {
        if (post.author._id !== currentUser._id) {
          initialFollowingStates[post.author._id] = currentUser.following?.includes(post.author._id) || false;
        }
      });
      setFollowingStates(initialFollowingStates);
    }
  }, [currentUser?.avatarUrl, currentUser?.username, currentUser?.fullName, posts.length]);

  if (!isAuthChecked) {
    return <div className={styles.feed}>Checking login status...</div>;
  }

  if (loading) {
    return (
      <div className={styles.feed}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading posts...</p>
          <p>Please wait, this may take a moment</p>
        </div>
      </div>
    );
  }

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      const result = await postsApi.likePost(postId);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const currentLikes = post.likes || [];
            let newLikes;
            
            if (result.isLiked) {
              newLikes = [...currentLikes, currentUser._id];
            } else {
              newLikes = currentLikes.filter(like => {
                const likeId = typeof like === 'string' ? like : like._id;
                return likeId !== currentUser._id;
              });
            }
            
            return { ...post, likes: newLikes };
          }
          return post;
        })
      );

      if (activePost && activePost._id === postId) {
        const currentLikes = activePost.likes || [];
        let newLikes;
        
        if (result.isLiked) {
          newLikes = [...currentLikes, currentUser._id];
        } else {
          newLikes = currentLikes.filter(like => {
            const likeId = typeof like === 'string' ? like : like._id;
            return likeId !== currentUser._id;
          });
        }
        
        setActivePost({ ...activePost, likes: newLikes });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (e: React.FormEvent<HTMLFormElement>, postId: string) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const content = commentTexts[postId];
    if (!content || !content.trim()) return;
    
    try {
      const updatedPost = await postsApi.addComment(postId, content);
      
      setPosts(prevPosts => 
        prevPosts.map(post => post._id === postId ? updatedPost : post)
      );
      
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleCommentLike = async (postId: string, commentId: string) => {
    console.log('Comment like not implemented yet');
  };

  const handleModalLike = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      const result = await postsApi.likePost(postId);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const currentLikes = post.likes || [];
            let newLikes;
            
            if (result.isLiked) {
              newLikes = [...currentLikes, currentUser._id];
            } else {
              newLikes = currentLikes.filter(like => {
                const likeId = typeof like === 'string' ? like : like._id;
                return likeId !== currentUser._id;
              });
            }
            
            return { ...post, likes: newLikes };
          }
          return post;
        })
      );
      
      const updatedPost = posts.find(p => p._id === postId);
      return updatedPost || null;
    } catch (error) {
      console.error('Error toggling like:', error);
      return null;
    }
  };

  const handleModalComment = async (postId: string, content: string) => {
    try {
      const updatedPost = await postsApi.addComment(postId, content);
      
      const currentPost = posts.find(p => p._id === postId);
      if (currentPost && updatedPost) {
        if (!updatedPost.author.avatarUrl && currentPost.author.avatarUrl) {
          updatedPost.author.avatarUrl = currentPost.author.avatarUrl;
        }
        if (!updatedPost.author.fullName && currentPost.author.fullName) {
          updatedPost.author.fullName = currentPost.author.fullName;
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
      
      setPosts(prev => prev.map(post => 
        post._id === postId ? updatedPost : post
      ));
      
      return updatedPost;
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser || userId === currentUser._id) return;
    
    try {
      const isCurrentlyFollowing = followingStates[userId];
      
      if (isCurrentlyFollowing) {
        await usersApi.unfollowUser(userId);
      } else {
        await usersApi.followUser(userId);
      }
      
      setFollowingStates(prev => ({
        ...prev,
        [userId]: !isCurrentlyFollowing
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleEmojiSelect = (postId: string, emoji: string) => {
    setCommentTexts(prev => ({
      ...prev,
      [postId]: (prev[postId] || '') + emoji
    }));
  };

  const toggleEmojiPicker = (postId: string) => {
    setEmojiPickerOpen(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  return (
    <div className={styles.feed}>
      <div className={styles.posts}>
        {posts.length === 0 && (
          <div className={styles.noPosts}>
            <p>Пока нет постов</p>
            <p>Создайте свой первый пост или добавьте тестовые посты</p>
            <button 
              className={styles.createSampleButton}
              onClick={async () => {
                try {
                  console.log('Creating sample posts...');
                  await postsApi.createSamplePosts();
                  const data = await postsApi.getAllPosts();
                  setPosts(data);
                } catch (error) {
                  console.error('Error creating sample posts:', error);
                }
              }}
            >
              Создать тестовые посты
            </button>
          </div>
        )}
        
        {posts.map((post) => {
          const isLiked = currentUser ? (
            Array.isArray(post.likes) && post.likes.some(like => 
              typeof like === 'string' ? like === currentUser._id : like._id === currentUser._id
            )
          ) : false;
          const displayImage = post.image || post.imageUrl;

          return (
            <div key={post._id} className={styles.post}>
              <div className={styles.header}>
                <Link to={`/profile/${post.author._id}`} className={styles.avatarLink}>
                  <img
                    src={post.author.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'}
                    alt={`${post.author.username || 'User'} avatar`}
                    className={styles.avatar}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face';
                    }}
                  />
                </Link>
                <div className={styles.userInfo}>
                  <Link to={`/profile/${post.author._id}`} className={styles.usernameLink}>
                    <strong>{post.author.username || 'Unknown User'}</strong>
                  </Link>
                  <span className={styles.timeAgo}>{timeAgo(post.createdAt)}</span>
                </div>
                {currentUser && post.author._id !== currentUser._id && (
                  <button 
                    className={`${styles.followButton} ${followingStates[post.author._id] ? styles.following : ''}`}
                    onClick={() => handleFollow(post.author._id)}
                  >
                    {followingStates[post.author._id] ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {displayImage && (
                <div className={styles.imageContainer}>
                  {!imageLoadStates[post._id] && !imageErrors[post._id] && (
                    <div className={styles.imageLoading}>
                      <div className={styles.spinner}></div>
                      <p>Загрузка изображения...</p>
                    </div>
                  )}
                  
                  {imageErrors[post._id] ? (
                    <div className={styles.imageError}>
                      <div className={styles.errorIcon}>⚠️</div>
                      <h4>Не удалось загрузить изображение</h4>
                      <p className={styles.errorReason}>{imageErrors[post._id]}</p>
                      <button 
                        className={styles.retryButton}
                        onClick={() => {
                          setImageErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[post._id];
                            return newErrors;
                          });
                          setImageLoadStates(prev => {
                            const newStates = { ...prev };
                            delete newStates[post._id];
                            return newStates;
                          });
                        }}
                      >
                        Попробовать снова
                      </button>
                    </div>
                  ) : (
                    <img
                      src={displayImage}
                      alt="post image"
                      className={`${styles.image} ${!imageLoadStates[post._id] ? styles.hidden : ''}`}
                      loading="lazy"
                      onLoad={() => {
                        console.log('Image loaded successfully:', displayImage);
                        setImageLoadStates(prev => ({ ...prev, [post._id]: true }));
                        setImageErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[post._id];
                          return newErrors;
                        });
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', displayImage);
                        const img = e.currentTarget;
                        let errorMessage = 'Неизвестная ошибка загрузки изображения';
                        
                        if (displayImage.includes('404') || displayImage.includes('not-found')) {
                          errorMessage = 'Изображение не найдено на сервере';
                        } else if (displayImage.startsWith('http://') && window.location.protocol === 'https:') {
                          errorMessage = 'Небезопасная ссылка на изображение (HTTP в HTTPS)';
                        } else if (!displayImage.startsWith('http')) {
                          errorMessage = 'Некорректная ссылка на изображение';
                        } else if (img.naturalWidth === 0 && img.naturalHeight === 0) {
                          errorMessage = 'Файл поврежден или не является изображением';
                        } else {
                          errorMessage = 'Сервер не отвечает или изображение недоступно';
                        }
                        
                        setImageErrors(prev => ({ ...prev, [post._id]: errorMessage }));
                        setImageLoadStates(prev => ({ ...prev, [post._id]: true }));
                      }}
                      onClick={() => setActivePost(post)}
                    />
                  )}
                </div>
              )}

              {!displayImage && (
                <div className={styles.noImage}>
                  <p>No image available</p>
                </div>
              )}

              <div className={styles.iconButtons}>
                <svg
                  onClick={() => handleLike(post._id)}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className={`${styles.icon} ${isLiked ? styles.liked : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M16.5 3c-1.74 0-3.41 1.01-4.5 2.09C10.91 4.01 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" />
                </svg>

                <svg
                  onClick={() => setActivePost(post)}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className={styles.icon}
                  style={{ cursor: 'pointer' }}
                >
                  <path d="M21 6h-2V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6l3 3 3-3h6a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM7 5h10v1H7V5z" />
                </svg>
              </div>

              <div className={styles.footer}>
                <div className={styles.likes}>{post.likes.length} likes</div>
                <div className={styles.caption}>
                  <Link to={`/profile/${post.author._id}`}>
                    <strong>{post.author.username || 'Unknown User'}</strong>
                  </Link> {post.content}
                </div>

                <div className={styles.commentsSection}>
                  <div className={styles.commentsDisplay}>
                    {post.comments.length > 2 && (
                      <button 
                        className={styles.viewAllComments}
                        onClick={() => setActivePost(post)}
                      >
                        View all {post.comments.length} comments
                      </button>
                    )}
                    
                    {post.comments.slice(-2).map((comment) => (
                      <div key={comment._id} className={styles.comment}>
                        <Link to={`/profile/${comment.author._id}`} className={styles.commentAvatarLink}>
                          <img
                            src={comment.author.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'}
                            alt={`${comment.author.username || 'User'} avatar`}
                            className={styles.commentAvatar}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face';
                            }}
                          />
                        </Link>
                        <div className={styles.commentContent}>
                          <Link to={`/profile/${comment.author._id}`}>
                            <strong>{comment.author.username || 'Unknown User'}</strong>
                          </Link> {comment.content}
                        </div>
                      </div>
                    ))}
                    
                    <div className={styles.commentTime}>
                      {timeAgo(post.createdAt)}
                    </div>
                  </div>
                  
                  <form onSubmit={(e) => handleComment(e, post._id)} className={styles.commentForm}>
                    <input
                      value={commentTexts[post._id] || ''}
                      onChange={(e) => setCommentTexts(prev => ({
                        ...prev,
                        [post._id]: e.target.value
                      }))}
                      placeholder="Add a comment..."
                      className={styles.commentInput}
                    />
                    <div className={styles.commentActions}>
                      <button 
                        type="button"
                        className={styles.emojiButton}
                        onClick={() => toggleEmojiPicker(post._id)}
                      >
                        <Smile />
                      </button>
                      <button type="submit" className={styles.postButton}>Post</button>
                    </div>
                    
                    {emojiPickerOpen[post._id] && (
                      <>
                        <div 
                          className={styles.emojiOverlay}
                          onClick={() => toggleEmojiPicker(post._id)}
                        />
                        <div className={styles.emojiPickerWrapper}>
                          <EmojiPicker 
                            onEmojiSelect={(emoji) => handleEmojiSelect(post._id, emoji)}
                            isOpen={true}
                            onClose={() => toggleEmojiPicker(post._id)}
                          />
                        </div>
                      </>
                    )}
                  </form>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {activePost && currentUser && (
        <PostModal
          post={activePost}
          onClose={() => setActivePost(null)}
          onLike={async () => {
            const updatedPost = await handleModalLike(activePost._id);
            if (updatedPost) {
              setActivePost(updatedPost);
            }
          }}
          onComment={async (content) => {
            const updatedPost = await handleModalComment(activePost._id, content);
            if (updatedPost) {
              setActivePost(updatedPost);
            }
          }}
          currentUser={currentUser}
        />
      )}



      <div className={styles.end}>
        <span>✅</span>
        <p>You've seen all the updates</p>
        <small>You have viewed all new publications</small>
      </div>
    </div>
  );
}
