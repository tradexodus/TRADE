import React from 'react';

export const TRC20Icon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#FF060A"/>
    <path d="M21.8 8.4H10.2c-.4 0-.8.4-.8.8v14.4c0 .4.4.8.8.8h11.6c.4 0 .8-.4.8-.8V9.2c0-.4-.4-.8-.8-.8z" fill="white"/>
    <path d="M16 11.2c-2.6 0-4.8 2.2-4.8 4.8s2.2 4.8 4.8 4.8 4.8-2.2 4.8-4.8-2.2-4.8-4.8-4.8zm0 8c-1.8 0-3.2-1.4-3.2-3.2s1.4-3.2 3.2-3.2 3.2 1.4 3.2 3.2-1.4 3.2-3.2 3.2z" fill="#FF060A"/>
  </svg>
);

export const BEP20Icon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
    <path d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.26L16 26l-6.144-6.144 2.26-2.26zM21.48 16l2.26-2.26L26 16l-2.26 2.26L21.48 16z" fill="white"/>
    <path d="M20.043 11.958L16 7.914l-4.043 4.043-2.26-2.26L16 3.394l6.303 6.303-2.26 2.26zm0 8.084L16 24.086l-4.043-4.043-2.26 2.26L16 28.606l6.303-6.303-2.26-2.26z" fill="white"/>
  </svg>
);

export const ERC20Icon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#627EEA"/>
    <path d="M16.498 4v8.87l7.497 3.35-7.497-12.22z" fill="white" fillOpacity="0.602"/>
    <path d="M16.498 4L9 16.22l7.498-3.35V4z" fill="white"/>
    <path d="M16.498 21.968v6.027L24 17.616l-7.502 4.352z" fill="white" fillOpacity="0.602"/>
    <path d="M16.498 27.995v-6.028L9 17.616l7.498 10.38z" fill="white"/>
    <path d="M16.498 20.573l7.497-4.353-7.497-3.348v7.701z" fill="white" fillOpacity="0.2"/>
    <path d="M9 16.22l7.498 4.353v-7.701L9 16.22z" fill="white" fillOpacity="0.602"/>
  </svg>
);