import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';

export const createChatStore = () =>
  configureStore({
    reducer: {
      chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Chat messages store Date instances, so skip serializable warnings.
        serializableCheck: false,
      }),
  });

export const store = createChatStore();

export type AppStore = ReturnType<typeof createChatStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
