import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { postsApi, uploadApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
import EmojiPicker from '../EmojiPicker';
import { UserAvatar } from '../../utils/userAvatar';
import styles from './CreatePostModal.module.css';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const currentUser = useAuthStore(state => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('Image size must be less than 20MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      setSelectedImage(file);
      setError('');
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage && !content.trim()) {
      setError('Please add an image or caption');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = '';
      if (selectedImage) {
        const uploadResult = await uploadApi.uploadImage(selectedImage);
        imageUrl = uploadResult.url;
      }

      const postContent = content.trim() || '';
      console.log('Creating post with content:', postContent, 'and image:', imageUrl);
      await postsApi.createPost(postContent, imageUrl);
      
      handleClose();
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      if (error.response?.status === 413) {
        setError('Image file is too large');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to create post');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview('');
    setContent('');
    setError('');
    setShowEmojiPicker(false);
    onClose();
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => (prev || '') + emoji);
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div></div>
          <button 
            onClick={handleSubmit}
            disabled={loading || (!selectedImage && !content.trim())}
            className={styles.shareButton}
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.leftSection}>
            {imagePreview ? (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Preview" />
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview('');
                  }}
                  className={styles.removeImage}
                >
                  ×
                </button>
              </div>
            ) : (
              <div 
                className={styles.uploadArea}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={48} className={styles.uploadIcon} />
                <p>Drag photos and videos here</p>
                <button type="button" className={styles.selectButton}>
                  Select from computer
                </button>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              hidden
            />
          </div>

          <div className={styles.rightSection}>
            <div className={styles.userInfo}>
              <UserAvatar
                avatarUrl={currentUser.avatarUrl}
                username={currentUser.username}
                userId={currentUser._id}
                size={32}
                className={styles.avatar}
              />
              <span className={styles.username}>{currentUser.username}</span>
            </div>
            
            <textarea
              value={content || ''}
              onChange={(e) => setContent(e.target.value || '')}
              placeholder="Write a caption..."
              className={styles.caption}
              maxLength={2200}
            />
            
            <div className={styles.captionFooter}>
              <button 
                type="button"
                className={styles.emojiButton}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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
              <span className={styles.charCount}>
                {(content || '').length}/2,200
              </span>
            </div>

            {showEmojiPicker && (
              <>
                <div 
                  className={styles.emojiOverlay}
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div className={styles.emojiPickerWrapper}>
                  <EmojiPicker 
                    isOpen={true}
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                    autoClose={false}
                  />
                </div>
              </>
            )}

            {error && <div className={styles.error}>{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal; 