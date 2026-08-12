import { createApp } from 'vue';
import axios from 'axios';
import App from './App.vue';
import { authState, clearAuth } from './auth/auth';
import api from './lib/api';
import router from './router';
import './style.css';

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const isInvalidSession =
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      authState.token &&
      error.config?.url !== '/auth/logout';

    if (isInvalidSession) {
      const redirect = router.currentRoute.value.fullPath;
      clearAuth();

      if (router.currentRoute.value.name !== 'login') {
        void router.replace({
          name: 'login',
          query: { redirect, reason: 'session-expired' },
        });
      }
    }

    return Promise.reject(error);
  },
);

createApp(App).use(router).mount('#app');
