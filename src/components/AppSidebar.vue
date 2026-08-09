<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLogo from './AppLogo.vue';
import { authState, logout } from '../auth/auth';

const route = useRoute();
const router = useRouter();
const collapsed = ref(localStorage.getItem('lakarya_sidebar_collapsed') === '1');
const mobileOpen = ref(false);

const isHrManager = computed(
  () =>
    authState.user?.role === 'MANAJER' &&
    authState.user.department.name === 'Human Resources',
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
  () => {
    mobileOpen.value = false;
  },
);
</script>

<template>
  <header class="flex items-center justify-between bg-primary px-5 py-4 text-white md:hidden">
    <AppLogo mode="inverse" />
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
    class="fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col overflow-y-auto bg-primary px-6 py-7 text-white transition-[width,transform] duration-200 md:static md:z-auto md:min-h-screen md:translate-x-0"
    :class="[
      mobileOpen ? 'translate-x-0' : '-translate-x-full',
      collapsed ? 'md:w-20 md:px-3' : 'md:w-[248px] md:px-6',
    ]"
  >
    <div class="flex items-center justify-between" :class="{ 'md:flex-col md:gap-4': collapsed }">
      <AppLogo class="md:hidden" mode="inverse" />
      <AppLogo v-if="!collapsed" class="hidden md:inline-flex" mode="inverse" />
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

      <div
        class="portal-nav-item flex items-center gap-3"
        :class="collapsed ? 'md:justify-center md:px-0' : ''"
        aria-disabled="true"
        title="Pengajuan"
      >
        <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M7 3v3M17 3v3M4 9h16" />
          <rect x="4" y="5" width="16" height="15" rx="2" />
        </svg>
        <span :class="{ 'md:hidden': collapsed }">Pengajuan</span>
      </div>

      <div
        class="portal-nav-item flex items-center gap-3"
        :class="collapsed ? 'md:justify-center md:px-0' : ''"
        aria-disabled="true"
        title="Keluhan"
      >
        <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M5 18.5 3.5 21l4-1.2a9 9 0 1 0-2.5-1.3Z" />
          <path d="M12 8v4M12 15.5h.01" />
        </svg>
        <span :class="{ 'md:hidden': collapsed }">Keluhan</span>
      </div>

      <RouterLink
        v-if="isHrManager"
        class="portal-nav-item flex items-center gap-3"
        :class="[
          { 'portal-nav-item-active': route.path === '/kelola-pengguna' },
          collapsed ? 'md:justify-center md:px-0' : '',
        ]"
        to="/kelola-pengguna"
        title="Kelola Pengguna"
      >
        <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 7h5M18.5 4.5v5" />
        </svg>
        <span :class="{ 'md:hidden': collapsed }">Kelola Pengguna</span>
      </RouterLink>

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
