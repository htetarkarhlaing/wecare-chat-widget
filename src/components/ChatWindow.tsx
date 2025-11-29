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
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs opacity-75">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.status && isUser && (
            <span className="text-xs opacity-75 ml-2">
              {message.status === 'sending' ? '●' : '✓'}
            </span>
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
}

function ChatInput({ onSendMessage, disabled, placeholder = "Type your message...", sendLabel = "Send" }: ChatInputProps) {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !disabled) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 p-4 border-t">
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={!inputText.trim() || disabled}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
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
}

export function ChatWindow({ isOpen, onClose, config }: ChatWindowProps) {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string>();
  const [sessionId, setSessionId] = useState<string>();
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

  const toggleFullscreen = () => {
    dispatch(setFullscreenAction(!isFullscreen));
  };

  const handleClose = () => {
    dispatch(setFullscreenAction(false));
    onClose();
  };

  const positionClass = config.theme?.position === 'bottom-left' ? 'left-4' : 'right-4';
  const containerClasses = isFullscreen
    ? 'fixed inset-0 w-full h-full bg-white rounded-none shadow-2xl border border-gray-200 flex flex-col z-50'
    : `fixed bottom-4 ${positionClass} w-80 sm:w-96 max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden z-50`;
  const headerClasses = `flex items-center justify-between p-4 bg-blue-500 text-white ${
    isFullscreen ? 'rounded-none' : 'rounded-t-lg'
  }`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    chatApiService
      .getSession(sessionId)
      .then((session) => {
        if (!active) return;
        if (session.assignedUser) {
          dispatch(
            setAgentInfoAction({ name: session.assignedUser.name, status: 'online' }),
          );
        }
        const history = session.messages.map(mapApiMessageToChat);
        dispatch(mergeHistoryAction(history));
      })
      .catch(() => {
        /* swallow */
      });

    return () => {
      active = false;
    };
  }, [sessionId, chatApiService, dispatch]);

  useEffect(() => {
    if (!sessionId || !config.socketUrl) return;

    const socket = io(config.socketUrl, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    const handleConnect = () => {
      dispatch(setConnectedAction(true));
      socket.emit('joinConversation', { conversationId: sessionId });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', () => dispatch(setConnectedAction(false)));
    socket.on('conversation:newMessage', (payload: ConversationSocketPayload) => {
      if (payload.conversationId !== sessionId) return;
      const mapped = mapApiMessageToChat(payload.message);
      dispatch(addMessageAction(mapped));
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.disconnect();
      socketRef.current = null;
      dispatch(setConnectedAction(false));
    };
  }, [sessionId, config.socketUrl, dispatch]);

  const startSession = async (userInfo: { name: string; email: string; phone?: string; message?: string }) => {
    try {
      setSessionLoading(true);
      setSessionError(undefined);
      
      const response = await chatApiService.createSession(userInfo);
      
      setSessionId(response.sessionId);
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
    if (!sessionId) {
      console.error('Cannot send message: No active session');
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

  if (!isOpen) return null;

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={headerClasses}>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
          <span className="font-medium">
            {agentInfo?.name || 'Customer Support'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md bg-white/20 text-white hover:bg-white/30 focus:outline-none"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 3h6v6M9 21H3v-6m6-6L3 3m18 18-6-6"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 3h6v6m-6 12h6v-6M9 21H3v-6m0-6V3h6"
                />
              </svg>
            )}
          </button>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 text-xl font-bold"
            aria-label="Close chat"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {!sessionStarted ? (
          <UserInfoForm 
            onSubmit={startSession}
            loading={sessionLoading}
            error={sessionError}
          />
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput 
              onSendMessage={sendMessage}
              disabled={!sessionId}
              placeholder={config.labels?.placeholder || "Type your message..."}
              sendLabel={config.labels?.sendButton || 'Send'}
            />
          </>
        )}
      </div>
    </div>
  );
}