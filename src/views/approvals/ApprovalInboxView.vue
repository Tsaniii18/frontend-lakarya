<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import AppSidebar from '../../components/AppSidebar.vue';
import DataListCard from '../../components/DataListCard.vue';
import DataPagination from '../../components/DataPagination.vue';
import ListState from '../../components/ListState.vue';
import PortalPageHeader from '../../components/PortalPageHeader.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import { authState, getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
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
const departmentLabel = computed(() => {
  if (authState.user?.department.name === 'Information Technology') return 'IT';
  return authState.user?.department.name ?? 'Tim';
});

function approvalStatusLabel(value: ApprovalStatus) {
  return { MENUNGGU: 'Perlu ditinjau', DISETUJUI: 'Disetujui', DITOLAK: 'Ditolak' }[value];
}

function statusTone(value: ApprovalStatus) {
  if (value === 'MENUNGGU') return 'warning' as const;
  if (value === 'DISETUJUI') return 'success' as const;
  return 'danger' as const;
}

function requestLabel(item: ApprovalItem) {
  if (item.request.leaveRequest) {
    return item.request.leaveRequest.leaveType === 'TAHUNAN' ? 'Cuti Tahunan' : 'Cuti Khusus';
  }
  if (item.request.reimbursementRequest) return 'Reimbursement';
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
      <PortalPageHeader
        :eyebrow="`Kelola ${departmentLabel}`"
        title="Cuti dan Izin Tim"
        description="Tinjau cuti dan izin anggota tim yang menjadi tanggung jawab Anda."
      />

      <DataListCard title="Daftar Cuti dan Izin Tim Anda" description="Lihat pengajuan yang perlu Anda tinjau maupun yang sudah diproses." :count="meta.total" count-label="pengajuan">
        <template #filters><div class="max-w-xs">
          <label class="form-label" for="approval-status">Status</label>
          <select id="approval-status" v-model="status" class="form-input">
            <option value="">Semua status</option>
            <option value="MENUNGGU">Perlu ditinjau</option>
            <option value="DISETUJUI">Sudah disetujui</option>
            <option value="DITOLAK">Sudah ditolak</option>
          </select>
        </div></template>

        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{{ errorMessage }}</div>

        <div class="data-table-shell">
          <table class="data-table min-w-[850px]">
            <thead>
              <tr><th class="px-4 py-3">Pengajuan</th><th class="px-4 py-3">Pemohon</th><th class="px-4 py-3">Departemen</th><th class="px-4 py-3">Tanggal</th><th class="px-4 py-3">Status</th><th class="px-4 py-3 text-right">Aksi</th></tr>
            </thead>
            <tbody>
              <ListState v-if="loading" :colspan="6" loading loading-text="Memuat pengajuan tim..." />
              <ListState v-else-if="approvals.length === 0" :colspan="6" icon="document" title="Tidak ada pengajuan tim" description="Belum ada cuti atau izin yang cocok dengan filter saat ini." />
              <template v-else>
                <tr v-for="item in approvals" :key="item.id">
                  <td class="px-4 py-4"><p class="font-medium text-primary">{{ requestLabel(item) }}</p><p class="mt-1 text-xs text-text-muted">REQ-{{ item.request.id }}</p></td>
                  <td class="px-4 py-4 text-text">{{ item.request.requester.name }}</td>
                  <td class="px-4 py-4 text-text-muted">{{ item.request.requester.department.name }}</td>
                  <td class="px-4 py-4 text-text-muted">{{ formatDate(item.request.createdAt) }}</td>
                  <td class="px-4 py-4"><StatusBadge :label="approvalStatusLabel(item.status)" :tone="statusTone(item.status)" /></td>
                  <td class="px-4 py-4 text-right"><RouterLink class="table-action-link" :to="requestDetailPath(item)">Lihat detail</RouterLink></td>
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
