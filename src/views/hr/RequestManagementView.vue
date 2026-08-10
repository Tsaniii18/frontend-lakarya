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

      <section class="mt-7 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <select v-model="type" class="form-input" aria-label="Jenis pengajuan"><option value="">Semua jenis</option><option value="CUTI">Cuti</option><option value="IZIN">Izin</option></select>
          <select v-model="subtype" class="form-input" aria-label="Subtype pengajuan"><option value="">Semua subtype</option><option v-for="item in subtypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select>
          <select v-model="status" class="form-input" aria-label="Status pengajuan"><option value="">Semua status</option><option value="MENUNGGU">Menunggu</option><option value="DISETUJUI">Disetujui</option><option value="DITOLAK">Ditolak</option><option value="DIBATALKAN">Dibatalkan</option></select>
          <select v-model="department" class="form-input" aria-label="Departemen"><option value="">Semua departemen</option><option v-for="item in departments" :key="item" :value="item">{{ item }}</option></select>
          <select v-model="order" class="form-input" aria-label="Urutan"><option value="desc">Terbaru</option><option value="asc">Terlama</option></select>
        </div>

        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>
        <div class="mt-5 overflow-x-auto rounded-xl border border-border">
          <table class="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead class="bg-surface-soft text-xs font-semibold uppercase tracking-wide text-text-muted"><tr><th class="px-4 py-3">Pengajuan</th><th class="px-4 py-3">Pemohon</th><th class="px-4 py-3">Departemen</th><th class="px-4 py-3">Diajukan</th><th class="px-4 py-3">Status</th><th class="px-4 py-3 text-right">Aksi</th></tr></thead>
            <tbody class="divide-y divide-border">
              <tr v-if="loading"><td colspan="6" class="px-4 py-8 text-center text-text-muted">Memuat pengajuan...</td></tr>
              <tr v-else-if="requests.length === 0"><td colspan="6" class="px-4 py-8 text-center text-text-muted">Pengajuan tidak ditemukan.</td></tr>
              <template v-else><tr v-for="item in requests" :key="item.id"><td class="px-4 py-4"><p class="font-medium text-primary">{{ requestLabel(item) }}</p><p class="mt-1 text-xs text-text-muted">REQ-{{ item.id }}</p></td><td class="px-4 py-4 text-text">{{ item.requester.name }}</td><td class="px-4 py-4 text-text-muted">{{ item.requester.department.name }}</td><td class="px-4 py-4 text-text-muted">{{ formatDate(item.createdAt) }}</td><td class="px-4 py-4"><span :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td><td class="px-4 py-4 text-right"><RouterLink class="rounded-lg border border-primary-soft px-3 py-2 text-xs font-semibold text-primary-soft hover:bg-[#e9f0f7]" :to="`/kelola-pengajuan/${item.id}`">Lihat Detail</RouterLink></td></tr></template>
            </tbody>
          </table>
        </div>

        <div class="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"><p class="text-text-muted">{{ meta.total }} pengajuan</p><div class="flex items-center gap-2"><button class="rounded-lg border border-border px-3 py-2 text-primary disabled:opacity-40" type="button" :disabled="page <= 1" @click="changePage(page - 1)">Sebelumnya</button><span class="px-2 text-text-muted">{{ meta.page }} / {{ meta.totalPages }}</span><button class="rounded-lg border border-border px-3 py-2 text-primary disabled:opacity-40" type="button" :disabled="page >= meta.totalPages" @click="changePage(page + 1)">Berikutnya</button></div></div>
      </section>
    </main>
  </div>
</template>
