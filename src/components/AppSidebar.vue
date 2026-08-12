<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLogo from './AppLogo.vue';
import ApprovalIcon from './ApprovalIcon.vue';
import { authState, logout } from '../auth/auth';

const route = useRoute();
const router = useRouter();
const collapsed = ref(localStorage.getItem('lakarya_sidebar_collapsed') === '1');
const mobileOpen = ref(false);
const hrMenuOpen = ref(
  route.path.startsWith('/persetujuan') ||
    route.path.startsWith('/kelola-pengajuan') ||
    route.path === '/kelola-pengguna' ||
    route.path.startsWith('/kelola-keluhan') ||
    route.query.from === 'persetujuan' ||
    route.query.from === 'kelola-pengajuan',
);
const financeMenuOpen = ref(
  route.path.startsWith('/persetujuan') ||
    route.path.startsWith('/kelola-reimbursement') ||
    route.query.from === 'persetujuan' ||
    route.query.from === 'kelola-reimbursement',
);

const isHrManager = computed(
  () =>
    authState.user?.role === 'MANAJER' &&
    authState.user.department.name === 'Human Resources',
);
const isManager = computed(() => authState.user?.role === 'MANAJER');
const isFinanceManager = computed(
  () =>
    authState.user?.role === 'MANAJER' &&
    authState.user.department.name === 'Finance',
);
const isDepartmentManager = computed(
  () => isManager.value && !isHrManager.value && !isFinanceManager.value,
);
const requestDetailSource = computed(() => route.query.from);
const isIncomingRequestDetail = computed(
  () =>
    route.path.startsWith('/pengajuan/') &&
    requestDetailSource.value === 'persetujuan',
);
const isHrManagedRequestDetail = computed(
  () =>
    route.path.startsWith('/pengajuan/') &&
    requestDetailSource.value === 'kelola-pengajuan',
);
const isFinanceManagedRequestDetail = computed(
  () =>
    route.path.startsWith('/pengajuan/') &&
    requestDetailSource.value === 'kelola-reimbursement',
);
const isOwnRequestRoute = computed(
  () =>
    route.path.startsWith('/pengajuan') &&
    !isIncomingRequestDetail.value &&
    !isHrManagedRequestDetail.value &&
    !isFinanceManagedRequestDetail.value,
);

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
  localStorage.setItem('lakarya_sidebar_collapsed', collapsed.value ? '1' : '0');
}

async function handleLogout() {
  await logout();
  await router.push('/masuk');
}

watch(
  () => route.path,
  (path) => {
    mobileOpen.value = false;
    if (
      path.startsWith('/persetujuan') ||
      path.startsWith('/kelola-pengajuan') ||
      path === '/kelola-pengguna' ||
      path.startsWith('/kelola-keluhan')
    ) {
      hrMenuOpen.value = true;
    }
    if (
      path.startsWith('/persetujuan') ||
      path.startsWith('/kelola-reimbursement')
    ) {
      financeMenuOpen.value = true;
    }
  },
);
</script>

<template>
  <header class="flex items-center justify-between bg-primary px-5 py-4 text-white md:hidden">
    <AppLogo v-if="!mobileOpen" mode="inverse" />
    <button
      class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light"
      type="button"
      aria-label="Buka menu"
      @click="mobileOpen = true"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  </header>

  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-40 bg-primary/45 md:hidden"
    aria-hidden="true"
    @click="mobileOpen = false"
  ></div>

  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col overflow-y-auto bg-primary px-6 py-7 text-white transition-[width,transform] duration-200 md:sticky md:inset-y-auto md:top-0 md:z-auto md:h-screen md:self-start md:translate-x-0"
    :class="[
      mobileOpen ? 'translate-x-0' : '-translate-x-full',
      collapsed ? 'md:w-20 md:px-3' : 'md:w-[248px] md:px-6',
    ]"
  >
    <div class="flex items-center justify-between" :class="{ 'md:flex-col md:gap-4': collapsed }">
      <div class="md:hidden">
        <AppLogo mode="inverse" />
      </div>
      <div v-if="!collapsed" class="hidden md:block">
        <AppLogo mode="inverse" />
      </div>
      <span
        v-else
        class="hidden h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-sm font-semibold text-white md:inline-flex"
        aria-label="LaKarya"
      >
        LK
      </span>

      <button
        class="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-brand-light hover:bg-white/10 hover:text-white md:inline-flex"
        type="button"
        :aria-label="collapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'"
        @click="toggleCollapsed"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path v-if="collapsed" d="m9 6 6 6-6 6" />
          <path v-else d="m15 6-6 6 6 6" />
        </svg>
      </button>

      <button
        class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 md:hidden"
        type="button"
        aria-label="Tutup menu"
        @click="mobileOpen = false"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>

    <nav class="mt-10 space-y-2" aria-label="Navigasi portal">
      <RouterLink
        class="portal-nav-item flex items-center gap-3"
        :class="[
          { 'portal-nav-item-active': route.path === '/beranda' },
          collapsed ? 'md:justify-center md:px-0' : '',
        ]"
        to="/beranda"
        title="Beranda"
      >
        <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
        <span :class="{ 'md:hidden': collapsed }">Beranda</span>
      </RouterLink>

      <RouterLink
        class="portal-nav-item flex items-center gap-3"
        :class="[
          { 'portal-nav-item-active': isOwnRequestRoute },
          collapsed ? 'md:justify-center md:px-0' : '',
        ]"
        to="/pengajuan"
        title="Pengajuan Saya"
      >
        <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M7 3v3M17 3v3M4 9h16" />
          <rect x="4" y="5" width="16" height="15" rx="2" />
        </svg>
        <span :class="{ 'md:hidden': collapsed }">Pengajuan Saya</span>
      </RouterLink>

      <RouterLink
        v-if="!isHrManager"
        class="portal-nav-item flex items-center gap-3"
        :class="[
          { 'portal-nav-item-active': route.path.startsWith('/keluhan') },
          collapsed ? 'md:justify-center md:px-0' : '',
        ]"
        to="/keluhan"
        title="Keluhan Saya"
      >
        <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M5 18.5 3.5 21l4-1.2a9 9 0 1 0-2.5-1.3Z" />
          <path d="M12 8v4M12 15.5h.01" />
        </svg>
        <span :class="{ 'md:hidden': collapsed }">Keluhan Saya</span>
      </RouterLink>

      <RouterLink
        v-if="isDepartmentManager"
        class="portal-nav-item flex items-center gap-3"
        :class="[
          { 'portal-nav-item-active': route.path.startsWith('/persetujuan') || isIncomingRequestDetail },
          collapsed ? 'md:justify-center md:px-0' : '',
        ]"
        to="/persetujuan"
        title="Pengajuan Masuk"
      >
        <ApprovalIcon class="h-5 w-5 shrink-0" />
        <span :class="{ 'md:hidden': collapsed }">Pengajuan Masuk</span>
      </RouterLink>

      <div v-if="isHrManager">
        <button
          class="portal-nav-item flex w-full items-center gap-3 text-left"
          :class="[
            {
              'portal-nav-item-active':
                route.path.startsWith('/persetujuan') ||
                route.path.startsWith('/kelola-pengajuan') ||
                isIncomingRequestDetail ||
                isHrManagedRequestDetail ||
                route.path === '/kelola-pengguna' ||
                route.path.startsWith('/kelola-keluhan'),
            },
            collapsed ? 'md:justify-center md:px-0' : '',
          ]"
          type="button"
          title="Kelola HR"
          :aria-expanded="hrMenuOpen"
          aria-controls="hr-management-menu"
          @click="hrMenuOpen = !hrMenuOpen"
        >
          <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M4 7.5h16M7 3.5v4M17 3.5v4" />
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M8 12h3M8 16h5" />
          </svg>
          <span class="min-w-0 flex-1" :class="{ 'md:hidden': collapsed }">Kelola HR</span>
          <svg class="h-4 w-4 shrink-0 transition-transform" :class="[{ 'rotate-180': hrMenuOpen }, { 'md:hidden': collapsed }]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
        </button>

        <div
          v-if="hrMenuOpen"
          id="hr-management-menu"
          class="ml-4 mt-1 space-y-1 border-l border-white/15 pl-3"
          :class="{ 'md:ml-0 md:border-l-0 md:pl-0': collapsed }"
        >
          <RouterLink class="portal-nav-item flex items-center gap-3 py-2" :class="[{ 'portal-nav-item-active': route.path.startsWith('/persetujuan') || isIncomingRequestDetail }, collapsed ? 'md:justify-center md:px-0' : '']" to="/persetujuan" title="Pengajuan Masuk"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-current"></span><span :class="{ 'md:hidden': collapsed }">Pengajuan Masuk</span></RouterLink>
          <RouterLink class="portal-nav-item flex items-center gap-3 py-2" :class="[{ 'portal-nav-item-active': route.path.startsWith('/kelola-pengajuan') || isHrManagedRequestDetail }, collapsed ? 'md:justify-center md:px-0' : '']" to="/kelola-pengajuan" title="Daftar Pengajuan"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-current"></span><span :class="{ 'md:hidden': collapsed }">Daftar Pengajuan</span></RouterLink>
          <RouterLink class="portal-nav-item flex items-center gap-3 py-2" :class="[{ 'portal-nav-item-active': route.path === '/kelola-pengguna' }, collapsed ? 'md:justify-center md:px-0' : '']" to="/kelola-pengguna" title="Daftar Pengguna"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-current"></span><span :class="{ 'md:hidden': collapsed }">Daftar Pengguna</span></RouterLink>
          <RouterLink class="portal-nav-item flex items-center gap-3 py-2" :class="[{ 'portal-nav-item-active': route.path.startsWith('/kelola-keluhan') }, collapsed ? 'md:justify-center md:px-0' : '']" to="/kelola-keluhan" title="Keluhan Masuk"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-current"></span><span :class="{ 'md:hidden': collapsed }">Keluhan Masuk</span></RouterLink>
        </div>
      </div>

      <div v-if="isFinanceManager">
        <button
          class="portal-nav-item flex w-full items-center gap-3 text-left"
          :class="[
            {
              'portal-nav-item-active':
                route.path.startsWith('/persetujuan') ||
                route.path.startsWith('/kelola-reimbursement') ||
                isIncomingRequestDetail ||
                isFinanceManagedRequestDetail,
            },
            collapsed ? 'md:justify-center md:px-0' : '',
          ]"
          type="button"
          title="Kelola Keuangan"
          :aria-expanded="financeMenuOpen"
          aria-controls="finance-management-menu"
          @click="financeMenuOpen = !financeMenuOpen"
        >
          <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="14" rx="2" />
            <path d="M7 10h10M7 14h6" />
          </svg>
          <span class="min-w-0 flex-1" :class="{ 'md:hidden': collapsed }">Kelola Keuangan</span>
          <svg class="h-4 w-4 shrink-0 transition-transform" :class="[{ 'rotate-180': financeMenuOpen }, { 'md:hidden': collapsed }]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
        </button>

        <div
          v-if="financeMenuOpen"
          id="finance-management-menu"
          class="ml-4 mt-1 space-y-1 border-l border-white/15 pl-3"
          :class="{ 'md:ml-0 md:border-l-0 md:pl-0': collapsed }"
        >
          <RouterLink class="portal-nav-item flex items-center gap-3 py-2" :class="[{ 'portal-nav-item-active': route.path.startsWith('/persetujuan') || isIncomingRequestDetail }, collapsed ? 'md:justify-center md:px-0' : '']" to="/persetujuan" title="Pengajuan Masuk"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-current"></span><span :class="{ 'md:hidden': collapsed }">Pengajuan Masuk</span></RouterLink>
          <RouterLink class="portal-nav-item flex items-center gap-3 py-2" :class="[{ 'portal-nav-item-active': route.path.startsWith('/kelola-reimbursement') || isFinanceManagedRequestDetail }, collapsed ? 'md:justify-center md:px-0' : '']" to="/kelola-reimbursement" title="Reimbursement"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-current"></span><span :class="{ 'md:hidden': collapsed }">Reimbursement</span></RouterLink>
        </div>
      </div>

      <RouterLink
        class="portal-nav-item flex items-center gap-3"
        :class="[
          { 'portal-nav-item-active': route.path === '/profil' },
          collapsed ? 'md:justify-center md:px-0' : '',
        ]"
        to="/profil"
        title="Profil"
      >
        <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </svg>
        <span :class="{ 'md:hidden': collapsed }">Profil</span>
      </RouterLink>
    </nav>

    <div class="mt-auto border-t border-white/15 pt-5">
      <div :class="{ 'md:hidden': collapsed }">
        <p class="truncate text-sm font-medium">{{ authState.user?.name }}</p>
        <p class="mt-1 truncate text-xs text-brand-light">
          {{ authState.user?.role === 'MANAJER' ? 'Manajer' : 'Staf' }} | {{ authState.user?.department.name }}
        </p>
      </div>
      <button
        class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light"
        type="button"
        title="Keluar"
        @click="handleLogout"
      >
        <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
        </svg>
        <span :class="{ 'md:hidden': collapsed }">Keluar</span>
      </button>
    </div>
  </aside>
</template>
