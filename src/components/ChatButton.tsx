interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
  unreadCount?: number;
  position?: 'bottom-right' | 'bottom-left';
}

export function ChatButton({ onClick, isOpen, unreadCount = 0, position = 'bottom-right' }: ChatButtonProps) {
  const horizontalClass = position === 'bottom-left' ? 'left-4' : 'right-4';
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-4 ${horizontalClass} w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-transform duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 z-40`}
      style={{ backgroundColor: 'var(--chat-primary-color, #3b82f6)' }}
      aria-label="Open chat"
    >
      {isOpen ? (
        <svg
          className="w-6 h-6 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ) : (
        <svg
          className="w-6 h-6 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      )}
      
      {/* Notification badge */}
      {!isOpen && unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {unreadCount}
        </div>
      )}
    </button>
  );
}