import React from 'react';
import UserIcon from '../components/UserIcon';

interface UserAvatarProps {
  avatarUrl?: string;
  username?: string;
  userId?: string;
  size?: number;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  avatarUrl, 
  username, 
  userId, 
  size = 40, 
  className = '' 
}) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${username || 'User'} avatar`}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover'
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8e8e8e'
      }}
    >
      <UserIcon size={size * 0.6} />
    </div>
  );
}; 