import React from 'react';
interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
  unreadCount?: number;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor: string;
}

export function ChatButton({ onClick, isOpen, unreadCount = 0, position = 'bottom-right', primaryColor }: ChatButtonProps) {
  const [isHover, setIsHover] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 16,
    [position === 'bottom-left' ? 'left' : 'right']: 16,
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: primaryColor,
    color: '#fff',
    boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: isPressed ? 'scale(0.95)' : isHover ? 'scale(1.05)' : 'scale(1)',
    transition: 'transform 0.15s ease',
    zIndex: 4000,
  };

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
  };

  return (
    <button
      onClick={onClick}
      style={buttonStyle}
      aria-label="Open chat"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => {
        setIsHover(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {isOpen ? (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      )}

      {!isOpen && unreadCount > 0 && <div style={badgeStyle}>{unreadCount}</div>}
    </button>
  );
}