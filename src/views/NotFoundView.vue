<script setup lang="ts">
import { computed } from 'vue';
import AppLogo from '../components/AppLogo.vue';
import AppSidebar from '../components/AppSidebar.vue';
import { authState } from '../auth/auth';

const isAuthenticated = computed(() => Boolean(authState.token));
</script>

<template>
  <div
    class="min-h-screen bg-background"
    :class="isAuthenticated ? 'md:grid md:grid-cols-[auto_minmax(0,1fr)]' : 'flex items-center justify-center px-5 py-10'"
  >
    <AppSidebar v-if="isAuthenticated" />

    <main
      class="flex min-w-0 items-center justify-center"
      :class="isAuthenticated ? 'px-5 py-10 sm:px-7 md:px-8 lg:px-10' : 'w-full'"
    >
      <section class="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 text-center sm:p-10">
        <div v-if="!isAuthenticated" class="mb-8 flex justify-center">
          <AppLogo />
        </div>

        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary-soft">Error 404</p>
        <h1 class="mt-3 text-3xl font-semibold text-primary sm:text-4xl">Halaman tidak ditemukan</h1>
        <p class="mx-auto mt-4 max-w-md text-sm leading-6 text-text-muted">
          Alamat yang Anda buka tidak tersedia atau mungkin sudah dipindahkan.
        </p>

        <RouterLink class="primary-button mt-7" :to="isAuthenticated ? '/beranda' : '/'">
          {{ isAuthenticated ? 'Kembali ke Beranda' : 'Kembali ke Halaman Utama' }}
        </RouterLink>
      </section>
    </main>
  </div>
</template>
