import React from 'react';
import './Avatar.css';

interface AvatarProps {
  src: string;
  alt?: string;
  size?: number; 
}

const Avatar: React.FC<AvatarProps> = ({ src, alt = 'Avatar', size = 80 }) => {
  return (
    <div className="avatar-wrapper" style={{ width: size, height: size }}>
      <div className="avatar-border">
        <img src={src} alt={alt} className="avatar-image" />
      </div>
    </div>
  );
};

export default Avatar;