import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatState, Message } from '../types/chat';

const sortMessages = (messages: Message[]) =>
  [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

const upsertMessage = (messages: Message[], next: Message) => {
  const index = messages.findIndex((msg) => msg.id === next.id);
  if (index >= 0) {
    const clone = [...messages];
    clone[index] = next;
    return sortMessages(clone);
  }

  return sortMessages([...messages, next]);
};

const replaceTempMessage = (messages: Message[], tempId: string, next: Message) => {
  const filtered = messages.filter((msg) => msg.id !== tempId);
  return upsertMessage(filtered, next);
};

const mergeHistoryEntries = (current: Message[], history: Message[]) => {
  const preservedSystem = current.filter((msg) => msg.id.startsWith('welcome-'));
  return history.reduce((acc, entry) => upsertMessage(acc, entry), preservedSystem);
};

const createInitialState = (): ChatState => ({
  isOpen: false,
  isFullscreen: false,
  messages: [],
  isConnected: false,
  isTyping: false,
});

const initialState = createInitialState();

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleChat(state) {
      state.isOpen = !state.isOpen;
      if (!state.isOpen) {
        state.isFullscreen = false;
      }
    },
    setChatOpen(state, action: PayloadAction<boolean>) {
      state.isOpen = action.payload;
      if (!state.isOpen) {
        state.isFullscreen = false;
      }
    },
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = sortMessages(action.payload);
    },
    addMessage(state, action: PayloadAction<Message>) {
      state.messages = upsertMessage(state.messages, action.payload);
    },
    replaceMessage(
      state,
      action: PayloadAction<{ tempId: string; message: Message }>,
    ) {
      state.messages = replaceTempMessage(
        state.messages,
        action.payload.tempId,
        action.payload.message,
      );
    },
    mergeHistory(state, action: PayloadAction<Message[]>) {
      state.messages = mergeHistoryEntries(state.messages, action.payload);
    },
    setTyping(state, action: PayloadAction<boolean>) {
      state.isTyping = action.payload;
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },
    setAgentInfo(state, action: PayloadAction<ChatState['agentInfo'] | undefined>) {
      state.agentInfo = action.payload;
    },
    setFullscreen(state, action: PayloadAction<boolean>) {
      state.isFullscreen = action.payload;
    },
    resetChatState: () => createInitialState(),
  },
});

export const {
  toggleChat,
  setChatOpen,
  setMessages,
  addMessage,
  replaceMessage,
  mergeHistory,
  setTyping,
  setConnected,
  setAgentInfo,
  setFullscreen,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;
