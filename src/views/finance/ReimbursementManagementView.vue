<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import DataListCard from '../../components/DataListCard.vue';
import DataPagination from '../../components/DataPagination.vue';
import ListState from '../../components/ListState.vue';
import PortalPageHeader from '../../components/PortalPageHeader.vue';
import ReportExportDialog from '../../components/ReportExportDialog.vue';
import ListScopeFilter from '../../components/ListScopeFilter.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type RequestStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'DIBATALKAN';
type ExpenseType = 'TRANSPORTASI' | 'KONSUMSI' | 'OPERASIONAL' | 'LAINNYA';
interface ReimbursementItem {
  id: number;
  status: RequestStatus;
  createdAt: string;
  requester: { name: string; department: { name: string } };
  reimbursementRequest: { expenseType: ExpenseType; expenseDate: string; expenseAmount: number | string };
}
interface ApprovalItem { request: ReimbursementItem }

const route = useRoute();
const router = useRouter();
const scopeOptions = [
  { value: 'all', label: 'Semua Reimbursement Karyawan' },
  { value: 'mine', label: 'Perlu Saya Tinjau' },
];
const requests = ref<ReimbursementItem[]>([]);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const scope = ref(route.query.scope === 'mine' ? 'mine' : 'all');
const page = ref(1);
const status = ref('');
const expenseType = ref('');
const order = ref<'asc' | 'desc'>('desc');
const loading = ref(false);
const errorMessage = ref('');
const isInbox = computed(() => scope.value === 'mine');

function statusLabel(value: RequestStatus) { return { MENUNGGU: 'Menunggu', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', DIBATALKAN: 'Dibatalkan' }[value]; }
function statusTone(value: RequestStatus) { return value === 'MENUNGGU' ? 'warning' as const : value === 'DISETUJUI' ? 'success' as const : 'danger' as const; }
function expenseLabel(value: ExpenseType) { return { TRANSPORTASI: 'Transportasi', KONSUMSI: 'Konsumsi', OPERASIONAL: 'Operasional', LAINNYA: 'Lainnya' }[value]; }
function formatDate(value: string) { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)); }
function formatCurrency(value: number | string) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value)); }

async function loadRequests() {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (isInbox.value) {
      const { data } = await api.get('/approvals', { headers: getAuthHeaders(), params: { page: page.value, limit: 10, status: 'MENUNGGU' } });
      requests.value = data.data.map((item: ApprovalItem) => item.request);
      meta.value = data.meta;
    } else {
      const { data } = await api.get('/manage/reimbursements', { headers: getAuthHeaders(), params: { page: page.value, limit: 10, status: status.value || undefined, expenseType: expenseType.value || undefined, sort: 'createdAt', order: order.value } });
      requests.value = data.data;
      meta.value = data.meta;
    }
  } catch (error) { errorMessage.value = getApiErrorMessage(error); }
  finally { loading.value = false; }
}

function changePage(nextPage: number) { if (nextPage < 1 || nextPage > meta.value.totalPages) return; page.value = nextPage; void loadRequests(); }
watch(scope, (value) => { page.value = 1; void router.replace({ query: { ...route.query, scope: value } }); void loadRequests(); });
watch(() => route.query.scope, (value) => { const nextScope = value === 'mine' ? 'mine' : 'all'; if (scope.value !== nextScope) scope.value = nextScope; });
watch([status, expenseType, order], () => { if (isInbox.value) return; page.value = 1; void loadRequests(); });
onMounted(loadRequests);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <PortalPageHeader eyebrow="Kelola Keuangan" title="Reimbursement Karyawan" description="Tinjau reimbursement yang menjadi tanggung jawab Anda dan pantau seluruh riwayat penggantian biaya karyawan.">
        <template #actions>
          <ReportExportDialog
            endpoint="/reports/finance/reimbursements"
            title="Export Pengeluaran Reimbursement"
            description="Reimbursement dengan tanggal pengeluaran pada bulan pilihan akan dimasukkan ke laporan."
            filename-prefix="laporan-reimbursement"
            processed-only
          />
        </template>
      </PortalPageHeader>
      <DataListCard :title="isInbox ? 'Reimbursement yang Perlu Anda Tinjau' : 'Semua Reimbursement Karyawan'" :description="isInbox ? 'Menampilkan reimbursement yang sudah siap Anda proses.' : 'Gunakan filter untuk menemukan reimbursement karyawan tertentu.'" :count="meta.total" count-label="reimbursement">
        <template #filters>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ListScopeFilter v-model="scope" :options="scopeOptions" label="Cakupan" />
            <template v-if="!isInbox">
              <label><span class="form-label">Status</span><select v-model="status" class="form-input"><option value="">Semua status</option><option value="MENUNGGU">Menunggu</option><option value="DISETUJUI">Disetujui</option><option value="DITOLAK">Ditolak</option><option value="DIBATALKAN">Dibatalkan</option></select></label>
              <label><span class="form-label">Tipe biaya</span><select v-model="expenseType" class="form-input"><option value="">Semua tipe biaya</option><option value="TRANSPORTASI">Transportasi</option><option value="KONSUMSI">Konsumsi</option><option value="OPERASIONAL">Operasional</option><option value="LAINNYA">Lainnya</option></select></label>
              <label><span class="form-label">Urutan</span><select v-model="order" class="form-input"><option value="desc">Terbaru</option><option value="asc">Terlama</option></select></label>
            </template>
          </div>
        </template>
        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
        <div class="data-table-shell"><table class="data-table min-w-[900px]"><thead><tr><th>Reimbursement</th><th>Pemohon</th><th>Nominal</th><th>Tanggal Biaya</th><th>Status</th><th class="text-right">Aksi</th></tr></thead><tbody>
          <ListState v-if="loading" :colspan="6" loading loading-text="Memuat reimbursement..." />
          <ListState v-else-if="requests.length === 0" :colspan="6" icon="document" :title="isInbox ? 'Tidak ada reimbursement untuk ditinjau' : 'Reimbursement tidak ditemukan'" :description="isInbox ? 'Semua reimbursement yang menjadi tanggung jawab Anda sudah ditinjau.' : 'Coba ubah status atau tipe biaya yang dipilih.'" />
          <template v-else><tr v-for="item in requests" :key="item.id"><td><p class="font-medium text-primary">{{ expenseLabel(item.reimbursementRequest.expenseType) }}</p><p class="mt-1 text-xs text-text-muted">REQ-{{ item.id }}</p></td><td><p class="font-medium text-text">{{ item.requester.name }}</p><p class="mt-1 text-xs text-text-muted">{{ item.requester.department.name }}</p></td><td class="font-medium text-text">{{ formatCurrency(item.reimbursementRequest.expenseAmount) }}</td><td class="text-text-muted">{{ formatDate(item.reimbursementRequest.expenseDate) }}</td><td><StatusBadge :label="isInbox ? 'Perlu ditinjau' : statusLabel(item.status)" :tone="statusTone(item.status)" /></td><td class="text-right"><RouterLink class="table-action-link" :to="{ path: `/pengajuan/reimbursement/${item.id}`, query: { from: 'kelola-reimbursement', scope } }">{{ isInbox ? 'Tinjau' : 'Lihat detail' }}</RouterLink></td></tr></template>
        </tbody></table></div>
        <template #pagination><DataPagination :page="meta.page" :total-pages="meta.totalPages" :loading="loading" @change="changePage" /></template>
      </DataListCard>
    </main>
  </div>
</template>
