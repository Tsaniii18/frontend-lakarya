<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import { authState, getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type ApprovalStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
type RequestStatus = ApprovalStatus | 'DIBATALKAN';
type ExpenseType = 'TRANSPORTASI' | 'KONSUMSI' | 'OPERASIONAL' | 'LAINNYA';
interface ManagedReimbursement {
  id: number;
  status: RequestStatus;
  createdAt: string;
  completedAt: string | null;
  requester: { id: number; name: string; employeeNumber: string; department: { name: string } };
  reimbursementRequest: { expenseType: ExpenseType; expenseDate: string; expenseAmount: number | string; description: string };
  attachments: Array<{ id: number; fileName: string; sizeByte: number }>;
  approvals: Array<{ id: number; status: ApprovalStatus; reviewNote: string | null; reviewedAt: string | null; approver: { id: number; name: string; department: { name: string } } }>;
}

const route = useRoute();
const request = ref<ManagedReimbursement | null>(null);
const reviewNote = ref('');
const loading = ref(false);
const processing = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const activeApproval = computed(() => request.value?.approvals.find((item) => item.approver.id === authState.user?.id) ?? null);
const canProcess = computed(() => request.value?.status === 'MENUNGGU' && activeApproval.value?.status === 'MENUNGGU');

function statusLabel(value: RequestStatus) { return { MENUNGGU: 'Menunggu', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', DIBATALKAN: 'Dibatalkan' }[value]; }
function statusClass(value: RequestStatus) { return value === 'MENUNGGU' ? 'status-warning' : value === 'DISETUJUI' ? 'status-success' : 'status-danger'; }
function expenseLabel(value: ExpenseType) { return { TRANSPORTASI: 'Transportasi', KONSUMSI: 'Konsumsi', OPERASIONAL: 'Operasional', LAINNYA: 'Lainnya' }[value]; }
function formatDate(value: string) { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function formatCurrency(value: number | string) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(Number(value)); }
function formatFileSize(size: number) { return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`; }

async function loadDetail() {
  loading.value = true;
  errorMessage.value = '';
  try { const { data } = await api.get<ManagedReimbursement>(`/manage/reimbursements/${route.params.id}`, { headers: getAuthHeaders() }); request.value = data; reviewNote.value = activeApproval.value?.reviewNote ?? ''; }
  catch (error) { errorMessage.value = getApiErrorMessage(error); }
  finally { loading.value = false; }
}

async function processApproval(action: 'approve' | 'reject') {
  if (!activeApproval.value) return;
  processing.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try { const { data } = await api.patch<{ message: string }>(`/approvals/${activeApproval.value.id}/${action}`, { reviewNote: reviewNote.value }, { headers: getAuthHeaders() }); successMessage.value = data.message; await loadDetail(); }
  catch (error) { errorMessage.value = getApiErrorMessage(error); }
  finally { processing.value = false; }
}

async function previewAttachment(attachmentId: number) {
  if (!request.value) return;
  try { const { data } = await api.get<Blob>(`/requests/${request.value.id}/attachments/${attachmentId}`, { headers: getAuthHeaders(), responseType: 'blob' }); const url = URL.createObjectURL(data); const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
  catch (error) { errorMessage.value = getApiErrorMessage(error); }
}

onMounted(loadDetail);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6"><RouterLink class="text-sm font-semibold text-primary-soft hover:text-primary" to="/kelola-reimbursement">← Kembali ke Kelola Reimbursement</RouterLink><div class="mt-4 flex flex-wrap items-start justify-between gap-4"><div><h1 class="text-2xl font-semibold text-primary">Detail Reimbursement</h1><p v-if="request" class="mt-2 text-sm text-text-muted">REQ-{{ request.id }}</p></div><span v-if="request" :class="statusClass(request.status)">{{ statusLabel(request.status) }}</span></div></header>
      <div v-if="errorMessage" class="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div><div v-if="successMessage" class="mt-5 rounded-lg bg-[#e7f2ef] px-4 py-3 text-sm text-success" role="status">{{ successMessage }}</div><p v-if="loading" class="mt-7 text-sm text-text-muted">Memuat detail reimbursement...</p>
      <div v-else-if="request" class="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div class="space-y-5">
          <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 class="text-lg font-semibold text-primary">Informasi Pengajuan</h2><dl class="mt-5 grid overflow-hidden rounded-xl border border-border bg-surface-soft sm:grid-cols-3"><div class="p-4 sm:border-r sm:border-border"><dt class="text-xs uppercase tracking-wide text-text-muted">Pemohon</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ request.requester.name }}</dd><dd class="mt-1 text-xs text-text-muted">{{ request.requester.employeeNumber }} · {{ request.requester.department.name }}</dd></div><div class="border-t border-border p-4 sm:border-r sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Tipe / Tanggal</dt><dd class="mt-2 text-sm font-medium text-text">{{ expenseLabel(request.reimbursementRequest.expenseType) }}</dd><dd class="mt-1 text-xs text-text-muted">{{ formatDate(request.reimbursementRequest.expenseDate) }}</dd></div><div class="border-t border-border p-4 sm:border-t-0"><dt class="text-xs uppercase tracking-wide text-text-muted">Nominal</dt><dd class="mt-2 text-sm font-semibold text-primary">{{ formatCurrency(request.reimbursementRequest.expenseAmount) }}</dd></div></dl><div class="mt-5"><p class="text-xs uppercase tracking-wide text-text-muted">Deskripsi</p><p class="mt-2 whitespace-pre-wrap rounded-xl bg-surface-soft px-4 py-3.5 text-sm leading-6 text-text">{{ request.reimbursementRequest.description }}</p></div><div class="mt-6 border-t border-border pt-6"><h3 class="text-sm font-semibold text-primary">Bukti Biaya</h3><p v-if="!request.attachments.length" class="mt-3 text-sm text-text-muted">Tidak ada bukti yang diunggah.</p><div v-else class="mt-3 divide-y divide-border rounded-xl border border-border"><div v-for="file in request.attachments" :key="file.id" class="flex items-center justify-between gap-3 px-4 py-3"><div><p class="text-sm font-medium text-text">{{ file.fileName }}</p><p class="mt-1 text-xs text-text-muted">{{ formatFileSize(file.sizeByte) }}</p></div><button class="rounded-lg border border-primary-soft px-3 py-2 text-xs font-semibold text-primary-soft" type="button" @click="previewAttachment(file.id)">Lihat</button></div></div></div></section>
          <section v-if="canProcess" class="rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 class="text-lg font-semibold text-primary">Keputusan</h2><label class="mt-5 block"><span class="form-label">Catatan review</span><textarea v-model="reviewNote" class="form-input min-h-28 resize-y" placeholder="Tambahkan catatan (opsional)"></textarea></label><div class="mt-5 flex justify-end gap-3"><button class="rounded-lg border border-danger px-4 py-2.5 text-sm font-semibold text-danger" type="button" :disabled="processing" @click="processApproval('reject')">Tolak</button><button class="primary-button" type="button" :disabled="processing" @click="processApproval('approve')">Setujui</button></div></section>
        </div>
        <aside class="h-fit rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 class="text-base font-semibold text-primary">Proses Persetujuan</h2><p v-if="!request.approvals.length" class="mt-4 text-sm text-text-muted">Reimbursement Finance Manager sendiri disetujui otomatis tanpa self-approval.</p><template v-else><div v-for="step in request.approvals" :key="step.id" class="mt-5 flex gap-3"><span class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-white" :class="step.status === 'DISETUJUI' ? 'bg-success' : step.status === 'DITOLAK' ? 'bg-danger' : 'bg-warning'">{{ step.status === 'DISETUJUI' ? '✓' : step.status === 'DITOLAK' ? '×' : '○' }}</span><div><p class="text-sm font-semibold text-primary">Finance Manager</p><p class="mt-1 text-xs text-text-muted">{{ statusLabel(step.status) }}<span v-if="step.reviewedAt"> · {{ formatDateTime(step.reviewedAt) }}</span></p><p v-if="step.reviewNote" class="mt-2 text-xs text-text-muted">“{{ step.reviewNote }}”</p></div></div></template></aside>
      </div>
    </main>
  </div>
</template>
