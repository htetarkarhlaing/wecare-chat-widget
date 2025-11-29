import React, { useState, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Message, ChatConfig } from '../types/chat';
import { UserInfoForm } from './UserInfoForm';
import ChatApiService, { type ChatApiMessage, type ChatSession } from '../services/chat-api';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addMessage as addMessageAction,
  mergeHistory as mergeHistoryAction,
  replaceMessage as replaceMessageAction,
  setAgentInfo as setAgentInfoAction,
  setMessages as setMessagesAction,
  setConnected as setConnectedAction,
  setFullscreen as setFullscreenAction,
} from '../store/chatSlice';

type ConversationSocketPayload = {
  conversationId: string;
  message: ChatApiMessage;
};

const SESSION_STORAGE_KEY = 'wecare_widget_session';

type StoredSession = {
  sessionId: string;
  sessionToken: string;
  createdAt: number;
};

type RatingSummary = {
  rating: number;
  feedback?: string | null;
  ratedAt?: string | null;
};

const mapApiMessageToChat = (
  apiMessage: ChatApiMessage | ChatSession['messages'][number],
): Message => {
  const timestamp = apiMessage.createdAt ? new Date(apiMessage.createdAt) : new Date();
  const sender = apiMessage.senderType === 'CONSUMER' ? 'user' : 'agent';
  const status = sender === 'user' ? (apiMessage.isRead ? 'delivered' : 'sent') : 'delivered';

  return {
    id: apiMessage.id,
    text: apiMessage.message,
    sender,
    timestamp,
    status,
  };
};

interface ChatMessageProps {
  message: Message;
  primaryColor: string;
}

function ChatMessage({ message, primaryColor }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: 16,
  };

  const bubbleStyle: React.CSSProperties = {
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: 14,
    borderTopRightRadius: isUser ? 4 : 14,
    borderTopLeftRadius: isUser ? 14 : 4,
    backgroundColor: isUser ? primaryColor : '#f3f4f6',
    color: isUser ? '#fff' : '#111827',
    fontSize: 14,
    lineHeight: 1.4,
    boxShadow: isUser ? '0 8px 20px rgba(37, 99, 235, 0.25)' : 'none',
  };

  const metaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    fontSize: 11,
    opacity: 0.75,
  };

  return (
    <div style={wrapperStyle}>
      <div style={bubbleStyle}>
        <p style={{ margin: 0 }}>{message.text}</p>
        <div style={metaStyle}>
          <span>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.status && isUser && (
            <span style={{ marginLeft: 8 }}>{message.status === 'sending' ? '●' : '✓'}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  sendLabel?: string;
  primaryColor: string;
}

function ChatInput({ onSendMessage, disabled, placeholder = "Type your message...", sendLabel = "Send", primaryColor }: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !disabled) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#fff',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 12,
    border: `1px solid ${isFocused ? primaryColor : '#d1d5db'}`,
    outline: 'none',
    fontSize: 14,
    backgroundColor: disabled ? '#f3f4f6' : '#fff',
    transition: 'border-color 0.2s ease',
    boxShadow: isFocused ? `0 0 0 3px ${primaryColor}22` : 'none',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: 12,
    border: 'none',
    fontWeight: 600,
    fontSize: 14,
    color: '#fff',
    backgroundColor: primaryColor,
    opacity: !inputText.trim() || disabled ? 0.55 : 1,
    cursor: !inputText.trim() || disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 0.15s ease',
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={!!disabled}
        style={inputStyle}
      />
      <button
        type="submit"
        disabled={!inputText.trim() || disabled}
        style={buttonStyle}
      >
        {sendLabel}
      </button>
    </form>
  );
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChatConfig;
  primaryColor: string;
  secondaryColor: string;
}

const getWindowStyle = (
  isFullscreen: boolean,
  position: NonNullable<ChatConfig['theme']>['position'] | undefined,
): React.CSSProperties => {
  if (isFullscreen) {
    return {
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#fff',
      borderRadius: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 5000,
    };
  }

  const style: React.CSSProperties = {
    position: 'fixed',
    bottom: 16,
    width: 360,
    maxWidth: 'calc(100vw - 32px)',
    height: 520,
    maxHeight: 'calc(100vh - 32px)',
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid rgba(15, 23, 42, 0.08)',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 5000,
  };

  if (position === 'bottom-left') {
    style.left = 16;
  } else {
    style.right = 16;
  }

  return style;
};

const headerStyle = (primaryColor: string, isFullscreen: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px',
  backgroundColor: primaryColor,
  color: '#fff',
  borderTopLeftRadius: isFullscreen ? 0 : 16,
  borderTopRightRadius: isFullscreen ? 0 : 16,
});

const windowBodyStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  backgroundColor: '#fff',
};

const formWrapperStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
};

const messageListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  background: 'linear-gradient(180deg, #f8fafc 0%, #fff 35%)',
};

const headerButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'rgba(255,255,255,0.22)',
  color: '#fff',
  borderRadius: 8,
  padding: 6,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const statusDot = (connected: boolean): React.CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: '999px',
  backgroundColor: connected ? '#10b981' : '#d1d5db',
  boxShadow: connected ? '0 0 0 3px rgba(16,185,129,0.35)' : 'none',
  transition: 'background-color 0.2s ease',
});

export function ChatWindow({ isOpen, onClose, config, primaryColor, secondaryColor }: ChatWindowProps) {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<ChatSession['status'] | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingNote, setRatingNote] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingResponse, setRatingResponse] = useState<RatingSummary | null>(null);
  const [ratingError, setRatingError] = useState<string>();
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state) => state.chat.messages);
  const agentInfo = useAppSelector((state) => state.chat.agentInfo);
  const socketConnected = useAppSelector((state) => state.chat.isConnected);
  const isFullscreen = useAppSelector((state) => state.chat.isFullscreen);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatApiService = React.useMemo(
    () => new ChatApiService(config.apiKey, config.apiBaseUrl, config.locale),
    [config.apiKey, config.apiBaseUrl, config.locale]
  );

  React.useEffect(() => {
    chatApiService.setSessionToken(sessionToken || undefined);
  }, [chatApiService, sessionToken]);

  React.useEffect(() => {
    if (sessionStatus && sessionStatus !== 'ACTIVE' && !ratingResponse) {
      setShowRatingForm(true);
    }
  }, [sessionStatus, ratingResponse]);

  const persistSession = React.useCallback(
    (id: string, token: string) => {
      if (typeof window === 'undefined') return;
      const payload: StoredSession = {
        sessionId: id,
        sessionToken: token,
        createdAt: Date.now(),
      };
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    },
    []
  );

  const clearPersistedSession = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const clearSessionState = React.useCallback(() => {
    setSessionStarted(false);
    setSessionId(null);
    setSessionToken(null);
    setSessionStatus(null);
    setShowRatingForm(false);
    setRatingValue(5);
    setRatingNote('');
    setRatingResponse(null);
    setRatingError(undefined);
    setRatingSubmitting(false);
    dispatch(setMessagesAction([]));
    dispatch(setAgentInfoAction(undefined));
    clearPersistedSession();
  }, [clearPersistedSession, dispatch]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as StoredSession;
      if (parsed.sessionId && parsed.sessionToken) {
        setSessionId(parsed.sessionId);
        setSessionToken(parsed.sessionToken);
        setSessionStarted(true);
      }
    } catch (error) {
      console.warn('Failed to restore chat session', error);
      clearPersistedSession();
    }
  }, [clearPersistedSession]);

  const toggleFullscreen = () => {
    dispatch(setFullscreenAction(!isFullscreen));
  };

  const handleClose = () => {
    dispatch(setFullscreenAction(false));
    onClose();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!sessionId || !sessionToken) return;
    let active = true;

    chatApiService
      .getSession(sessionId)
      .then((session) => {
        if (!active) return;
        setSessionStatus(session.status);
        if (session.assignedUser) {
          dispatch(
            setAgentInfoAction({ name: session.assignedUser.name, status: 'online' }),
          );
        }
        if (typeof session.rating === 'number') {
          setRatingResponse({
            rating: session.rating,
            feedback: session.feedback ?? null,
            ratedAt: session.ratedAt ?? null,
          });
          setShowRatingForm(false);
        } else {
          setRatingResponse(null);
        }
        const history = session.messages.map(mapApiMessageToChat);
        dispatch(mergeHistoryAction(history));
        setSessionError(undefined);
      })
      .catch((error) => {
        if (!active) return;
        console.error('Failed to load chat session', error);
        setSessionError('Your session expired. Please start a new conversation.');
        clearSessionState();
      });

    return () => {
      active = false;
    };
  }, [sessionId, sessionToken, chatApiService, dispatch, clearSessionState]);

  useEffect(() => {
    if (!sessionId || !sessionToken || !config.socketUrl) return;

    const socket = io(config.socketUrl, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    const joinPayload = { conversationId: sessionId, sessionToken };

    const handleConnect = () => {
      dispatch(setConnectedAction(true));
      socket.emit('joinConversation', joinPayload);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', () => dispatch(setConnectedAction(false)));
    socket.on('conversation:newMessage', (payload: ConversationSocketPayload) => {
      if (payload.conversationId !== sessionId) return;
      const mapped = mapApiMessageToChat(payload.message);
      dispatch(addMessageAction(mapped));
    });

    if (socket.connected) {
      socket.emit('joinConversation', joinPayload);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.disconnect();
      socketRef.current = null;
      dispatch(setConnectedAction(false));
    };
  }, [sessionId, sessionToken, config.socketUrl, dispatch]);

  const startSession = async (userInfo: { name: string; email: string; phone?: string; message?: string }) => {
    try {
      setSessionLoading(true);
      setSessionError(undefined);
      
      const response = await chatApiService.createSession(userInfo);
      
      setSessionId(response.sessionId);
      setSessionToken(response.sessionToken);
      setSessionStatus('ACTIVE');
      setShowRatingForm(false);
      setRatingResponse(null);
      setRatingValue(5);
      setRatingNote('');
      persistSession(response.sessionId, response.sessionToken);
      dispatch(
        setAgentInfoAction({
          name: response.assignedAgent.name,
          status: 'online'
        }),
      );
      setSessionStarted(true);

      // Add welcome message
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        text: config.labels?.welcomeMessage || `Hello ${userInfo.name}! I'm ${response.assignedAgent.name}. How can I help you today?`,
        sender: 'agent',
        timestamp: new Date(),
        status: 'delivered'
      };
      
      dispatch(setMessagesAction([welcomeMessage]));

      // Add initial user message if provided
      if (userInfo.message) {
        const initialMessage: Message = {
          id: `initial-${Date.now()}`,
          text: userInfo.message,
          sender: 'user',
          timestamp: new Date(),
          status: 'sent'
        };
        dispatch(addMessageAction(initialMessage));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start chat session';
      setSessionError(errorMessage);
    } finally {
      setSessionLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!sessionId || !sessionToken) {
      console.error('Cannot send message: No active session token');
      return;
    }

    // Add user message immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };
    
    dispatch(addMessageAction(userMessage));

    try {
      const response = await chatApiService.sendMessage({
        sessionId,
        message: text,
      });

      const confirmed = mapApiMessageToChat(response);
      dispatch(
        replaceMessageAction({
          tempId: userMessage.id,
          message: confirmed,
        }),
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      dispatch(
        replaceMessageAction({
          tempId: userMessage.id,
          message: { ...userMessage, status: 'sent' },
        }),
      );
    }
  };

  const submitRating = async () => {
    if (!sessionId || !sessionToken || !ratingValue) {
      return;
    }

    setRatingSubmitting(true);
    setRatingError(undefined);

    try {
      const response = await chatApiService.submitRating(sessionId, {
        rating: ratingValue,
        feedback: ratingNote.trim() || undefined,
      });

      setRatingResponse({
        rating: response.rating,
        feedback: response.feedback ?? null,
        ratedAt: response.ratedAt ?? null,
      });
      setSessionStatus(response.status);
      setShowRatingForm(false);
    } catch (error) {
      console.error('Failed to submit rating', error);
      setRatingError('Failed to submit rating. Please try again.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleStartNewChat = () => {
    setSessionError(undefined);
    clearSessionState();
  };

  const ratingStars = [1, 2, 3, 4, 5];
  const hasSubmittedRating = Boolean(ratingResponse);
  const canSendMessages = sessionStatus === 'ACTIVE' && !showRatingForm && !hasSubmittedRating;
  const shouldShowRatingPanel =
    showRatingForm || hasSubmittedRating || Boolean(sessionStatus && sessionStatus !== 'ACTIVE' && !ratingResponse);

  if (!isOpen) return null;

  return (
    <div style={getWindowStyle(isFullscreen, config.theme?.position)}>
      <div style={headerStyle(primaryColor, isFullscreen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={statusDot(socketConnected)} />
          <span style={{ fontWeight: 600 }}>
            {agentInfo?.name || 'Customer Support'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleFullscreen}
            style={headerButtonStyle}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6M9 21H3v-6m6-6L3 3m18 18-6-6" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6m-6 12h6v-6M9 21H3v-6m0-6V3h6" />
              </svg>
            )}
          </button>
          <button
            onClick={handleClose}
            style={{ ...headerButtonStyle, fontSize: 20, fontWeight: 700, width: 32, height: 32 }}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>
      </div>

      <div style={windowBodyStyle}>
        {!sessionStarted ? (
          <div style={formWrapperStyle}>
            <UserInfoForm
              onSubmit={startSession}
              loading={sessionLoading}
              error={sessionError}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          </div>
        ) : (
          <>
            <div style={messageListStyle}>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} primaryColor={primaryColor} />
              ))}
              <div ref={messagesEndRef} />
            </div>
            {shouldShowRatingPanel ? (
              <div
                style={{
                  padding: '18px 16px 20px',
                  borderTop: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {hasSubmittedRating && ratingResponse ? (
                  <>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>Thank you for your feedback!</p>
                      <p style={{ margin: '4px 0 0', color: '#475569', fontSize: 14 }}>
                        Here’s a recap of the rating you shared.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {ratingStars.map((value) => (
                        <span
                          key={`submitted-star-${value}`}
                          style={{
                            fontSize: 24,
                            color: value <= (ratingResponse?.rating || 0) ? '#f59e0b' : '#e2e8f0',
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {ratingResponse.feedback && (
                      <blockquote
                        style={{
                          margin: 0,
                          padding: '12px 14px',
                          borderRadius: 12,
                          backgroundColor: '#f8fafc',
                          fontStyle: 'italic',
                          color: '#334155',
                        }}
                      >
                        “{ratingResponse.feedback}”
                      </blockquote>
                    )}
                    <button
                      type="button"
                      onClick={handleStartNewChat}
                      style={{
                        marginTop: 4,
                        alignSelf: 'flex-start',
                        padding: '10px 16px',
                        borderRadius: 999,
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Start a new conversation
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>Rate your experience</p>
                      <p style={{ margin: '4px 0 0', color: '#475569', fontSize: 14 }}>
                        Tell us how the conversation went. Your feedback helps us improve.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {ratingStars.map((value) => (
                        <button
                          key={`star-${value}`}
                          type="button"
                          onClick={() => setRatingValue(value)}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            border: '1px solid ' + (value <= ratingValue ? primaryColor : '#e2e8f0'),
                            backgroundColor: value <= ratingValue ? `${primaryColor}15` : '#fff',
                            color: value <= ratingValue ? '#f59e0b' : '#cbd5f5',
                            fontSize: 22,
                            cursor: 'pointer',
                          }}
                        >
                          {value <= ratingValue ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={ratingNote}
                      onChange={(e) => setRatingNote(e.target.value)}
                      placeholder="Share additional feedback (optional)"
                      rows={3}
                      style={{
                        width: '100%',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        padding: '10px 12px',
                        fontSize: 14,
                        resize: 'none',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                    {ratingError && (
                      <p style={{ margin: 0, color: '#b91c1c', fontSize: 13 }}>{ratingError}</p>
                    )}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {sessionStatus === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowRatingForm(false);
                            setRatingError(undefined);
                          }}
                          style={{
                            padding: '10px 16px',
                            borderRadius: 999,
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#fff',
                            color: '#0f172a',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Back to chat
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={submitRating}
                        disabled={ratingSubmitting}
                        style={{
                          padding: '10px 18px',
                          borderRadius: 999,
                          border: 'none',
                          background: `linear-gradient(120deg, ${primaryColor}, ${secondaryColor})`,
                          color: '#fff',
                          fontWeight: 600,
                          cursor: ratingSubmitting ? 'not-allowed' : 'pointer',
                          opacity: ratingSubmitting ? 0.7 : 1,
                        }}
                      >
                        {ratingSubmitting ? 'Sending...' : 'Submit rating'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <ChatInput
                  onSendMessage={sendMessage}
                  disabled={!sessionId || !sessionToken || !canSendMessages}
                  placeholder={config.labels?.placeholder || 'Type your message...'}
                  sendLabel={config.labels?.sendButton || 'Send'}
                  primaryColor={primaryColor}
                />
                {sessionStatus === 'ACTIVE' && (
                  <div style={{ padding: '0 16px 16px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRatingForm(true);
                        setRatingError(undefined);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: primaryColor,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      End chat & leave a rating
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}