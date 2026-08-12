<script setup lang="ts">
import axios from 'axios';
import { computed, ref } from 'vue';
import { getApiErrorMessage, getAuthHeaders } from '../auth/auth';
import api from '../lib/api';

const props = withDefaults(defineProps<{
  endpoint: string;
  title: string;
  description: string;
  filenamePrefix: string;
  buttonLabel?: string;
  processedOnly?: boolean;
}>(), {
  buttonLabel: 'Export Laporan',
});

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const now = new Date();
const open = ref(false);
const month = ref(now.getMonth() + 1);
const year = ref(now.getFullYear());
const format = ref<'pdf' | 'csv'>('pdf');
const exporting = ref(false);
const errorMessage = ref('');
const periodLabel = computed(() => `${monthNames[month.value - 1]} ${year.value}`);

function close() {
  if (exporting.value) return;
  open.value = false;
  errorMessage.value = '';
}

function filenameFromHeader(contentDisposition?: string) {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
}

async function exportReport() {
  exporting.value = true;
  errorMessage.value = '';

  try {
    const response = await api.get<Blob>(props.endpoint, {
      headers: getAuthHeaders(),
      params: { month: month.value, year: year.value, format: format.value },
      responseType: 'blob',
    });
    const filename = filenameFromHeader(response.headers['content-disposition'])
      ?? `${props.filenamePrefix}-${year.value}-${String(month.value).padStart(2, '0')}.${format.value}`;
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    open.value = false;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        const payload = JSON.parse(await error.response.data.text()) as { message?: string | string[] };
        errorMessage.value = Array.isArray(payload.message) ? payload.message[0] : payload.message ?? getApiErrorMessage(error);
      } catch {
        errorMessage.value = getApiErrorMessage(error);
      }
    } else {
      errorMessage.value = getApiErrorMessage(error);
    }
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <button class="secondary-button gap-2" type="button" @click="open = true">
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
      <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14" />
    </svg>
    {{ buttonLabel }}
  </button>

  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-primary/45 px-5 py-8"
      role="presentation"
      @click.self="close"
    >
      <section
        class="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_70px_rgba(15,39,71,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-export-title"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-primary-soft">Laporan Bulanan</p>
            <h2 id="report-export-title" class="mt-1 text-lg font-semibold text-primary">{{ title }}</h2>
            <p class="mt-2 text-sm leading-6 text-text-muted">{{ description }}</p>
          </div>
          <button class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl text-text-muted hover:bg-surface-soft hover:text-primary" type="button" aria-label="Tutup dialog" :disabled="exporting" @click="close">×</button>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <label>
            <span class="form-label">Bulan</span>
            <select v-model.number="month" class="form-input">
              <option v-for="(name, index) in monthNames" :key="name" :value="index + 1">{{ name }}</option>
            </select>
          </label>
          <label>
            <span class="form-label">Tahun</span>
            <input v-model.number="year" class="form-input" type="number" min="2000" max="2100" inputmode="numeric" />
          </label>
        </div>

        <fieldset class="mt-5">
          <legend class="form-label">Format file</legend>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition" :class="format === 'pdf' ? 'border-primary-soft bg-[#e9f0f7]' : 'border-border hover:border-border-strong'">
              <input v-model="format" class="mt-1 accent-primary" type="radio" value="pdf" />
              <span><span class="block text-sm font-semibold text-primary">PDF</span><span class="mt-1 block text-xs leading-5 text-text-muted">Siap dibaca dan dicetak sebagai laporan.</span></span>
            </label>
            <label class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition" :class="format === 'csv' ? 'border-primary-soft bg-[#e9f0f7]' : 'border-border hover:border-border-strong'">
              <input v-model="format" class="mt-1 accent-primary" type="radio" value="csv" />
              <span><span class="block text-sm font-semibold text-primary">CSV</span><span class="mt-1 block text-xs leading-5 text-text-muted">Mudah diolah kembali di spreadsheet.</span></span>
            </label>
          </div>
        </fieldset>

        <div class="mt-5 rounded-xl bg-surface-soft px-4 py-3 text-sm text-text-muted">
          Laporan akan memuat data periode <strong class="font-semibold text-primary">{{ periodLabel }}</strong> beserta ringkasan statusnya.
        </div>
        <div v-if="processedOnly" class="mt-3 flex items-start gap-3 rounded-xl border border-[#ead9bb] bg-[#fff8ea] px-4 py-3 text-sm leading-6 text-[#80571f]" role="note">
          <svg class="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16h.01" /></svg>
          <p><strong class="font-semibold">Pastikan seluruh data sudah diperiksa.</strong> Hanya pengajuan yang sudah diputuskan manager yang masuk ke laporan. Pengajuan berstatus Menunggu atau Dibatalkan tidak akan disertakan.</p>
        </div>
        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>

        <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button class="secondary-button" type="button" :disabled="exporting" @click="close">Batal</button>
          <button class="primary-button gap-2" type="button" :disabled="exporting || year < 2000 || year > 2100" @click="exportReport">
            <svg v-if="!exporting" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14" /></svg>
            {{ exporting ? 'Menyiapkan laporan...' : `Unduh ${format.toUpperCase()}` }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
