import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Smile } from 'lucide-react';
import { Post, usersApi } from '../../services/api';
import { User } from '../../store/authStore';
import useAuthStore from '../../store/authStore';
import EmojiPicker from '../EmojiPicker';
import { timeAgo } from '../../utils/timeAgo';
import styles from './PostModal.module.css';

interface PostModalProps {
  post: Post;
  onClose: () => void;
  onLike: () => void;
  onComment: (content: string) => void;
  currentUser: User;
}

const PostModal = ({ post, onClose, onLike, onComment, currentUser }: PostModalProps) => {
  const [commentText, setCommentText] = useState('');
  const [localPost, setLocalPost] = useState(post);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  useEffect(() => {
    if (post) {
      const newLocalPost = { ...post };
      
      if (localPost && localPost._id === post._id) {
        if (!newLocalPost.author.avatarUrl && localPost.author.avatarUrl) {
          newLocalPost.author.avatarUrl = localPost.author.avatarUrl;
        }
        if (!newLocalPost.author.fullName && localPost.author.fullName) {
          newLocalPost.author.fullName = localPost.author.fullName;
        }
        
        newLocalPost.comments = newLocalPost.comments.map(newComment => {
          const existingComment = localPost.comments.find(c => c._id === newComment._id);
          if (existingComment) {
            return {
              ...newComment,
              author: {
                ...newComment.author,
                avatarUrl: newComment.author.avatarUrl || existingComment.author.avatarUrl,
                fullName: newComment.author.fullName || existingComment.author.fullName,
              }
            };
          }
          return newComment;
        });
      }
      
      setLocalPost(newLocalPost);
    }
  }, [post]);

  useEffect(() => {
    if (currentUser) {
      console.log('Updating PostModal with new user data:', currentUser);
      setLocalPost(prevPost => ({
        ...prevPost,
        author: prevPost.author._id === currentUser._id 
          ? { 
              ...prevPost.author, 
              avatarUrl: currentUser.avatarUrl,
              username: currentUser.username,
              fullName: currentUser.fullName
            }
          : prevPost.author,
        comments: prevPost.comments.map(comment => 
          comment.author._id === currentUser._id
            ? { 
                ...comment, 
                author: { 
                  ...comment.author, 
                  avatarUrl: currentUser.avatarUrl,
                  username: currentUser.username,
                  fullName: currentUser.fullName
                }
              }
            : comment
        )
      }));
    }
  }, [currentUser?.avatarUrl, currentUser?.username, currentUser?.fullName]);

  const isLiked = currentUser && localPost.likes ? (
    Array.isArray(localPost.likes) && localPost.likes.some(like => 
      typeof like === 'string' ? like === currentUser._id : like._id === currentUser._id
    )
  ) : false;

  useEffect(() => {
    if (currentUser && post.author._id !== currentUser._id) {
      setIsFollowing(currentUser.following?.includes(post.author._id) || false);
    }
  }, [currentUser, post.author._id]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(commentText);
      setCommentText('');
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || post.author._id === currentUser._id) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await usersApi.unfollowUser(post.author._id);
        setIsFollowing(false);
      } else {
        await usersApi.followUser(post.author._id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setCommentText(prev => prev + emoji);
  };

  const toggleEmojiPicker = () => {
    setEmojiPickerOpen(!emojiPickerOpen);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          <div className={styles.imageSection}>
            {(localPost.image || localPost.imageUrl) ? (
              <img
                src={localPost.image || localPost.imageUrl}
                alt="post"
                className={styles.image}
              />
            ) : (
              <div className={styles.textOnlyPost}>
                <p>{localPost.content}</p>
              </div>
            )}
          </div>
          
          <div className={styles.contentSection}>
            <div className={styles.header}>
              <Link to={`/profile/${localPost.author._id}`}>
                <img 
                  src={localPost.author.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'} 
                  alt={`${localPost.author.username || 'User'} avatar`}
                  className={styles.avatar}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face';
                  }}
                />
              </Link>
              <div className={styles.userInfo}>
                <Link to={`/profile/${localPost.author._id}`}>
                  <div className={styles.username}>{localPost.author.username || 'Unknown User'}</div>
                </Link>
              </div>
              {currentUser && post.author._id !== currentUser._id && (
                <button 
                  className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            <div className={styles.body}>
              {localPost.content && (
                <div className={styles.caption}>
                  <Link to={`/profile/${localPost.author._id}`}>
                    <img 
                      src={localPost.author.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'} 
                      alt={`${localPost.author.username || 'User'} avatar`}
                      className={styles.captionAvatar}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face';
                      }}
                    />
                  </Link>
                  <div className={styles.captionContent}>
                    <Link to={`/profile/${localPost.author._id}`}>
                      <span className={styles.captionUsername}>{localPost.author.username || 'Unknown User'}</span>
                    </Link>
                    {localPost.content}
                  </div>
                </div>
              )}
              
              <div className={styles.comments}>
                {localPost.comments.map((comment) => (
                  <div key={comment._id} className={styles.comment}>
                    <Link to={`/profile/${comment.author._id}`}>
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
                        <span className={styles.commentUsername}>{comment.author.username || 'Unknown User'}</span>
                      </Link>
                      <span className={styles.commentText}>{comment.content}</span>
                      <div className={styles.commentTime}>
                        {timeAgo(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.footer}>
              <div className={styles.actions}>
                <button 
                  className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`}
                  onClick={onLike}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className={styles.heartIcon}
                    fill={isLiked ? '#ed4956' : 'none'}
                    stroke={isLiked ? '#ed4956' : 'currentColor'}
                  >
                    <path d="M16.5 3c-1.74 0-3.41 1.01-4.5 2.09C10.91 4.01 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" />
                  </svg>
                </button>
                <button className={styles.commentButton}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className={styles.commentIcon}
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
              
              <div className={styles.likes}>
                <strong>{localPost.likes.length}</strong> {localPost.likes.length === 1 ? 'like' : 'likes'}
              </div>
              
              <div className={styles.time}>
                {timeAgo(localPost.createdAt)}
              </div>
              
              <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className={styles.commentInput}
                />
                <button 
                  type="button"
                  className={styles.emojiButton}
                  onClick={toggleEmojiPicker}
                >
                  <Smile />
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={!commentText.trim()}
                >
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {emojiPickerOpen && (
          <EmojiPicker
            isOpen={true}
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setEmojiPickerOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PostModal; 