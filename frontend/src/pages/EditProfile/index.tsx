import styles from './EditProfile.module.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi, uploadApi } from '../../services/api';
import useAuthStore from '../../store/authStore';

const EditProfile = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const refreshUser = useAuthStore(state => state.refreshUser);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    bio: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        fullName: currentUser.fullName || '',
        bio: currentUser.bio || ''
      });
      setAvatarPreview(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      setAvatarFile(file);
      setError('');
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let updateData: {
        username?: string;
        fullName?: string;
        bio?: string;
        avatarUrl?: string;
      } = {};

      // Only include changed fields
      if (formData.username !== currentUser?.username) {
        updateData.username = formData.username;
      }
      if (formData.fullName !== currentUser?.fullName) {
        updateData.fullName = formData.fullName;
      }
      if (formData.bio !== currentUser?.bio) {
        updateData.bio = formData.bio;
      }

      // Upload avatar if changed
      if (avatarFile) {
        console.log('Uploading avatar file:', avatarFile.name);
        const uploadResult = await uploadApi.uploadImage(avatarFile);
        console.log('Avatar upload result:', uploadResult);
        updateData.avatarUrl = uploadResult.url;
      }

      console.log('Updating profile with data:', updateData);

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        const updatedUser = await usersApi.updateProfile(updateData);
        console.log('Profile update result:', updatedUser);
        updateUser(updatedUser);
        
        // Refresh user data to ensure consistency
        await refreshUser();
        
        console.log('Updated user in store:', updatedUser);
        setSuccess('Profile updated successfully!');
        
        // Navigate back to profile after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        setError('No changes to save');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (!currentUser) {
    return <div className={styles.container}>Please log in to edit profile</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Edit profile</h2>
        <button 
          type="button" 
          onClick={handleCancel}
          className={styles.cancelButton}
        >
          Cancel
        </button>
      </div>

      <div className={styles.profile}>
        <img 
          src={avatarPreview || "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=150&h=150&fit=crop&crop=face"} 
          alt="avatar" 
          className={styles.avatar} 
        />
        <div className={styles.info}>
          <strong>{currentUser.username}</strong>
          <button 
            type="button"
            className={styles.newPhoto}
            onClick={() => avatarInputRef.current?.click()}
          >
            Change photo
          </button>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarSelect}
            accept="image/*"
            hidden
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Full Name</label>
          <input 
            type="text" 
            name="fullName"
            value={formData.fullName} 
            onChange={handleChange}
            required
            maxLength={50}
          />
        </div>

        <div className={styles.field}>
          <label>Username</label>
          <input 
            type="text" 
            name="username"
            value={formData.username} 
            onChange={handleChange}
            required
            maxLength={30}
            pattern="^[a-zA-Z0-9_]+$"
            title="Username can only contain letters, numbers, and underscores"
          />
        </div>

        <div className={styles.field}>
          <label>Bio</label>
          <textarea
            name="bio"
            maxLength={150}
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            rows={3}
          />
          <div className={styles.counter}>{formData.bio.length} / 150</div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.buttons}>
          <button 
            type="button" 
            onClick={handleCancel}
            className={styles.cancelBtn}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.save}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;