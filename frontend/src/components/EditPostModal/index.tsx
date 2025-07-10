import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { postsApi, uploadApi, Post } from '../../services/api';
import styles from './EditPostModal.module.css';

interface EditPostModalProps {
  post: Post;
  onClose: () => void;
  onPostUpdated: (updatedPost: Post) => void;
  onPostDeleted: () => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  onClose,
  onPostUpdated,
  onPostDeleted
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(post.content || '');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(post.imageUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');

    try {
      let imageUrl = post.imageUrl;
      
      if (selectedImage) {
        const uploadResult = await uploadApi.uploadImage(selectedImage);
        imageUrl = uploadResult.url;
      } else if (!imagePreview && post.imageUrl) {
        imageUrl = '';
      }

      const updatedPost = await postsApi.updatePost(post._id, {
        content: content.trim(),
        imageUrl
      });

      onPostUpdated(updatedPost);
      onClose();
    } catch (error: any) {
      console.error('Error updating post:', error);
      setError(error.response?.data?.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      await postsApi.deletePost(post._id);
      onPostDeleted();
      onClose();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      setError(error.response?.data?.message || 'Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Edit Post</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.leftSection}>
            {imagePreview ? (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Preview" />
                <button 
                  type="button" 
                  onClick={handleRemoveImage}
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
                <div className={styles.uploadIcon}>📷</div>
                <p>Click to select image</p>
                <small>Max 20MB, JPG/PNG/GIF/WEBP</small>
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
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a caption..."
              className={styles.caption}
              maxLength={2200}
            />
            <div className={styles.charCount}>
              {content.length}/2,200
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.actions}>
              <button 
                onClick={handleUpdate}
                className={styles.updateButton}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Post'}
              </button>
              
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.deleteButton}
                disabled={loading}
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmDialog}>
              <h3>Delete Post</h3>
              <p>Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className={styles.confirmButtons}>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className={styles.confirmDeleteButton}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditPostModal; 