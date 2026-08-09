<script setup lang="ts">
import { ref } from 'vue';
import AppLogo from '../components/AppLogo.vue';

const previews = [
  { kind: 'dashboard', eyebrow: 'Dashboard Karyawan', title: 'Selamat datang, Tsani' },
  { kind: 'complaints', eyebrow: 'Keluhan Saya', title: 'Daftar keluhan yang diajukan' },
  { kind: 'complaint', eyebrow: 'Keluhan Karyawan', title: 'Pantau penanganan keluhan' },
];

const previewIndex = ref(0);
let touchStartX = 0;

function showPreviousPreview() {
  previewIndex.value =
    (previewIndex.value - 1 + previews.length) % previews.length;
}

function showNextPreview() {
  previewIndex.value = (previewIndex.value + 1) % previews.length;
}

function handleTouchStart(event: TouchEvent) {
  touchStartX = event.touches[0].clientX;
}

function handleTouchEnd(event: TouchEvent) {
  const distance = event.changedTouches[0].clientX - touchStartX;

  if (Math.abs(distance) < 45) return;

  if (distance < 0) {
    showNextPreview();
  } else {
    showPreviousPreview();
  }
}

const services = [
  {
    icon: 'calendar',
    title: 'Cuti',
    description: 'Ajukan dan pantau cuti tahunan maupun khusus.',
  },
  {
    icon: 'clock',
    title: 'Izin',
    description: 'Catat kebutuhan izin harian atau per jam.',
  },
  {
    icon: 'receipt',
    title: 'Reimbursement',
    description: 'Kelola penggantian biaya dengan bukti yang jelas.',
  },
  {
    icon: 'message',
    title: 'Keluhan',
    description: 'Sampaikan keluhan dan ikuti status penanganannya.',
  },
];
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-text">
    <header class="border-b border-border/80">
      <nav class="page-shell flex h-16 items-center sm:h-20" aria-label="Navigasi utama">
        <div class="origin-left scale-[1.05] sm:scale-[1.08]">
          <AppLogo />
        </div>
      </nav>
    </header>

    <main class="flex flex-1 flex-col">
      <section class="page-shell relative grid gap-10 py-10 sm:py-14 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-12 lg:py-10">
        <div>
          <h1 class="max-w-2xl text-3xl font-semibold leading-[1.12] tracking-[-0.035em] text-primary sm:text-5xl sm:leading-[1.08] lg:text-6xl">
            Kelola kebutuhan kerja tanpa proses yang berbelit.
          </h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-text-muted sm:mt-6 sm:text-lg">
            Cuti, izin, reimbursement, dan keluhan hadir dalam satu portal internal dengan proses pengajuan yang mudah dipahami.
          </p>
          <div class="mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
            <RouterLink class="primary-button w-full sm:w-auto" to="/masuk">Masuk ke LaKarya</RouterLink>
            <RouterLink class="secondary-button w-full sm:w-auto" to="/daftar">Buat akun</RouterLink>
          </div>
        </div>

        <div class="relative pb-16 lg:pl-5">
          <div class="absolute -right-4 -top-5 hidden h-36 w-36 rounded-full border border-primary-soft/15 sm:block" aria-hidden="true"></div>
          <div class="relative mr-4">
            <div class="absolute inset-0 z-0 translate-x-4 translate-y-4 rounded-[20px] border border-border-strong bg-[#dfe7f0] shadow-sm" aria-hidden="true"></div>
            <div class="absolute inset-0 z-[1] translate-x-2 translate-y-2 rounded-[20px] border border-border bg-[#f1f4f7] shadow-sm" aria-hidden="true"></div>

            <Transition name="card-slide" mode="out-in">
              <section
                :key="previews[previewIndex].kind"
                class="relative z-10 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_50px_rgba(15,39,71,0.12)] sm:rounded-[20px] sm:shadow-[0_28px_70px_rgba(15,39,71,0.14)]"
                style="touch-action: pan-y"
                aria-live="polite"
                @touchstart.passive="handleTouchStart"
                @touchend.passive="handleTouchEnd"
              >
              <div class="grid grid-cols-[56px_minmax(0,1fr)] sm:min-h-[400px] sm:grid-cols-[118px_1fr]">
                <div class="bg-primary px-2 py-4 text-white sm:px-5 sm:py-5">
                  <AppLogo mode="compact" />
                  <div class="mt-7 space-y-3 sm:mt-9" aria-hidden="true">
                    <span class="block h-2.5 rounded-full bg-white/80"></span>
                    <span class="block h-2.5 rounded-full bg-white/25"></span>
                    <span class="block h-2.5 rounded-full bg-white/25"></span>
                    <span class="block h-2.5 rounded-full bg-white/25"></span>
                  </div>
                </div>

                <div class="min-w-0 bg-surface-soft p-4 sm:p-7">
                  <p class="text-xs font-medium text-primary-soft">{{ previews[previewIndex].eyebrow }}</p>
                  <h2 class="mt-1 text-base font-semibold text-primary sm:text-xl">{{ previews[previewIndex].title }}</h2>

                  <template v-if="previews[previewIndex].kind === 'dashboard'">
                    <div class="mt-5 rounded-xl border border-border bg-white p-4 sm:mt-6 sm:rounded-2xl sm:p-5">
                      <p class="text-xs font-medium text-text-muted">Sisa Cuti Tahunan</p>
                      <div class="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                        <p class="text-2xl font-semibold text-primary sm:text-3xl">10 <span class="text-sm font-medium text-text-muted">hari</span></p>
                        <span class="status-info">Tahun 2026</span>
                      </div>
                    </div>

                    <div class="mt-4 rounded-xl border border-border bg-white p-4 sm:mt-5 sm:rounded-2xl sm:p-5">
                      <div class="flex items-center justify-between gap-3">
                        <h3 class="text-sm font-semibold text-primary">Pengajuan Terbaru</h3>
                        <span class="h-2.5 w-2.5 rounded-full bg-warning" aria-label="Ada pengajuan menunggu"></span>
                      </div>
                      <div class="mt-4 divide-y divide-border">
                        <div class="flex items-center justify-between gap-3 py-3 first:pt-0">
                          <div>
                            <p class="text-sm font-medium text-text">Cuti Tahunan</p>
                            <p class="mt-1 text-xs text-text-muted">12 Agustus 2026</p>
                          </div>
                          <span class="status-warning">Menunggu</span>
                        </div>
                        <div class="flex items-center justify-between gap-3 py-3 last:pb-0">
                          <div>
                            <p class="text-sm font-medium text-text">Reimbursement</p>
                            <p class="mt-1 text-xs text-text-muted">9 Agustus 2026</p>
                          </div>
                          <span class="status-success">Disetujui</span>
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="previews[previewIndex].kind === 'complaints'">
                    <div class="mt-5 rounded-xl border border-border bg-white p-4 sm:mt-6 sm:rounded-2xl sm:p-5">
                      <div class="flex items-center justify-between gap-3">
                        <div>
                          <p class="text-xs font-medium text-text-muted">Total keluhan</p>
                          <p class="mt-1 text-2xl font-semibold text-primary sm:text-3xl">2</p>
                        </div>
                        <span class="status-info">1 diproses</span>
                      </div>
                    </div>

                    <div class="mt-4 rounded-xl border border-border bg-white p-4 sm:mt-5 sm:rounded-2xl sm:p-5">
                      <h3 class="text-sm font-semibold text-primary">Keluhan Diajukan</h3>
                      <div class="mt-4 divide-y divide-border">
                        <div class="flex items-center justify-between gap-3 py-3 first:pt-0">
                          <div class="min-w-0">
                            <p class="truncate text-sm font-medium text-text">Pendingin ruangan tidak berfungsi</p>
                            <p class="mt-1 text-xs text-text-muted">Fasilitas · 9 Agustus 2026</p>
                          </div>
                          <span class="status-info shrink-0">Diproses</span>
                        </div>
                        <div class="flex items-center justify-between gap-3 py-3 last:pb-0">
                          <div class="min-w-0">
                            <p class="truncate text-sm font-medium text-text">Kursi kerja rusak</p>
                            <p class="mt-1 text-xs text-text-muted">Fasilitas · 5 Agustus 2026</p>
                          </div>
                          <span class="status-success shrink-0">Selesai</span>
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <div class="mt-5 rounded-xl border border-border bg-white p-4 sm:mt-6 sm:rounded-2xl sm:p-5">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="text-xs font-medium text-text-muted">Fasilitas</p>
                          <h3 class="mt-1 text-sm font-semibold text-primary">Pendingin ruangan tidak berfungsi</h3>
                        </div>
                        <span class="status-info">Diproses</span>
                      </div>
                      <p class="mt-4 text-xs leading-5 text-text-muted">Keluhan sedang ditangani oleh tim Human Resources.</p>
                    </div>

                    <div class="mt-4 rounded-xl border border-border bg-white p-4 sm:mt-5 sm:rounded-2xl sm:p-5">
                      <h3 class="text-sm font-semibold text-primary">Perkembangan</h3>
                      <div class="mt-4 space-y-3">
                        <div class="flex items-center gap-3 text-xs text-text-muted">
                          <span class="h-2.5 w-2.5 rounded-full bg-success"></span>
                          <span>Keluhan diterima</span>
                        </div>
                        <div class="flex items-center gap-3 text-xs font-medium text-primary-soft">
                          <span class="h-2.5 w-2.5 rounded-full bg-primary-soft"></span>
                          <span>Dalam penanganan</span>
                        </div>
                        <div class="flex items-center gap-3 text-xs text-text-muted">
                          <span class="h-2.5 w-2.5 rounded-full bg-border-strong"></span>
                          <span>Menunggu penyelesaian</span>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              </section>
            </Transition>
          </div>

          <div class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4">
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-white text-primary transition-colors hover:border-primary-soft hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
              type="button"
              aria-label="Preview sebelumnya"
              @click="showPreviousPreview"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <div class="flex gap-2" aria-label="Pilihan preview">
              <button
                v-for="(_, index) in previews"
                :key="index"
                class="h-2.5 rounded-full transition-all"
                :class="index === previewIndex ? 'w-7 bg-primary' : 'w-2.5 bg-border-strong hover:bg-primary-soft'"
                type="button"
                :aria-label="`Tampilkan preview ${index + 1}`"
                :aria-current="index === previewIndex ? 'true' : undefined"
                @click="previewIndex = index"
              ></button>
            </div>

            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-white text-primary transition-colors hover:border-primary-soft hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
              type="button"
              aria-label="Preview berikutnya"
              @click="showNextPreview"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <a
          class="absolute bottom-10 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-xs font-medium tracking-wide text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft lg:flex"
          href="#layanan"
        >
          <span>Scroll down</span>
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </a>
      </section>

      <section id="layanan" class="mt-auto scroll-mt-4 border-y border-border bg-surface/75">
        <div class="page-shell grid gap-px py-8 sm:grid-cols-2 sm:py-10 lg:grid-cols-4">
          <article
            v-for="service in services"
            :key="service.title"
            class="group flex items-start gap-4 border-b border-border p-5 transition-colors duration-200 last:border-b-0 hover:bg-surface sm:block sm:border-r sm:p-6 lg:border-b-0 lg:last:border-r-0"
          >
            <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <svg
                v-if="service.icon === 'calendar'"
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M7 3v3M17 3v3M4 9h16" />
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="m9 14 2 2 4-4" />
              </svg>
              <svg
                v-else-if="service.icon === 'clock'"
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </svg>
              <svg
                v-else-if="service.icon === 'receipt'"
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2v-17Z" />
                <path d="M9 8h6M9 12h6M9 16h3" />
              </svg>
              <svg
                v-else
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M5 18.5 3.5 21l4-1.2a9 9 0 1 0-2.5-1.3Z" />
                <path d="M12 8v4M12 15.5h.01" />
              </svg>
            </span>
            <div class="min-w-0 sm:mt-5">
              <h2 class="text-base font-semibold text-primary">{{ service.title }}</h2>
              <p class="mt-1 text-sm leading-6 text-text-muted sm:mt-2">{{ service.description }}</p>
            </div>
          </article>
        </div>
      </section>
    </main>

    <footer class="bg-primary text-brand-light">
      <div class="page-shell flex flex-col items-center gap-1 py-7 text-center text-sm sm:flex-row sm:justify-between sm:py-8 sm:text-left">
        <p>© 2026 LaKarya</p>
        <p>Portal layanan internal karyawan.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.card-slide-enter-active,
.card-slide-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.card-slide-enter-from {
  opacity: 0;
  transform: translateX(28px) rotate(1deg);
}

.card-slide-leave-to {
  opacity: 0;
  transform: translateX(-28px) rotate(-1deg);
}

@media (prefers-reduced-motion: reduce) {
  .card-slide-enter-active,
  .card-slide-leave-active {
    transition: none;
  }
}
</style>
