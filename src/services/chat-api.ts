const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface CreateSessionRequest {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  consumer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  assignedAgent: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ChatSession {
  id: string;
  consumer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  assignedUser: {
    id: string;
    name: string;
    email: string;
  };
  messages: Array<{
    id: string;
    message: string;
    senderType: 'CONSUMER' | 'USER' | 'SYSTEM';
    senderUserId?: string;
    senderConsumerId?: string;
    createdAt: string;
    isRead: boolean;
  }>;
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface ChatApiMessage {
  id: string;
  conversationId: string;
  senderType: 'CONSUMER' | 'USER' | 'SYSTEM';
  message: string;
  createdAt: string;
  senderUserId?: string | null;
  senderConsumerId?: string | null;
  isRead: boolean;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
}

class ChatApiService {
  private baseURL: string;
  private apiKey: string;
  private locale?: string;

  constructor(
    apiKey: string,
    baseURL: string = DEFAULT_API_BASE_URL,
    locale?: string,
  ) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.locale = locale;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const { headers, ...rest } = options;
    const mergedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...(this.locale
        ? {
            'x-wecare-locale': this.locale,
            'accept-language': this.locale,
          }
        : {}),
      ...(headers as Record<string, string> | undefined),
    };

    const response = await fetch(url, {
      headers: mergedHeaders,
      ...rest,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async createSession(sessionData: CreateSessionRequest): Promise<CreateSessionResponse> {
    return this.request('/widget/chat/session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    return this.request(`/widget/chat/session/${sessionId}`);
  }

  async sendMessage(messageData: SendMessageRequest): Promise<ChatApiMessage> {
    return this.request<ChatApiMessage>('/widget/chat/message', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }
}

export default ChatApiService;