import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postsApi, commentsApi, usersApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
import PostModal from '../../components/PostModal';
import EmojiPicker from '../../components/EmojiPicker';
import { timeAgo } from '../../utils/timeAgo';
import { UserAvatar } from '../../utils/userAvatar';
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
  const [emojiPickerStates, setEmojiPickerStates] = useState<{[key: string]: boolean}>({});
  const [commentTexts, setCommentTexts] = useState<{[key: string]: string}>({});
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState<boolean>(false);
  const navigate = useNavigate();

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
    const commentText = commentTexts[postId];
    if (!commentText?.trim()) return;

    try {
      const updatedPost = await postsApi.addComment(postId, commentText.trim());
      
      // Сохраняем информацию об авторе поста из текущего состояния
      const currentPost = posts.find(p => p._id === postId);
      if (currentPost && updatedPost) {
        // Восстанавливаем информацию об авторе поста
        updatedPost.author = {
          ...updatedPost.author,
          username: currentPost.author.username || updatedPost.author.username,
          fullName: currentPost.author.fullName || updatedPost.author.fullName,
          avatarUrl: currentPost.author.avatarUrl || updatedPost.author.avatarUrl
        };
        
        // Восстанавливаем информацию об авторах комментариев
        updatedPost.comments = updatedPost.comments.map(comment => {
          const existingComment = currentPost.comments.find(c => c._id === comment._id);
          if (existingComment) {
            return {
              ...comment,
              author: {
                ...comment.author,
                username: existingComment.author.username || comment.author.username,
                fullName: existingComment.author.fullName || comment.author.fullName,
                avatarUrl: existingComment.author.avatarUrl || comment.author.avatarUrl
              }
            };
          }
          
          // Для нового комментария (если это текущий пользователь)
          if (currentUser && comment.author._id === currentUser._id) {
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
      }
      
      setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
      setCommentTexts(prev => ({
        ...prev,
        [postId]: ''
      }));
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
      
      // Возвращаем обновленный пост для синхронизации с модальным окном
      const updatedPosts = posts.map(post => {
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
      });
      
      return updatedPosts.find(p => p._id === postId) || null;
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
    // Добавляем эмодзи в поле ввода комментария
    setCommentTexts(prev => ({
      ...prev,
      [postId]: (prev[postId] || '') + emoji
    }));
    
    // Закрываем эмодзи пикер
    setEmojiPickerStates(prev => ({
      ...prev,
      [postId]: false
    }));
  };

  const toggleEmojiPicker = (postId: string) => {
    setEmojiPickerStates(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handlePostClick = (post: Post) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    
    if (tapLength < 300 && tapLength > 0) {
      handleLike(post._id);
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    } else {
      setActivePost(post);
    }
    
    setLastTapTime(currentTime);
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

  return (
    <div className={styles.feed}>
      <div className={styles.posts}>
        {posts.length === 0 && (
          <div className={styles.noPosts}>
            <p>No posts yet 📸</p>
            <p>Create your first post to share with friends! ✨</p>
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
              <div className={styles.postContent}>
                {displayImage ? (
                  <div className={styles.imageContainer} onClick={() => handlePostClick(post)}>
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
                          onClick={(e) => {
                            e.stopPropagation();
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
                        alt="Post content"
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
                      />
                    )}
                    {showLikeAnimation && (
                      <div className={styles.likeAnimation}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="#ed4956"
                          className={styles.likeAnimationIcon}
                        >
                          <path d="M16.5 3c-1.74 0-3.41 1.01-4.5 2.09C10.91 4.01 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.noImage} onClick={() => handlePostClick(post)}>
                    <p>{post.content}</p>
                  </div>
                )}

                <div className={styles.caption}>
                  <div className={styles.captionLeft}>
                    <UserAvatar
                      avatarUrl={post.author.avatarUrl}
                      username={post.author.username}
                      userId={post.author._id}
                      size={32}
                      className={styles.captionAvatar}
                    />
                    <Link to={`/profile/${post.author._id}`} className={styles.captionUsername}>
                      {post.author.username || 'Unknown User'}
                    </Link>
                    {post.content && (
                      <span className={styles.captionText}>{post.content}</span>
                    )}
                  </div>
                  <div className={styles.captionRight}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post._id);
                      }}
                      className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
                      aria-label="Like"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className={styles.actionIcon}
                        fill={isLiked ? '#ed4956' : 'none'}
                        stroke={isLiked ? '#ed4956' : 'currentColor'}
                      >
                        <path d="M16.5 3c-1.74 0-3.41 1.01-4.5 2.09C10.91 4.01 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" />
                      </svg>
                      <span className={styles.actionCount}>{post.likes.length}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePost(post);
                      }}
                      className={styles.actionButton}
                      aria-label="Comments"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className={styles.actionIcon}
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className={styles.actionCount}>{post.comments.length}</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className={styles.commentsSection}>
                <div className={styles.lastComment}>
                  {post.comments.length > 0 && (
                    post.comments.slice(-1).map((comment) => {
                      console.log('Feed comment data:', comment);
                      return (
                        <div key={comment._id} className={styles.comment}>
                          <UserAvatar
                            avatarUrl={comment.author.avatarUrl}
                            username={comment.author.username}
                            userId={comment.author._id}
                            size={32}
                            className={styles.commentAvatar}
                          />
                          <div className={styles.commentContent}>
                            <div className={styles.commentMain}>
                              <Link to={`/profile/${comment.author._id}`} className={styles.commentUsername}>
                                {comment.author.username || 'Unknown User'}
                              </Link>
                              <span className={styles.commentText}>{comment.content}</span>
                            </div>
                            <span className={styles.commentTime}>{timeAgo(comment.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {post.comments.length > 1 ? (
                  <button 
                    className={styles.viewAllComments}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePost(post);
                    }}
                  >
                    View all {post.comments.length} comments
                  </button>
                ) : (
                  <div className={styles.viewAllCommentsPlaceholder}></div>
                )}
              </div>

              <form 
                onSubmit={(e) => handleComment(e, post._id)} 
                className={styles.commentForm}
              >
                <input
                  type="text"
                  value={commentTexts[post._id] || ''}
                  onChange={(e) => setCommentTexts(prev => ({
                    ...prev,
                    [post._id]: e.target.value
                  }))}
                  placeholder="Add a comment..."
                  className={styles.commentInput}
                  autoComplete="off"
                />
                <div className={styles.commentActions}>
                  <button 
                    type="button"
                    className={styles.emojiButton}
                    onClick={() => toggleEmojiPicker(post._id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                      <line x1="9" y1="9" x2="9.01" y2="9"/>
                      <line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                  </button>
                  <button 
                    type="submit" 
                    className={styles.postButton}
                    disabled={!commentTexts[post._id]?.trim()}
                  >
                    Post
                  </button>
                </div>
                
                {emojiPickerStates[post._id] && (
                  <>
                    <div 
                      className={styles.emojiOverlay}
                      onClick={() => toggleEmojiPicker(post._id)}
                    />
                    <div className={styles.emojiPickerWrapper}>
                      <EmojiPicker 
                        isOpen={true}
                        onEmojiSelect={(emoji) => handleEmojiSelect(post._id, emoji)}
                        onClose={() => toggleEmojiPicker(post._id)}
                        autoClose={false}
                      />
                    </div>
                  </>
                )}
              </form>
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
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
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
