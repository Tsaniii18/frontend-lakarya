<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type RequestStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'DIBATALKAN';
type ExpenseType = 'TRANSPORTASI' | 'KONSUMSI' | 'OPERASIONAL' | 'LAINNYA';
interface ReimbursementItem {
  id: number;
  status: RequestStatus;
  createdAt: string;
  requester: { id: number; name: string; department: { name: string } };
  reimbursementRequest: { expenseType: ExpenseType; expenseDate: string; expenseAmount: number | string };
}

const requests = ref<ReimbursementItem[]>([]);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const page = ref(1);
const status = ref('');
const expenseType = ref('');
const order = ref<'asc' | 'desc'>('desc');
const loading = ref(false);
const errorMessage = ref('');

function statusLabel(value: RequestStatus) { return { MENUNGGU: 'Menunggu', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', DIBATALKAN: 'Dibatalkan' }[value]; }
function statusClass(value: RequestStatus) { return value === 'MENUNGGU' ? 'status-warning' : value === 'DISETUJUI' ? 'status-success' : 'status-danger'; }
function expenseLabel(value: ExpenseType) { return { TRANSPORTASI: 'Transportasi', KONSUMSI: 'Konsumsi', OPERASIONAL: 'Operasional', LAINNYA: 'Lainnya' }[value]; }
function formatDate(value: string) { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)); }
function formatCurrency(value: number | string) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(Number(value)); }

async function loadRequests() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/manage/reimbursements', { headers: getAuthHeaders(), params: { page: page.value, limit: 10, status: status.value || undefined, expenseType: expenseType.value || undefined, sort: 'createdAt', order: order.value } });
    requests.value = data.data;
    meta.value = data.meta;
  } catch (error) { errorMessage.value = getApiErrorMessage(error); }
  finally { loading.value = false; }
}

function changePage(nextPage: number) { if (nextPage < 1 || nextPage > meta.value.totalPages) return; page.value = nextPage; void loadRequests(); }
watch([status, expenseType, order], () => { page.value = 1; void loadRequests(); });
onMounted(loadRequests);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6"><p class="text-sm font-medium text-primary-soft">Finance</p><h1 class="mt-1 text-2xl font-semibold text-primary">Kelola Reimbursement</h1><p class="mt-2 text-sm text-text-muted">Tinjau seluruh pengajuan penggantian biaya karyawan.</p></header>
      <section class="data-card">
        <div class="data-card-heading"><div><h2 class="text-base font-semibold text-primary">Daftar Reimbursement</h2><p class="mt-1 text-sm text-text-muted">Filter pengajuan berdasarkan status dan tipe biaya.</p></div><span class="data-count">{{ meta.total }} reimbursement</span></div>
        <div class="mt-5 grid gap-3 sm:grid-cols-3"><label><span class="form-label">Status</span><select v-model="status" class="form-input"><option value="">Semua status</option><option value="MENUNGGU">Menunggu</option><option value="DISETUJUI">Disetujui</option><option value="DITOLAK">Ditolak</option><option value="DIBATALKAN">Dibatalkan</option></select></label><label><span class="form-label">Tipe biaya</span><select v-model="expenseType" class="form-input"><option value="">Semua tipe biaya</option><option value="TRANSPORTASI">Transportasi</option><option value="KONSUMSI">Konsumsi</option><option value="OPERASIONAL">Operasional</option><option value="LAINNYA">Lainnya</option></select></label><label><span class="form-label">Urutan</span><select v-model="order" class="form-input"><option value="desc">Terbaru</option><option value="asc">Terlama</option></select></label></div>
        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
        <div class="data-table-shell"><table class="data-table min-w-[900px]"><thead><tr><th>Tipe Biaya</th><th>Pemohon</th><th>Nominal</th><th>Tanggal</th><th>Status</th><th class="text-right">Aksi</th></tr></thead><tbody><tr v-if="loading" class="data-state-row"><td colspan="6" class="py-10 text-center text-text-muted">Memuat reimbursement...</td></tr><tr v-else-if="!requests.length" class="data-state-row"><td colspan="6" class="py-10 text-center"><p class="font-medium text-primary">Reimbursement tidak ditemukan.</p><p class="mt-1 text-sm text-text-muted">Coba ubah status atau tipe biaya yang dipilih.</p></td></tr><template v-else><tr v-for="item in requests" :key="item.id"><td><p class="font-medium text-primary">{{ expenseLabel(item.reimbursementRequest.expenseType) }}</p><p class="mt-1 text-xs text-text-muted">REQ-{{ item.id }}</p></td><td><p class="text-text">{{ item.requester.name }}</p><p class="mt-1 text-xs text-text-muted">{{ item.requester.department.name }}</p></td><td class="font-medium text-text">{{ formatCurrency(item.reimbursementRequest.expenseAmount) }}</td><td class="text-text-muted">{{ formatDate(item.reimbursementRequest.expenseDate) }}</td><td><span :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td><td class="text-right"><RouterLink class="table-action-link" :to="`/kelola-reimbursement/${item.id}`">Lihat detail</RouterLink></td></tr></template></tbody></table></div>
        <div class="data-pagination"><p>Halaman {{ meta.page }} dari {{ meta.totalPages }}</p><div class="flex items-center gap-3"><button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Sebelumnya</button><button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page >= meta.totalPages || loading" @click="changePage(page + 1)">Berikutnya</button></div></div>
      </section>
    </main>
  </div>
</template>
