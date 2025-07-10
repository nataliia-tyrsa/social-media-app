import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Post, usersApi } from '../../services/api';
import { User } from '../../store/authStore';
import useAuthStore from '../../store/authStore';
import EmojiPicker from '../EmojiPicker';
import EditPostModal from '../EditPostModal';
import { timeAgo } from '../../utils/timeAgo';
import { UserAvatar } from '../../utils/userAvatar';
import styles from './PostModal.module.css';

interface PostModalProps {
  post: Post;
  onClose: () => void;
  onLike: () => void;
  onComment: (content: string) => void;
  currentUser: User;
  onPostUpdated?: (updatedPost: Post) => void;
  onPostDeleted?: () => void;
}

const PostModal = ({ post, onClose, onLike, onComment, currentUser, onPostUpdated, onPostDeleted }: PostModalProps) => {
  const [commentText, setCommentText] = useState('');
  const [localPost, setLocalPost] = useState(post);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const handlePostUpdated = (updatedPost: Post) => {
    setLocalPost(updatedPost);
    if (onPostUpdated) {
      onPostUpdated(updatedPost);
    }
  };

  const handlePostDeleted = () => {
    if (onPostDeleted) {
      onPostDeleted();
    }
    onClose();
  };

  const isAuthor = currentUser && localPost.author._id === currentUser._id;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {window.innerWidth <= 768 && (
          <button className={styles.backButton} onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
        )}
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
            <div className={styles.caption}>
              <UserAvatar
                avatarUrl={localPost.author.avatarUrl}
                username={localPost.author.username}
                userId={localPost.author._id}
                size={32}
                className={styles.captionAvatar}
              />
              <Link to={`/profile/${localPost.author._id}`} className={styles.captionUsername}>
                {localPost.author.username || 'Unknown User'}
              </Link>
              {localPost.content && <span className={styles.captionText}>{localPost.content}</span>}
              
              {isAuthor && (
                <button 
                  className={styles.editButton}
                  onClick={() => setShowEditModal(true)}
                  title="Edit post"
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
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="12" cy="5" r="1"/>
                    <circle cx="12" cy="19" r="1"/>
                  </svg>
                </button>
              )}
              
              <div className={styles.actionsInline}>
                <button 
                  className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
                  onClick={onLike}
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
                  <span className={styles.actionCount}>{localPost.likes.length}</span>
                </button>
                
                <button className={styles.actionButton}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className={styles.actionIcon}
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className={styles.actionCount}>{localPost.comments.length}</span>
                </button>
              </div>
            </div>
            
            <div className={styles.comments}>
              {localPost.comments.map((comment) => {
                console.log('Comment data:', comment);
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
              })}
            </div>

            <div className={styles.footer}>
              <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className={styles.commentInput}
                  autoComplete="off"
                  onFocus={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <button 
                  type="button"
                  className={styles.emojiButton}
                  onClick={toggleEmojiPicker}
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
                  className={styles.submitButton}
                  disabled={!commentText.trim()}
                >
                  {commentText.trim() ? 'Post' : '...'}
                </button>
              </form>
              
              {emojiPickerOpen && (
                <>
                  <div 
                    className={styles.emojiOverlay}
                    onClick={toggleEmojiPicker}
                  />
                  <div className={styles.emojiPickerWrapper}>
                    <EmojiPicker 
                      onEmojiSelect={handleEmojiSelect}
                      isOpen={true}
                      onClose={toggleEmojiPicker}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showEditModal && (
        <EditPostModal
          post={localPost}
          onClose={() => setShowEditModal(false)}
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
        />
      )}
    </div>
  );
};

export default PostModal; 