// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import workLogReducer from '../features/workLog/workLogSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workLog: workLogReducer,
  },
  // devTools: process.env.NODE_ENV !== 'production', // Redux DevTools are enabled by default in development
});