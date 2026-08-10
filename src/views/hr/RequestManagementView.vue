<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type RequestStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'DIBATALKAN';

interface RequestItem {
  id: number;
  type: 'CUTI' | 'IZIN';
  status: RequestStatus;
  createdAt: string;
  requester: { name: string; department: { name: string } };
  leaveRequest: { leaveType: 'TAHUNAN' | 'KHUSUS' } | null;
  permissionRequest: { permissionType: 'HARIAN' | 'JAM' } | null;
}

const departments = ['Human Resources', 'Finance', 'Information Technology', 'Marketing'];
const requests = ref<RequestItem[]>([]);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const page = ref(1);
const type = ref('');
const subtype = ref('');
const status = ref('');
const department = ref('');
const order = ref<'asc' | 'desc'>('desc');
const loading = ref(false);
const errorMessage = ref('');

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

function statusClass(value: RequestStatus) {
  if (value === 'MENUNGGU') return 'status-warning';
  if (value === 'DISETUJUI') return 'status-success';
  return 'status-danger';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

async function loadRequests() {
  loading.value = true;
  errorMessage.value = '';
  try {
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

watch([type, subtype, status, department, order], () => {
  page.value = 1;
  void loadRequests();
});

onMounted(loadRequests);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6"><p class="text-sm font-medium text-primary-soft">Human Resources</p><h1 class="mt-1 text-2xl font-semibold text-primary">Kelola Pengajuan</h1><p class="mt-2 text-sm text-text-muted">Pantau seluruh pengajuan cuti dan izin karyawan.</p></header>

      <section class="data-card">
        <div class="data-card-heading"><div><h2 class="text-base font-semibold text-primary">Daftar Pengajuan Karyawan</h2><p class="mt-1 text-sm text-text-muted">Filter cuti dan izin berdasarkan kebutuhan peninjauan.</p></div><span class="data-count">{{ meta.total }} pengajuan</span></div>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label><span class="form-label">Jenis</span><select v-model="type" class="form-input"><option value="">Semua jenis</option><option value="CUTI">Cuti</option><option value="IZIN">Izin</option></select></label>
          <label><span class="form-label">Tipe</span><select v-model="subtype" class="form-input"><option value="">Semua tipe</option><option v-for="item in subtypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label><span class="form-label">Status</span><select v-model="status" class="form-input"><option value="">Semua status</option><option value="MENUNGGU">Menunggu</option><option value="DISETUJUI">Disetujui</option><option value="DITOLAK">Ditolak</option><option value="DIBATALKAN">Dibatalkan</option></select></label>
          <label><span class="form-label">Departemen</span><select v-model="department" class="form-input"><option value="">Semua departemen</option><option v-for="item in departments" :key="item" :value="item">{{ item }}</option></select></label>
          <label><span class="form-label">Urutan</span><select v-model="order" class="form-input"><option value="desc">Terbaru</option><option value="asc">Terlama</option></select></label>
        </div>

        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
        <div class="data-table-shell">
          <table class="data-table min-w-[900px]">
            <thead><tr><th>Pengajuan</th><th>Pemohon</th><th>Departemen</th><th>Diajukan</th><th>Status</th><th class="text-right">Aksi</th></tr></thead>
            <tbody>
              <tr v-if="loading" class="data-state-row"><td colspan="6" class="py-10 text-center text-text-muted">Memuat pengajuan...</td></tr>
              <tr v-else-if="requests.length === 0" class="data-state-row"><td colspan="6" class="py-10 text-center"><p class="font-medium text-primary">Pengajuan tidak ditemukan.</p><p class="mt-1 text-sm text-text-muted">Coba ubah kombinasi filter yang digunakan.</p></td></tr>
              <template v-else><tr v-for="item in requests" :key="item.id"><td><p class="font-medium text-primary">{{ requestLabel(item) }}</p><p class="mt-1 text-xs text-text-muted">REQ-{{ item.id }}</p></td><td class="text-text">{{ item.requester.name }}</td><td class="text-text-muted">{{ item.requester.department.name }}</td><td class="text-text-muted">{{ formatDate(item.createdAt) }}</td><td><span :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td><td class="text-right"><RouterLink class="table-action-link" :to="`/kelola-pengajuan/${item.id}`">Lihat detail</RouterLink></td></tr></template>
            </tbody>
          </table>
        </div>

        <div class="data-pagination"><p>Halaman {{ meta.page }} dari {{ meta.totalPages }}</p><div class="flex items-center gap-3"><button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Sebelumnya</button><button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page >= meta.totalPages || loading" @click="changePage(page + 1)">Berikutnya</button></div></div>
      </section>
    </main>
  </div>
</template>
