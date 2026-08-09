import { createRouter, createWebHistory } from 'vue-router';
import LandingView from '../views/LandingView.vue';
import LoginView from '../views/auth/LoginView.vue';
import RegisterView from '../views/auth/RegisterView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
    {
      path: '/masuk',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/daftar',
      name: 'register',
      component: RegisterView,
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

export default router;
