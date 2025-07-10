import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsApi, uploadApi } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { UserAvatar } from '../../utils/userAvatar';
import styles from '../../components/CreatePostModal/CreatePostModal.module.css';

const Create = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('Image size must be less than 20MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (JPG, PNG, GIF, WEBP)');
        return;
      }
      
      setSelectedImage(file);
      setError('');
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.onerror = () => {
        setError('Failed to read image file. Please try another file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage && !content.trim()) {
      setError('Please add an image or caption');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = '';
      if (selectedImage) {
        console.log('Uploading image:', selectedImage.name, selectedImage.size);
        const uploadResult = await uploadApi.uploadImage(selectedImage);
        imageUrl = uploadResult.url;
        console.log('Image uploaded successfully:', imageUrl);
      }

      const postContent = content.trim() || '';
      console.log('Creating post with content:', JSON.stringify(postContent), 'and image:', imageUrl);
      await postsApi.createPost(postContent, imageUrl);
      navigate('/');
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      if (error.response?.status === 413) {
        setError('Image file is too large. Please choose a smaller image (max 20MB).');
      } else if (error.response?.status === 400) {
        setError('Invalid image format. Please use JPG, PNG, GIF, or WEBP.');
      } else if (error.response?.data?.message) {
        setError(`Failed to create post: ${error.response.data.message}`);
      } else if (error.message?.includes('Network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('Failed to create post. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!currentUser) {
    return <div className={styles.modal}>Please log in to create posts</div>;
  }

  const isMobile = window.innerWidth <= 768;

  return (
    <div className={styles.modal} style={{ margin: '40px auto', maxWidth: 900 }}>
      <form onSubmit={handleSubmit} 
        style={{ 
          display: 'flex', 
          flex: 1, 
          minHeight: 500, 
          flexDirection: isMobile ? 'column' : 'row' 
        }}
      >
        <div className={styles.leftSection} style={{ 
          minHeight: isMobile ? 300 : 200, 
          width: isMobile ? '100%' : undefined,
          order: isMobile ? 1 : 0
        }}>
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
        <div className={styles.rightSection} style={{ 
          width: isMobile ? '100%' : 340,
          order: isMobile ? 2 : 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {isMobile && (
            <>
              <textarea
                value={content || ''}
                onChange={(e) => setContent(e.target.value || '')}
                placeholder="Write a caption..."
                className={styles.caption}
                maxLength={2200}
                style={{ marginBottom: 16, minHeight: 120 }}
              />
              <div className={styles.charCount} style={{ marginBottom: 16 }}>
                {(content || '').length}/2,200
              </div>
            </>
          )}
          <div className={styles.header} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            border: 'none', 
            padding: isMobile ? '16px 0 0 0' : '16px 0', 
            background: 'none',
            marginTop: isMobile ? 'auto' : 0
          }}>
            <div className={styles.userInfo} style={{ margin: 0, padding: 0, border: 'none' }}>
              <UserAvatar
                avatarUrl={currentUser.avatarUrl}
                username={currentUser.username}
                userId={currentUser._id}
                size={32}
                className={styles.avatar}
              />
              <span className={styles.username}>{currentUser.username}</span>
            </div>
            <button 
              type="submit" 
              className={styles.shareButton}
              disabled={loading || (!selectedImage && !content.trim())}
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>
          {!isMobile && (
            <>
              <textarea
                value={content || ''}
                onChange={(e) => setContent(e.target.value || '')}
                placeholder="Write a caption..."
                className={styles.caption}
                maxLength={2200}
              />
              <div className={styles.charCount} style={{ marginTop: 8 }}>
                {(content || '').length}/2,200
              </div>
            </>
          )}
          {error && <div className={styles.error}>{error}</div>}
        </div>
      </form>
    </div>
  );
};

export default Create; 