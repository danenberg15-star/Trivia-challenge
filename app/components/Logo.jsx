import React from 'react';
import Image from 'next/image';

const Logo = () => {
  return (
    <div className="flex items-center">
      <Image 
        src="/logo.webp" 
        alt="מילה נרדפת" 
        width={400} 
        height={150} 
        style={{ width: 'auto', height: '128px' }} 
        className="object-contain" 
        priority
      />
    </div>
  );
};

export default Logo;