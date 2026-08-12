<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type ApprovalStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';

interface ApprovalItem {
  id: number;
  status: ApprovalStatus;
  canProcess: boolean;
  request: {
    id: number;
    type: 'CUTI' | 'IZIN' | 'PENGGANTIAN_BIAYA';
    createdAt: string;
    requester: {
      name: string;
      department: { name: string };
    };
    leaveRequest: { leaveType: 'TAHUNAN' | 'KHUSUS' } | null;
    permissionRequest: { permissionType: 'HARIAN' | 'JAM' } | null;
    reimbursementRequest: { expenseType: 'TRANSPORTASI' | 'KONSUMSI' | 'OPERASIONAL' | 'LAINNYA' } | null;
  };
}

const approvals = ref<ApprovalItem[]>([]);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const page = ref(1);
const status = ref('');
const loading = ref(false);
const errorMessage = ref('');

function approvalStatusLabel(value: ApprovalStatus) {
  return { MENUNGGU: 'Menunggu', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak' }[value];
}

function statusClass(value: ApprovalStatus) {
  if (value === 'MENUNGGU') return 'status-warning';
  if (value === 'DISETUJUI') return 'status-success';
  return 'status-danger';
}

function requestLabel(item: ApprovalItem) {
  if (item.request.leaveRequest) {
    return item.request.leaveRequest.leaveType === 'TAHUNAN' ? 'Cuti Tahunan' : 'Cuti Khusus';
  }
  if (item.request.reimbursementRequest) return 'Penggantian Biaya';
  return item.request.permissionRequest?.permissionType === 'HARIAN' ? 'Izin Harian' : 'Izin Per Jam';
}

function requestDetailPath(item: ApprovalItem) {
  const path = item.request.type === 'CUTI'
    ? `/pengajuan/cuti/${item.request.id}`
    : item.request.type === 'IZIN'
      ? `/pengajuan/izin/${item.request.id}`
      : `/pengajuan/reimbursement/${item.request.id}`;
  return { path, query: { from: 'persetujuan' } };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

async function loadApprovals() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/approvals', {
      headers: getAuthHeaders(),
      params: { page: page.value, limit: 10, status: status.value || undefined },
    });
    approvals.value = data.data;
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
  void loadApprovals();
}

watch(status, () => {
  page.value = 1;
  void loadApprovals();
});

onMounted(loadApprovals);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />
    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="border-b border-border pb-6">
        <p class="text-sm font-medium text-primary-soft">Pengajuan Karyawan</p>
        <h1 class="mt-1 text-2xl font-semibold text-primary">Persetujuan</h1>
        <p class="mt-2 text-sm text-text-muted">Tinjau pengajuan yang menjadi tanggung jawab Anda.</p>
      </header>

      <section class="data-card">
        <div class="data-card-heading">
          <div>
            <h2 class="text-base font-semibold text-primary">Daftar Persetujuan</h2>
            <p class="mt-1 text-sm text-text-muted">Gunakan filter untuk menemukan pengajuan yang perlu ditinjau.</p>
          </div>
          <span class="data-count">{{ meta.total }} persetujuan</span>
        </div>

        <div class="mt-5 max-w-xs">
          <label class="form-label" for="approval-status">Status</label>
          <select id="approval-status" v-model="status" class="form-input">
            <option value="">Semua status</option>
            <option value="MENUNGGU">Menunggu</option>
            <option value="DISETUJUI">Disetujui</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>

        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>

        <div class="data-table-shell">
          <table class="data-table min-w-[850px]">
            <thead>
              <tr><th class="px-4 py-3">Pengajuan</th><th class="px-4 py-3">Pemohon</th><th class="px-4 py-3">Departemen</th><th class="px-4 py-3">Tanggal</th><th class="px-4 py-3">Status</th><th class="px-4 py-3 text-right">Aksi</th></tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="data-state-row"><td colspan="6" class="py-10 text-center text-text-muted">Memuat persetujuan...</td></tr>
              <tr v-else-if="approvals.length === 0" class="data-state-row"><td colspan="6" class="py-10 text-center"><p class="font-medium text-primary">Belum ada persetujuan.</p><p class="mt-1 text-sm text-text-muted">Tidak ada pengajuan yang cocok dengan filter saat ini.</p></td></tr>
              <template v-else>
                <tr v-for="item in approvals" :key="item.id">
                  <td class="px-4 py-4"><p class="font-medium text-primary">{{ requestLabel(item) }}</p><p class="mt-1 text-xs text-text-muted">REQ-{{ item.request.id }}</p></td>
                  <td class="px-4 py-4 text-text">{{ item.request.requester.name }}</td>
                  <td class="px-4 py-4 text-text-muted">{{ item.request.requester.department.name }}</td>
                  <td class="px-4 py-4 text-text-muted">{{ formatDate(item.request.createdAt) }}</td>
                  <td class="px-4 py-4"><span :class="statusClass(item.status)">{{ approvalStatusLabel(item.status) }}</span></td>
                  <td class="px-4 py-4 text-right"><RouterLink class="table-action-link" :to="requestDetailPath(item)">Lihat detail</RouterLink></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div class="data-pagination">
          <p>Halaman {{ meta.page }} dari {{ meta.totalPages }}</p>
          <div class="flex items-center gap-3"><button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Sebelumnya</button><button class="secondary-button min-h-9 px-3 py-2" type="button" :disabled="page >= meta.totalPages || loading" @click="changePage(page + 1)">Berikutnya</button></div>
        </div>
      </section>
    </main>
  </div>
</template>
