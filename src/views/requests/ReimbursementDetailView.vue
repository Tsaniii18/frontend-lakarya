<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import ApprovalProcessSummary from '../../components/ApprovalProcessSummary.vue';
import ConfirmationModal from '../../components/ConfirmationModal.vue';
import RequestReviewSection from '../../components/RequestReviewSection.vue';
import { authState, getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type RequestStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'DIBATALKAN';
interface ReimbursementDetail {
  id: number;
  status: RequestStatus;
  createdAt: string;
  completedAt: string | null;
  requester: { id: number; name: string; employeeNumber: string; department: { name: string } };
  reimbursementRequest: { expenseType: 'TRANSPORTASI' | 'KONSUMSI' | 'OPERASIONAL' | 'LAINNYA'; expenseDate: string; expenseAmount: number | string; description: string };
  attachments: Array<{ id: number; fileName: string; mimeType: string; sizeByte: number }>;
  approvals: Array<{ id: number; stepOrder: number; status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK'; reviewNote: string | null; reviewedAt: string | null; approver: { id: number; name: string; department: { name: string } } }>;
}

const route = useRoute();
const request = ref<ReimbursementDetail | null>(null);
const loading = ref(false);
const canceling = ref(false);
const confirmOpen = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isOwner = computed(() => request.value?.requester.id === authState.user?.id);
const detailSource = computed(() => route.query.from);
const backTarget = computed(() => {
  if (detailSource.value === 'kelola-reimbursement') return { path: '/kelola-reimbursement', query: { scope: route.query.scope === 'all' ? 'all' : 'mine' } };
  if (detailSource.value === 'persetujuan') return '/persetujuan';
  return !request.value || isOwner.value ? '/pengajuan' : '/persetujuan';
});
const backLabel = computed(() => {
  if (detailSource.value === 'kelola-reimbursement') return 'Kembali ke Reimbursement Karyawan';
  return (!request.value || isOwner.value) && detailSource.value !== 'persetujuan' ? 'Kembali ke Pengajuan Saya' : 'Kembali ke Pengajuan Tim';
});

function statusLabel(value: RequestStatus) { return { MENUNGGU: 'Menunggu', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', DIBATALKAN: 'Dibatalkan' }[value]; }
function statusClass(value: RequestStatus) { return value === 'MENUNGGU' ? 'status-warning' : value === 'DISETUJUI' ? 'status-success' : 'status-danger'; }
function expenseLabel(value: ReimbursementDetail['reimbursementRequest']['expenseType']) { return { TRANSPORTASI: 'Transportasi', KONSUMSI: 'Konsumsi', OPERASIONAL: 'Operasional', LAINNYA: 'Lainnya' }[value]; }
function formatDate(value: string) { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)); }
function formatCurrency(value: number | string) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(Number(value)); }
function formatFileSize(size: number) { return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`; }

async function loadDetail() {
  loading.value = true;
  errorMessage.value = '';
  try { const { data } = await api.get<ReimbursementDetail>(`/reimbursements/${route.params.id}`, { headers: getAuthHeaders() }); request.value = data; }
  catch (error) { errorMessage.value = getApiErrorMessage(error); }
  finally { loading.value = false; }
}

async function cancelRequest() {
  if (!request.value) return;
  canceling.value = true;
  errorMessage.value = '';
  try { await api.patch(`/reimbursements/${request.value.id}/cancel`, {}, { headers: getAuthHeaders() }); await loadDetail(); successMessage.value = 'Pengajuan penggantian biaya berhasil dibatalkan.'; confirmOpen.value = false; }
  catch (error) { errorMessage.value = getApiErrorMessage(error); }
  finally { canceling.value = false; }
}

async function previewAttachment(attachmentId: number) {
  if (!request.value) return;
  try { const { data } = await api.get<Blob>(`/requests/${request.value.id}/attachments/${attachmentId}`, { headers: getAuthHeaders(), responseType: 'blob' }); const url = URL.createObjectURL(data); const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
  catch (error) { errorMessage.value = getApiErrorMessage(error); }
}

async function handleApprovalProcessed(message: string) {
  successMessage.value = message;
  await loadDetail();
}

onMounted(loadDetail);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6"><RouterLink class="text-sm font-semibold text-primary-soft hover:text-primary" :to="backTarget">← {{ backLabel }}</RouterLink><div class="mt-4 flex flex-wrap items-start justify-between gap-4"><div><h1 class="text-2xl font-semibold text-primary">Detail Reimbursement</h1><p v-if="request" class="mt-2 text-sm text-text-muted">REQ-{{ request.id }}</p></div><span v-if="request" :class="statusClass(request.status)">{{ statusLabel(request.status) }}</span></div></header>
      <div v-if="errorMessage" class="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
      <div v-if="successMessage" class="mt-5 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success" role="status">{{ successMessage }}</div>
      <p v-if="loading" class="mt-7 text-sm text-text-muted">Memuat detail pengajuan...</p>

      <div v-else-if="request" class="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div class="space-y-5">
          <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 class="text-lg font-semibold text-primary">Informasi Biaya</h2>
          <dl v-if="!isOwner" class="mt-5 grid overflow-hidden rounded-xl border border-border bg-surface-soft sm:grid-cols-3"><div class="p-4 sm:border-r sm:border-border"><dt class="text-xs uppercase tracking-wide text-text-muted">Pemohon</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ request.requester.name }}</dd><dd class="mt-1 text-xs text-text-muted">{{ request.requester.employeeNumber }}</dd></div><div class="border-t border-border p-4 sm:border-r sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Departemen</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ request.requester.department.name }}</dd></div><div class="border-t border-border p-4 sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Diajukan</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ formatDate(request.createdAt) }}</dd></div></dl>
          <dl class="mt-5 grid overflow-hidden rounded-xl border border-border bg-surface-soft sm:grid-cols-3"><div class="p-4 sm:border-r sm:border-border"><dt class="text-xs uppercase tracking-wide text-text-muted">Tipe Biaya</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ expenseLabel(request.reimbursementRequest.expenseType) }}</dd></div><div class="border-t border-border p-4 sm:border-r sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Tanggal Biaya</dt><dd class="mt-2 text-sm font-medium text-text">{{ formatDate(request.reimbursementRequest.expenseDate) }}</dd></div><div class="border-t border-border p-4 sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Nominal</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ formatCurrency(request.reimbursementRequest.expenseAmount) }}</dd></div></dl>
          <div class="mt-5"><p class="text-xs uppercase tracking-wide text-text-muted">Deskripsi</p><p class="mt-2 whitespace-pre-wrap rounded-xl bg-surface-soft px-4 py-3.5 text-sm leading-6 text-text">{{ request.reimbursementRequest.description }}</p></div>
          <div class="mt-6 border-t border-border pt-6"><h3 class="text-sm font-semibold text-primary">Bukti Biaya</h3><p v-if="!request.attachments.length" class="mt-3 text-sm text-text-muted">Tidak ada bukti yang diunggah.</p><div v-else class="mt-3 divide-y divide-border rounded-xl border border-border"><div v-for="file in request.attachments" :key="file.id" class="flex items-center justify-between gap-3 px-4 py-3"><div class="min-w-0"><p class="truncate text-sm font-medium text-text">{{ file.fileName }}</p><p class="mt-1 text-xs text-text-muted">{{ formatFileSize(file.sizeByte) }}</p></div><button class="rounded-lg border border-primary-soft px-3 py-2 text-xs font-semibold text-primary-soft" type="button" @click="previewAttachment(file.id)">Lihat</button></div></div></div>
          <div v-if="isOwner && request.status === 'MENUNGGU'" class="mt-7 flex justify-end border-t border-border pt-5"><button class="rounded-lg border border-danger px-4 py-2.5 text-sm font-semibold text-danger hover:bg-red-50" type="button" @click="confirmOpen = true">Batalkan Pengajuan</button></div>
          </section>
          <RequestReviewSection :request-status="request.status" :approvals="request.approvals" @processed="handleApprovalProcessed" />
        </div>
        <aside class="h-fit rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 class="text-base font-semibold text-primary">Ringkasan</h2>
          <dl class="mt-5 space-y-4">
            <div class="flex items-center justify-between gap-4"><dt class="text-sm text-text-muted">Status</dt><dd><span :class="statusClass(request.status)">{{ statusLabel(request.status) }}</span></dd></div>
            <div class="flex items-start justify-between gap-4 border-t border-border pt-4"><dt class="text-sm text-text-muted">Tipe biaya</dt><dd class="text-right text-sm font-medium text-text">{{ expenseLabel(request.reimbursementRequest.expenseType) }}</dd></div>
            <div class="flex items-start justify-between gap-4 border-t border-border pt-4"><dt class="text-sm text-text-muted">Diajukan</dt><dd class="text-right text-sm font-medium text-text">{{ formatDate(request.createdAt) }}</dd></div>
            <div class="flex items-start justify-between gap-4 border-t border-border pt-4"><dt class="text-sm text-text-muted">Nomor</dt><dd class="text-right text-sm font-medium text-text">REQ-{{ request.id }}</dd></div>
          </dl>
          <ApprovalProcessSummary :request-status="request.status" :approvals="request.approvals" />
        </aside>
      </div>
    </main>
    <ConfirmationModal :open="confirmOpen" title="Batalkan pengajuan?" message="Pengajuan yang dibatalkan tidak dapat diproses kembali." confirm-label="Ya, Batalkan" danger :loading="canceling" @close="confirmOpen = false" @confirm="cancelRequest" />
  </div>
</template>
