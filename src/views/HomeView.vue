<script setup lang="ts">
import AppSidebar from '../components/AppSidebar.vue';
import { authState } from '../auth/auth';
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />

    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-medium text-primary-soft">Beranda Karyawan</p>
          <h1 class="mt-1 text-2xl font-semibold text-primary">Selamat datang, {{ authState.user?.name }}</h1>
          <p class="mt-2 text-sm text-text-muted">Ringkasan aktivitas Anda.</p>
        </div>

        <div class="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 sm:max-w-xs">
          <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {{ authState.user?.name?.charAt(0).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-text">{{ authState.user?.name }}</p>
            <p class="mt-0.5 truncate text-xs text-text-muted">{{ authState.user?.employeeNumber }}</p>
          </div>
        </div>
      </header>

      <div class="mt-7 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-text-muted">Sisa Cuti Tahunan</p>
              <p class="mt-3 text-4xl font-semibold tracking-tight text-primary">
                10 <span class="text-base font-medium text-text-muted">hari</span>
              </p>
            </div>
            <span class="status-info">Tahun 2026</span>
          </div>
          <div class="mt-6 h-2 overflow-hidden rounded-full bg-[#e9f0f7]">
            <div class="h-full w-4/5 rounded-full bg-primary-soft"></div>
          </div>
          <div class="mt-3 flex justify-between text-xs text-text-muted">
            <span>Terpakai 2 hari</span>
            <span>Total 12 hari</span>
          </div>
        </section>

        <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-text-muted">Pengajuan Aktif</p>
              <p class="mt-3 text-4xl font-semibold tracking-tight text-primary">1</p>
            </div>
            <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8efdf] text-[#9a6824]">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </svg>
            </span>
          </div>
          <p class="mt-6 text-sm leading-6 text-text-muted">Satu pengajuan sedang menunggu proses persetujuan.</p>
        </section>
      </div>

      <section class="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-primary">Pengajuan Terbaru</h2>
            <p class="mt-1 text-sm text-text-muted">Status pengajuan terakhir Anda.</p>
          </div>
          <span class="h-2.5 w-2.5 rounded-full bg-warning" aria-label="Ada pengajuan menunggu"></span>
        </div>

        <div class="mt-5 divide-y divide-border">
          <div class="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e9f0f7] text-primary-soft">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M7 3v3M17 3v3M4 9h16" />
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-medium text-text">Cuti Tahunan</p>
                <p class="mt-1 text-xs text-text-muted">12–13 Agustus 2026 · 2 hari</p>
              </div>
            </div>
            <span class="status-warning self-start sm:self-auto">Menunggu</span>
          </div>

          <div class="flex flex-col gap-3 py-4 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3">
              <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e7f2ef] text-success">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M5 4h14v16H5z" />
                  <path d="m8.5 12 2.2 2.2 4.8-5" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-medium text-text">Reimbursement Transportasi</p>
                <p class="mt-1 text-xs text-text-muted">9 Agustus 2026</p>
              </div>
            </div>
            <span class="status-success self-start sm:self-auto">Disetujui</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
