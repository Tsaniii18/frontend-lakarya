<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import ConfirmationModal from '../../components/ConfirmationModal.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type RequestStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'DIBATALKAN';

interface PermissionRequestDetail {
  id: number;
  status: RequestStatus;
  createdAt: string;
  completedAt: string | null;
  permissionRequest: {
    permissionType: 'HARIAN' | 'JAM';
    startDate: string;
    endDate: string;
    totalDays: number;
    startTime: string | null;
    endTime: string | null;
    reason: string;
  };
  attachments: Array<{
    id: number;
    fileUrl: string;
    fileName: string;
    mimeType: string;
    sizeByte: number;
  }>;
}

const route = useRoute();
const request = ref<PermissionRequestDetail | null>(null);
const loading = ref(false);
const canceling = ref(false);
const confirmOpen = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

function statusLabel(value: RequestStatus) {
  return {
    MENUNGGU: 'Menunggu',
    DISETUJUI: 'Disetujui',
    DITOLAK: 'Ditolak',
    DIBATALKAN: 'Dibatalkan',
  }[value];
}

function statusClass(value: RequestStatus) {
  if (value === 'MENUNGGU') return 'status-warning';
  if (value === 'DISETUJUI') return 'status-success';
  return 'status-danger';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatFileSize(size: number) {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(size / 1024)} KB`;
}

function fileTypeLabel(mimeType: string) {
  if (mimeType === 'application/pdf') return 'PDF';
  return 'Gambar';
}

async function previewAttachment(attachmentId: number) {
  if (!request.value) return;
  errorMessage.value = '';

  try {
    const { data } = await api.get<Blob>(
      `/requests/${request.value.id}/attachments/${attachmentId}`,
      {
        headers: getAuthHeaders(),
        responseType: 'blob',
      },
    );
    const objectUrl = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  }
}

async function loadDetail() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const { data } = await api.get<PermissionRequestDetail>(`/permission/${route.params.id}`, {
      headers: getAuthHeaders(),
    });
    request.value = data;
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function cancelRequest() {
  if (!request.value) return;
  canceling.value = true;
  errorMessage.value = '';

  try {
    const { data } = await api.patch<{ request: PermissionRequestDetail }>(
      `/permission/${request.value.id}/cancel`,
      {},
      { headers: getAuthHeaders() },
    );
    request.value = data.request;
    successMessage.value = 'Pengajuan izin berhasil dibatalkan.';
    confirmOpen.value = false;
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    canceling.value = false;
  }
}

onMounted(loadDetail);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />

    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6">
        <RouterLink class="text-sm font-semibold text-primary-soft hover:text-primary" to="/pengajuan">← Kembali ke Pengajuan</RouterLink>
        <div class="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-primary">Detail Pengajuan</h1>
            <p v-if="request" class="mt-2 text-sm text-text-muted">Izin {{ request.permissionRequest.permissionType === 'HARIAN' ? 'Harian' : 'Per Jam' }} · REQ-{{ request.id }}</p>
          </div>
          <span v-if="request" :class="statusClass(request.status)">{{ statusLabel(request.status) }}</span>
        </div>
      </header>

      <div v-if="errorMessage" class="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
      <div v-if="successMessage" class="mt-5 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success" role="status">{{ successMessage }}</div>
      <p v-if="loading" class="mt-7 text-sm text-text-muted">Memuat detail pengajuan...</p>

      <div v-else-if="request" class="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div class="flex items-center gap-3 border-b border-border pb-5">
            <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9f0f7] text-primary-soft">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </svg>
            </span>
            <div><h2 class="text-lg font-semibold text-primary">Informasi Izin</h2><p class="mt-1 text-sm text-text-muted">Rincian waktu dan alasan pengajuan.</p></div>
          </div>

          <dl v-if="request.permissionRequest.permissionType === 'HARIAN'" class="mt-5 grid overflow-hidden rounded-xl border border-border bg-surface-soft sm:grid-cols-3">
            <div class="p-4 sm:border-r sm:border-border"><dt class="text-xs font-medium uppercase tracking-wide text-text-muted">Tanggal Mulai</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ formatDate(request.permissionRequest.startDate) }}</dd></div>
            <div class="border-t border-border p-4 sm:border-r sm:border-t-0"><dt class="text-xs font-medium uppercase tracking-wide text-text-muted">Tanggal Selesai</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ formatDate(request.permissionRequest.endDate) }}</dd></div>
            <div class="border-t border-border p-4 sm:border-t-0"><dt class="text-xs font-medium uppercase tracking-wide text-text-muted">Durasi</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ request.permissionRequest.totalDays }} hari</dd></div>
          </dl>
          <dl v-else class="mt-5 grid overflow-hidden rounded-xl border border-border bg-surface-soft sm:grid-cols-3">
            <div class="p-4 sm:border-r sm:border-border"><dt class="text-xs font-medium uppercase tracking-wide text-text-muted">Tanggal</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ formatDate(request.permissionRequest.startDate) }}</dd></div>
            <div class="border-t border-border p-4 sm:border-r sm:border-t-0"><dt class="text-xs font-medium uppercase tracking-wide text-text-muted">Waktu Mulai</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ formatTime(request.permissionRequest.startTime) }}</dd></div>
            <div class="border-t border-border p-4 sm:border-t-0"><dt class="text-xs font-medium uppercase tracking-wide text-text-muted">Waktu Selesai</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ formatTime(request.permissionRequest.endTime) }}</dd></div>
          </dl>

          <div class="mt-6"><p class="text-xs font-medium uppercase tracking-wide text-text-muted">Alasan Pengajuan</p><p class="mt-2 rounded-xl bg-surface-soft px-4 py-3.5 whitespace-pre-wrap text-sm leading-6 text-text">{{ request.permissionRequest.reason }}</p></div>

          <div class="mt-6 border-t border-border pt-6">
            <h3 class="text-sm font-semibold text-primary">Lampiran</h3>
            <p v-if="request.attachments.length === 0" class="mt-3 text-sm text-text-muted">Tidak ada lampiran.</p>
            <div v-else class="mt-3 divide-y divide-border rounded-xl border border-border">
              <div v-for="attachment in request.attachments" :key="attachment.id" class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div class="min-w-0"><p class="truncate text-sm font-medium text-text">{{ attachment.fileName }}</p><p class="mt-1 text-xs text-text-muted">{{ fileTypeLabel(attachment.mimeType) }} · {{ formatFileSize(attachment.sizeByte) }}</p></div>
                <button class="rounded-lg border border-primary-soft px-3 py-2 text-xs font-semibold text-primary-soft hover:bg-[#e9f0f7]" type="button" @click="previewAttachment(attachment.id)">Lihat</button>
              </div>
            </div>
          </div>
        </section>

        <aside class="h-fit rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 class="text-base font-semibold text-primary">Ringkasan</h2>
          <dl class="mt-5 space-y-4">
            <div class="flex items-center justify-between gap-4"><dt class="text-sm text-text-muted">Status</dt><dd><span :class="statusClass(request.status)">{{ statusLabel(request.status) }}</span></dd></div>
            <div class="flex items-start justify-between gap-4 border-t border-border pt-4"><dt class="text-sm text-text-muted">Tipe izin</dt><dd class="text-right text-sm font-medium text-text">{{ request.permissionRequest.permissionType === 'HARIAN' ? 'Harian' : 'Per Jam' }}</dd></div>
            <div class="flex items-start justify-between gap-4 border-t border-border pt-4"><dt class="text-sm text-text-muted">Diajukan</dt><dd class="text-right text-sm font-medium text-text">{{ formatDate(request.createdAt) }}</dd></div>
            <div class="flex items-start justify-between gap-4 border-t border-border pt-4"><dt class="text-sm text-text-muted">Nomor</dt><dd class="text-right text-sm font-medium text-text">REQ-{{ request.id }}</dd></div>
          </dl>
          <div v-if="request.status === 'MENUNGGU'" class="mt-6 border-t border-border pt-5"><button class="w-full rounded-lg border border-danger px-3 py-2 text-xs font-semibold text-danger hover:bg-red-50" type="button" @click="confirmOpen = true">Batalkan Pengajuan</button></div>
        </aside>
      </div>
    </main>

    <ConfirmationModal
      :open="confirmOpen"
      title="Batalkan pengajuan izin?"
      message="Status pengajuan akan menjadi Dibatalkan dan tidak dapat diproses kembali."
      confirm-label="Batalkan Pengajuan"
      danger
      :loading="canceling"
      @close="confirmOpen = false"
      @confirm="cancelRequest"
    />
  </div>
</template>
