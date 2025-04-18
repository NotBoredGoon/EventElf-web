import React from 'react';
import './ElfsAvatar.css';

interface ElfsAvatarProps {
  size?: number;
}

const ElfsAvatar: React.FC<ElfsAvatarProps> = ({ size = 40 }) => {
  // This component creates a circular avatar with "EE" inside
  // Similar to the create_default_avatar function in the original code
  
  return (
    <div 
      className="avatar-container" 
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        fontSize: `${size / 2.5}px`,
      }}
    >
      EE
    </div>
  );
};

export default ElfsAvatar;