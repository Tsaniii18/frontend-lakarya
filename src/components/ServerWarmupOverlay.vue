<script setup lang="ts">
import { computed, ref } from 'vue';
import AppLogo from './AppLogo.vue';
import {
  retryServerConnection,
  serverReadiness,
} from '../lib/server-readiness';

const retrying = ref(false);
const visible = computed(
  () =>
    serverReadiness.isBlocking &&
    (retrying.value ||
      serverReadiness.isSlow ||
      serverReadiness.status === 'failed'),
);
const failed = computed(() => serverReadiness.status === 'failed');

async function handleRetry() {
  retrying.value = true;

  try {
    await retryServerConnection();
  } catch {
    // Overlay tetap terbuka dan pengguna dapat mencoba kembali.
  } finally {
    retrying.value = false;
  }
}
</script>

<template>
  <Transition name="warmup-fade">
    <div
      v-if="visible"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-primary/25 px-5 py-8 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      :aria-busy="!failed"
    >
      <section class="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-[0_24px_70px_rgba(15,39,71,0.2)] sm:p-8">
        <div class="flex justify-center">
          <AppLogo />
        </div>

        <div
          v-if="!failed"
          class="mx-auto mt-7 flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f0f7] text-primary-soft"
          aria-hidden="true"
        >
          <svg class="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" />
            <path class="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </div>
        <div
          v-else
          class="mx-auto mt-7 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8efdf] text-warning"
          aria-hidden="true"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 8v5" />
            <path d="M12 17h.01" />
            <path d="M10.3 4.2 3.2 17a2 2 0 0 0 1.8 3h14a2 2 0 0 0 1.8-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>

        <h1 class="mt-5 text-xl font-semibold text-primary">
          {{ failed ? 'Server belum siap' : 'Menyiapkan LaKarya' }}
        </h1>
        <p class="mt-2 text-sm leading-6 text-text-muted">
          <template v-if="failed">
            Penyiapan server membutuhkan waktu lebih lama dari biasanya. Periksa koneksi Anda, lalu coba kembali.
          </template>
          <template v-else>
            Server demo sedang aktif kembali setelah tidak digunakan. Proses ini dapat memerlukan waktu hingga satu menit dan halaman akan terbuka otomatis.
          </template>
        </p>

        <button
          v-if="failed"
          class="primary-button mt-6 w-full"
          type="button"
          :disabled="retrying"
          @click="handleRetry"
        >
          {{ retrying ? 'Menghubungkan...' : 'Coba lagi' }}
        </button>
        <p v-else class="mt-5 text-xs font-medium text-primary-soft">
          Menghubungkan ke server...
        </p>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.warmup-fade-enter-active,
.warmup-fade-leave-active {
  transition: opacity 180ms ease;
}

.warmup-fade-enter-from,
.warmup-fade-leave-to {
  opacity: 0;
}
</style>
