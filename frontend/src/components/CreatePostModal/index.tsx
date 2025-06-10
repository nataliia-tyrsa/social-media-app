import { useState, useRef } from 'react';
import { Upload, Smile } from 'lucide-react';
import { postsApi, uploadApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
import EmojiPicker from '../EmojiPicker';
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

      await postsApi.createPost(content.trim(), imageUrl);
      
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
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Create new post</h2>
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
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face'}
                alt="avatar"
                className={styles.avatar}
              />
              <span className={styles.username}>{currentUser.username}</span>
            </div>
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
                <Smile />
              </button>
              <span className={styles.charCount}>
                {content.length}/2,200
              </span>
            </div>

            {showEmojiPicker && (
              <div className={styles.emojiPickerWrapper}>
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal; 