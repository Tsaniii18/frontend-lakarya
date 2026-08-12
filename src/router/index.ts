import { createRouter, createWebHistory } from 'vue-router';
import LandingView from '../views/LandingView.vue';
import LoginView from '../views/auth/LoginView.vue';
import RegisterView from '../views/auth/RegisterView.vue';
import ForgotPasswordView from '../views/auth/ForgotPasswordView.vue';
import ResetPasswordView from '../views/auth/ResetPasswordView.vue';
import HomeView from '../views/HomeView.vue';
import ProfileView from '../views/ProfileView.vue';
import UserManagementView from '../views/hr/UserManagementView.vue';
import RequestsView from '../views/requests/RequestsView.vue';
import LeaveFormView from '../views/requests/LeaveFormView.vue';
import LeaveDetailView from '../views/requests/LeaveDetailView.vue';
import PermissionFormView from '../views/requests/PermissionFormView.vue';
import PermissionDetailView from '../views/requests/PermissionDetailView.vue';
import ReimbursementFormView from '../views/requests/ReimbursementFormView.vue';
import ReimbursementDetailView from '../views/requests/ReimbursementDetailView.vue';
import ApprovalInboxView from '../views/approvals/ApprovalInboxView.vue';
import RequestManagementView from '../views/hr/RequestManagementView.vue';
import ReimbursementManagementView from '../views/finance/ReimbursementManagementView.vue';
import ComplaintListView from '../views/complaints/ComplaintListView.vue';
import ComplaintFormView from '../views/complaints/ComplaintFormView.vue';
import ComplaintDetailView from '../views/complaints/ComplaintDetailView.vue';
import ComplaintManagementView from '../views/hr/ComplaintManagementView.vue';
import ManagedComplaintDetailView from '../views/hr/ManagedComplaintDetailView.vue';
import NotFoundView from '../views/NotFoundView.vue';
import { authState } from '../auth/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      path: '/pengajuan',
      name: 'requests',
      component: RequestsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/pengajuan/cuti/baru',
      name: 'leave-create',
      component: LeaveFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/pengajuan/cuti/:id',
      name: 'leave-detail',
      component: LeaveDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/pengajuan/izin/baru',
      name: 'permission-create',
      component: PermissionFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/pengajuan/izin/:id',
      name: 'permission-detail',
      component: PermissionDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/pengajuan/reimbursement/baru',
      name: 'reimbursement-create',
      component: ReimbursementFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/pengajuan/reimbursement/:id',
      name: 'reimbursement-detail',
      component: ReimbursementDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/persetujuan',
      name: 'approvals',
      component: ApprovalInboxView,
      meta: { requiresAuth: true, requiresManager: true },
    },
    {
      path: '/persetujuan/:id',
      redirect: { name: 'approvals' },
    },
    {
      path: '/kelola-pengguna',
      name: 'user-management',
      component: UserManagementView,
      meta: { requiresAuth: true, requiresHr: true },
    },
    {
      path: '/kelola-pengajuan',
      name: 'request-management',
      component: RequestManagementView,
      meta: { requiresAuth: true, requiresHr: true },
    },
    {
      path: '/kelola-pengajuan/:id',
      redirect: { name: 'request-management' },
    },
    {
      path: '/kelola-reimbursement',
      name: 'reimbursement-management',
      component: ReimbursementManagementView,
      meta: { requiresAuth: true, requiresFinance: true },
    },
    {
      path: '/kelola-reimbursement/:id',
      redirect: { name: 'reimbursement-management' },
    },
    {
      path: '/keluhan',
      name: 'complaints',
      component: ComplaintListView,
      meta: { requiresAuth: true, forbidsHr: true },
    },
    {
      path: '/keluhan/baru',
      name: 'complaint-create',
      component: ComplaintFormView,
      meta: { requiresAuth: true, forbidsHr: true },
    },
    {
      path: '/keluhan/:id',
      name: 'complaint-detail',
      component: ComplaintDetailView,
      meta: { requiresAuth: true, forbidsHr: true },
    },
    {
      path: '/kelola-keluhan',
      name: 'complaint-management',
      component: ComplaintManagementView,
      meta: { requiresAuth: true, requiresHr: true },
    },
    {
      path: '/kelola-keluhan/:id',
      name: 'managed-complaint-detail',
      component: ManagedComplaintDetailView,
      meta: { requiresAuth: true, requiresHr: true },
    },
    {
      path: '/profil',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

const protectedAreaRoots = [
  '/beranda',
  '/pengajuan',
  '/persetujuan',
  '/kelola-pengguna',
  '/kelola-pengajuan',
  '/kelola-reimbursement',
  '/keluhan',
  '/kelola-keluhan',
  '/profil',
];

function isProtectedArea(path: string) {
  return protectedAreaRoots.some(
    (root) => path === root || path.startsWith(`${root}/`),
  );
}

router.beforeEach((to) => {
  const requiresAuthentication =
    to.meta.requiresAuth ||
    (to.name === 'not-found' && isProtectedArea(to.path));

  if (requiresAuthentication && !authState.token) {
    return {
      name: 'login',
      query: { redirect: to.fullPath, reason: 'auth-required' },
    };
  }

  if (to.meta.guestOnly && authState.token) {
    return { name: 'home' };
  }

  if (to.name === 'approvals') {
    if (
      authState.user?.role === 'MANAJER' &&
      authState.user.department.name === 'Human Resources'
    ) {
      return { name: 'request-management', query: { scope: 'mine' } };
    }
    if (
      authState.user?.role === 'MANAJER' &&
      authState.user.department.name === 'Finance'
    ) {
      return { name: 'reimbursement-management', query: { scope: 'mine' } };
    }
  }

  if (
    to.meta.requiresManager &&
    authState.user?.role !== 'MANAJER'
  ) {
    return { name: 'home' };
  }

  if (
    to.meta.requiresHr &&
    (authState.user?.role !== 'MANAJER' ||
      authState.user.department.name !== 'Human Resources')
  ) {
    return { name: 'home' };
  }

  if (
    to.meta.requiresFinance &&
    (authState.user?.role !== 'MANAJER' ||
      authState.user.department.name !== 'Finance')
  ) {
    return { name: 'home' };
  }

  if (
    to.meta.forbidsHr &&
    authState.user?.role === 'MANAJER' &&
    authState.user.department.name === 'Human Resources'
  ) {
    return { name: 'home' };
  }
});

export default router;
