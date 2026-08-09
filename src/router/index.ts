import { createRouter, createWebHistory } from 'vue-router';
import LandingView from '../views/LandingView.vue';
import LoginView from '../views/auth/LoginView.vue';
import RegisterView from '../views/auth/RegisterView.vue';
import ForgotPasswordView from '../views/auth/ForgotPasswordView.vue';
import ResetPasswordView from '../views/auth/ResetPasswordView.vue';
import HomeView from '../views/HomeView.vue';
import ProfileView from '../views/ProfileView.vue';
import UserManagementView from '../views/hr/UserManagementView.vue';
import { authState } from '../auth/auth';

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
      meta: { guestOnly: true },
    },
    {
      path: '/daftar',
      name: 'register',
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: '/lupa-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: { guestOnly: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
      meta: { guestOnly: true },
    },
    {
      path: '/beranda',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/kelola-pengguna',
      name: 'user-management',
      component: UserManagementView,
      meta: { requiresAuth: true, requiresHr: true },
    },
    {
      path: '/profil',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !authState.token) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    };
  }

  if (to.meta.guestOnly && authState.token) {
    return { name: 'home' };
  }

  if (
    to.meta.requiresHr &&
    (authState.user?.role !== 'MANAJER' ||
      authState.user.department.name !== 'Human Resources')
  ) {
    return { name: 'home' };
  }
});

export default router;
