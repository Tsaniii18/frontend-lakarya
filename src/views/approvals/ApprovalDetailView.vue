<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type ApprovalStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
type RequestStatus = ApprovalStatus | 'DIBATALKAN';

interface ApprovalStep {
  id: number;
  stepOrder: number;
  status: ApprovalStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  approver: { name: string; role: { name: string }; department: { name: string } };
}

interface ApprovalDetail {
  id: number;
  status: ApprovalStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  canProcess: boolean;
  request: {
    id: number;
    type: 'CUTI' | 'IZIN';
    status: RequestStatus;
    createdAt: string;
    requester: { name: string; employeeNumber: string; department: { name: string } };
    leaveRequest: { leaveType: 'TAHUNAN' | 'KHUSUS'; startDate: string; endDate: string; reason: string } | null;
    permissionRequest: { permissionType: 'HARIAN' | 'JAM'; startDate: string; endDate: string; totalDays: number | string; startTime: string | null; endTime: string | null; reason: string } | null;
    attachments: Array<{ id: number; fileName: string; mimeType: string; sizeByte: number }>;
    approvals: ApprovalStep[];
  };
}

const route = useRoute();
const approval = ref<ApprovalDetail | null>(null);
const reviewNote = ref('');
const loading = ref(false);
const processing = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

function statusLabel(value: RequestStatus) {
  return { MENUNGGU: 'Menunggu', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', DIBATALKAN: 'Dibatalkan' }[value];
}

function statusClass(value: RequestStatus) {
  if (value === 'MENUNGGU') return 'status-warning';
  if (value === 'DISETUJUI') return 'status-success';
  return 'status-danger';
}

function requestLabel() {
  if (approval.value?.request.leaveRequest) return approval.value.request.leaveRequest.leaveType === 'TAHUNAN' ? 'Cuti Tahunan' : 'Cuti Khusus';
  return approval.value?.request.permissionRequest?.permissionType === 'HARIAN' ? 'Izin Harian' : 'Izin Per Jam';
}

function reason() {
  return approval.value?.request.leaveRequest?.reason ?? approval.value?.request.permissionRequest?.reason ?? '';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(new Date(value));
}

function formatFileSize(size: number) {
  return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`;
}

async function loadDetail() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get<ApprovalDetail>(`/approvals/${route.params.id}`, { headers: getAuthHeaders() });
    approval.value = data;
    reviewNote.value = data.reviewNote ?? '';
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function processApproval(action: 'approve' | 'reject') {
  if (!approval.value) return;
  processing.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    const { data } = await api.patch<{ message: string; approval: ApprovalDetail }>(
      `/approvals/${approval.value.id}/${action}`,
      { reviewNote: reviewNote.value },
      { headers: getAuthHeaders() },
    );
    approval.value = data.approval;
    successMessage.value = data.message;
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    processing.value = false;
  }
}

async function previewAttachment(attachmentId: number) {
  if (!approval.value) return;
  errorMessage.value = '';
  try {
    const { data } = await api.get<Blob>(`/requests/${approval.value.request.id}/attachments/${attachmentId}`, { headers: getAuthHeaders(), responseType: 'blob' });
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

onMounted(loadDetail);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6">
        <RouterLink class="text-sm font-semibold text-primary-soft hover:text-primary" to="/persetujuan">← Kembali ke Persetujuan</RouterLink>
        <div class="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div><h1 class="text-2xl font-semibold text-primary">Detail Persetujuan</h1><p v-if="approval" class="mt-2 text-sm text-text-muted">{{ requestLabel() }} · REQ-{{ approval.request.id }}</p></div>
          <span v-if="approval" :class="statusClass(approval.request.status)">{{ statusLabel(approval.request.status) }}</span>
        </div>
      </header>

      <div v-if="errorMessage" class="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
      <div v-if="successMessage" class="mt-5 flex items-start justify-between gap-4 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success" role="status">
        <p>{{ successMessage }}</p>
        <button class="shrink-0 text-lg leading-none" type="button" aria-label="Tutup pemberitahuan" @click="successMessage = ''">×</button>
      </div>
      <p v-if="loading" class="mt-7 text-sm text-text-muted">Memuat detail persetujuan...</p>

      <div v-else-if="approval" class="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div class="space-y-5">
          <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div class="border-b border-border pb-5"><h2 class="text-lg font-semibold text-primary">Informasi Pengajuan</h2><p class="mt-1 text-sm text-text-muted">Rincian pemohon dan waktu pengajuan.</p></div>
            <dl class="mt-5 grid overflow-hidden rounded-xl border border-border bg-surface-soft sm:grid-cols-3">
              <div class="p-4 sm:border-r sm:border-border"><dt class="text-xs uppercase tracking-wide text-text-muted">Pemohon</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ approval.request.requester.name }}</dd><dd class="mt-1 text-xs text-text-muted">{{ approval.request.requester.employeeNumber }}</dd></div>
              <div class="border-t border-border p-4 sm:border-r sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Departemen</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ approval.request.requester.department.name }}</dd></div>
              <div class="border-t border-border p-4 sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Diajukan</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ formatDate(approval.request.createdAt) }}</dd></div>
            </dl>

            <dl v-if="approval.request.leaveRequest" class="mt-5 grid overflow-hidden rounded-xl border border-border sm:grid-cols-2">
              <div class="p-4 sm:border-r sm:border-border"><dt class="text-xs uppercase tracking-wide text-text-muted">Tanggal Mulai</dt><dd class="mt-2 text-sm font-medium text-text">{{ formatDate(approval.request.leaveRequest.startDate) }}</dd></div>
              <div class="border-t border-border p-4 sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Tanggal Selesai</dt><dd class="mt-2 text-sm font-medium text-text">{{ formatDate(approval.request.leaveRequest.endDate) }}</dd></div>
            </dl>
            <dl v-else-if="approval.request.permissionRequest?.permissionType === 'HARIAN'" class="mt-5 grid overflow-hidden rounded-xl border border-border sm:grid-cols-3">
              <div class="p-4 sm:border-r sm:border-border"><dt class="text-xs uppercase tracking-wide text-text-muted">Tanggal Mulai</dt><dd class="mt-2 text-sm font-medium text-text">{{ formatDate(approval.request.permissionRequest.startDate) }}</dd></div>
              <div class="border-t border-border p-4 sm:border-r sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Tanggal Selesai</dt><dd class="mt-2 text-sm font-medium text-text">{{ formatDate(approval.request.permissionRequest.endDate) }}</dd></div>
              <div class="border-t border-border p-4 sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Durasi</dt><dd class="mt-2 text-sm font-medium text-text">{{ approval.request.permissionRequest.totalDays }} hari</dd></div>
            </dl>
            <dl v-else-if="approval.request.permissionRequest" class="mt-5 grid overflow-hidden rounded-xl border border-border sm:grid-cols-3">
              <div class="p-4 sm:border-r sm:border-border"><dt class="text-xs uppercase tracking-wide text-text-muted">Tanggal</dt><dd class="mt-2 text-sm font-medium text-text">{{ formatDate(approval.request.permissionRequest.startDate) }}</dd></div>
              <div class="border-t border-border p-4 sm:border-r sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Mulai</dt><dd class="mt-2 text-sm font-medium text-text">{{ formatTime(approval.request.permissionRequest.startTime) }}</dd></div>
              <div class="border-t border-border p-4 sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Selesai</dt><dd class="mt-2 text-sm font-medium text-text">{{ formatTime(approval.request.permissionRequest.endTime) }}</dd></div>
            </dl>

            <div class="mt-5"><p class="text-xs uppercase tracking-wide text-text-muted">Alasan</p><p class="mt-2 whitespace-pre-wrap rounded-xl bg-surface-soft px-4 py-3.5 text-sm leading-6 text-text">{{ reason() }}</p></div>

            <div class="mt-6 border-t border-border pt-6"><h3 class="text-sm font-semibold text-primary">Lampiran</h3><p v-if="approval.request.attachments.length === 0" class="mt-3 text-sm text-text-muted">Tidak ada lampiran.</p><div v-else class="mt-3 divide-y divide-border rounded-xl border border-border"><div v-for="file in approval.request.attachments" :key="file.id" class="flex items-center justify-between gap-3 px-4 py-3"><div class="min-w-0"><p class="truncate text-sm font-medium text-text">{{ file.fileName }}</p><p class="mt-1 text-xs text-text-muted">{{ formatFileSize(file.sizeByte) }}</p></div><button class="rounded-lg border border-primary-soft px-3 py-2 text-xs font-semibold text-primary-soft hover:bg-[#e9f0f7]" type="button" @click="previewAttachment(file.id)">Lihat</button></div></div></div>
          </section>

          <section v-if="approval.canProcess" class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 class="text-lg font-semibold text-primary">Keputusan</h2><p class="mt-1 text-sm text-text-muted">Tambahkan catatan sebelum memproses pengajuan.</p>
            <label class="mt-5 block text-sm font-medium text-text" for="review-note">Catatan review</label><textarea id="review-note" v-model="reviewNote" class="form-input mt-2 min-h-28 resize-y" placeholder="Tambahkan catatan (opsional)"></textarea>
            <div class="mt-5 flex flex-wrap justify-end gap-3"><button class="rounded-lg border border-danger px-4 py-2.5 text-sm font-semibold text-danger hover:bg-red-50 disabled:opacity-50" type="button" :disabled="processing" @click="processApproval('reject')">Tolak</button><button class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-soft disabled:opacity-50" type="button" :disabled="processing" @click="processApproval('approve')">Setujui</button></div>
          </section>
        </div>

        <aside class="h-fit rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 class="text-base font-semibold text-primary">Proses Persetujuan</h2><ol class="mt-5 space-y-0"><li v-for="(step, index) in approval.request.approvals" :key="step.id" class="relative flex gap-3 pb-6 last:pb-0"><span v-if="index < approval.request.approvals.length - 1" class="absolute left-[9px] top-5 h-full w-px bg-border"></span><span class="relative z-10 mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold" :class="step.status === 'DISETUJUI' ? 'border-success bg-success text-white' : step.status === 'DITOLAK' ? 'border-danger bg-danger text-white' : 'border-primary-soft bg-white text-primary-soft'">{{ step.status === 'DISETUJUI' ? '✓' : step.status === 'DITOLAK' ? '×' : '○' }}</span><div><p class="text-sm font-semibold text-primary">{{ step.approver.department.name === 'Human Resources' ? 'HR Manager' : `Manager ${step.approver.department.name}` }}</p><p class="mt-1 text-xs" :class="step.status === 'DISETUJUI' ? 'text-success' : step.status === 'DITOLAK' ? 'text-danger' : 'text-text-muted'">{{ statusLabel(step.status) }}<span v-if="step.reviewedAt"> · {{ formatDateTime(step.reviewedAt) }}</span></p><p v-if="step.reviewNote" class="mt-2 text-xs leading-5 text-text-muted">“{{ step.reviewNote }}”</p></div></li></ol></aside>
      </div>
    </main>
  </div>
</template>
