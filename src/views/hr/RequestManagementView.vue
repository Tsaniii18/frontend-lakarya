<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import DataListCard from '../../components/DataListCard.vue';
import DataPagination from '../../components/DataPagination.vue';
import ListState from '../../components/ListState.vue';
import PortalPageHeader from '../../components/PortalPageHeader.vue';
import ListScopeFilter from '../../components/ListScopeFilter.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type RequestStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'DIBATALKAN';
type RequestType = 'CUTI' | 'IZIN';

interface RequestItem {
  id: number;
  type: RequestType;
  status: RequestStatus;
  createdAt: string;
  requester: { name: string; department: { name: string } };
  leaveRequest: { leaveType: 'TAHUNAN' | 'KHUSUS' } | null;
  permissionRequest: { permissionType: 'HARIAN' | 'JAM' } | null;
}

interface ApprovalItem {
  request: RequestItem;
}

const route = useRoute();
const router = useRouter();
const departments = ['Human Resources', 'Finance', 'Information Technology', 'Marketing'];
const scopeOptions = [
  { value: 'all', label: 'Semua Cuti dan Izin' },
  { value: 'mine', label: 'Perlu Saya Tinjau' },
];
const requests = ref<RequestItem[]>([]);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const scope = ref(route.query.scope === 'mine' ? 'mine' : 'all');
const page = ref(1);
const type = ref('');
const subtype = ref('');
const status = ref('');
const department = ref('');
const order = ref<'asc' | 'desc'>('desc');
const loading = ref(false);
const errorMessage = ref('');

const isInbox = computed(() => scope.value === 'mine');
const subtypeOptions = computed(() => {
  if (type.value === 'CUTI') return [{ value: 'TAHUNAN', label: 'Cuti Tahunan' }, { value: 'KHUSUS', label: 'Cuti Khusus' }];
  if (type.value === 'IZIN') return [{ value: 'HARIAN', label: 'Izin Harian' }, { value: 'JAM', label: 'Izin Per Jam' }];
  return [
    { value: 'TAHUNAN', label: 'Cuti Tahunan' },
    { value: 'KHUSUS', label: 'Cuti Khusus' },
    { value: 'HARIAN', label: 'Izin Harian' },
    { value: 'JAM', label: 'Izin Per Jam' },
  ];
});

function requestLabel(item: RequestItem) {
  if (item.leaveRequest) return item.leaveRequest.leaveType === 'TAHUNAN' ? 'Cuti Tahunan' : 'Cuti Khusus';
  return item.permissionRequest?.permissionType === 'HARIAN' ? 'Izin Harian' : 'Izin Per Jam';
}

function statusLabel(value: RequestStatus) {
  return { MENUNGGU: 'Menunggu', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak', DIBATALKAN: 'Dibatalkan' }[value];
}

function statusTone(value: RequestStatus) {
  if (value === 'MENUNGGU') return 'warning' as const;
  if (value === 'DISETUJUI') return 'success' as const;
  return 'danger' as const;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function requestDetailPath(item: RequestItem) {
  const path = item.type === 'CUTI' ? `/pengajuan/cuti/${item.id}` : `/pengajuan/izin/${item.id}`;
  return { path, query: { from: 'kelola-pengajuan', scope: scope.value } };
}

async function loadRequests() {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (isInbox.value) {
      const { data } = await api.get('/approvals', {
        headers: getAuthHeaders(),
        params: { page: page.value, limit: 10, status: 'MENUNGGU' },
      });
      requests.value = data.data.map((item: ApprovalItem) => item.request);
      meta.value = data.meta;
    } else {
      const { data } = await api.get('/manage/requests', {
        headers: getAuthHeaders(),
        params: {
          page: page.value,
          limit: 10,
          type: type.value || undefined,
          subtype: subtype.value || undefined,
          status: status.value || undefined,
          department: department.value || undefined,
          sort: 'createdAt',
          order: order.value,
        },
      });
      requests.value = data.data;
      meta.value = data.meta;
    }
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > meta.value.totalPages) return;
  page.value = nextPage;
  void loadRequests();
}

watch(type, () => {
  if (!subtypeOptions.value.some((item) => item.value === subtype.value)) subtype.value = '';
});
watch(scope, (value) => {
  page.value = 1;
  void router.replace({ query: { ...route.query, scope: value } });
  void loadRequests();
});
watch(
  () => route.query.scope,
  (value) => {
    const nextScope = value === 'mine' ? 'mine' : 'all';
    if (scope.value !== nextScope) scope.value = nextScope;
  },
);
watch([type, subtype, status, department, order], () => {
  if (isInbox.value) return;
  page.value = 1;
  void loadRequests();
});
onMounted(loadRequests);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <PortalPageHeader
        eyebrow="Kelola HR"
        title="Cuti dan Izin Karyawan"
        description="Tinjau pengajuan yang menjadi tanggung jawab Anda dan pantau seluruh cuti serta izin karyawan."
      />

      <DataListCard
        :title="isInbox ? 'Cuti dan Izin yang Perlu Anda Tinjau' : 'Semua Pengajuan Cuti dan Izin Karyawan'"
        :description="isInbox ? 'Menampilkan pengajuan yang sudah siap Anda proses.' : 'Gunakan filter untuk menemukan pengajuan karyawan tertentu.'"
        :count="meta.total"
        count-label="pengajuan"
      >
        <template #filters>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <ListScopeFilter v-model="scope" :options="scopeOptions" label="Cakupan" />
            <template v-if="!isInbox">
              <label><span class="form-label">Jenis</span><select v-model="type" class="form-input"><option value="">Semua jenis</option><option value="CUTI">Cuti</option><option value="IZIN">Izin</option></select></label>
              <label><span class="form-label">Tipe</span><select v-model="subtype" class="form-input"><option value="">Semua tipe</option><option v-for="item in subtypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
              <label><span class="form-label">Status</span><select v-model="status" class="form-input"><option value="">Semua status</option><option value="MENUNGGU">Menunggu</option><option value="DISETUJUI">Disetujui</option><option value="DITOLAK">Ditolak</option><option value="DIBATALKAN">Dibatalkan</option></select></label>
              <label><span class="form-label">Departemen</span><select v-model="department" class="form-input"><option value="">Semua departemen</option><option v-for="item in departments" :key="item" :value="item">{{ item }}</option></select></label>
              <label><span class="form-label">Urutan</span><select v-model="order" class="form-input"><option value="desc">Terbaru</option><option value="asc">Terlama</option></select></label>
            </template>
          </div>
        </template>

        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
        <div class="data-table-shell">
          <table class="data-table min-w-[880px]">
            <thead><tr><th>Pengajuan</th><th>Pemohon</th><th>Departemen</th><th>Diajukan</th><th>Status</th><th class="text-right">Aksi</th></tr></thead>
            <tbody>
              <ListState v-if="loading" :colspan="6" loading loading-text="Memuat pengajuan..." />
              <ListState v-else-if="requests.length === 0" :colspan="6" icon="document" :title="isInbox ? 'Tidak ada cuti atau izin untuk ditinjau' : 'Cuti dan izin tidak ditemukan'" :description="isInbox ? 'Semua pengajuan yang menjadi tanggung jawab Anda sudah ditinjau.' : 'Coba ubah kombinasi filter yang digunakan.'" />
              <template v-else>
                <tr v-for="item in requests" :key="item.id">
                  <td><p class="font-medium text-primary">{{ requestLabel(item) }}</p><p class="mt-1 text-xs text-text-muted">REQ-{{ item.id }}</p></td>
                  <td class="font-medium text-text">{{ item.requester.name }}</td>
                  <td class="text-text-muted">{{ item.requester.department.name }}</td>
                  <td class="text-text-muted">{{ formatDate(item.createdAt) }}</td>
                  <td><StatusBadge :label="isInbox ? 'Perlu ditinjau' : statusLabel(item.status)" :tone="statusTone(item.status)" /></td>
                  <td class="text-right"><RouterLink class="table-action-link" :to="requestDetailPath(item)">{{ isInbox ? 'Tinjau' : 'Lihat detail' }}</RouterLink></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <template #pagination><DataPagination :page="meta.page" :total-pages="meta.totalPages" :loading="loading" @change="changePage" /></template>
      </DataListCard>
    </main>
  </div>
</template>
