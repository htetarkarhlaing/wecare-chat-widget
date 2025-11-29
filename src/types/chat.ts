export type ChatLocale = 'en' | 'my' | 'zh';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ChatConfig {
  apiKey: string;
  vendorId?: string;
  apiBaseUrl?: string;
  socketUrl?: string;
  locale?: ChatLocale;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    position?: 'bottom-right' | 'bottom-left';
  };
  labels?: {
    welcomeMessage?: string;
    placeholder?: string;
    sendButton?: string;
  };
}

export interface ChatState {
  isOpen: boolean;
  isFullscreen: boolean;
  messages: Message[];
  isConnected: boolean;
  isTyping: boolean;
  agentInfo?: {
    name: string;
    avatar?: string;
    status: 'online' | 'offline';
  };
}

export interface WidgetConfig {
  apiEndpoint: string;
  socketEndpoint: string;
  allowedOrigins?: string[];
}