<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppSidebar from '../../components/AppSidebar.vue';
import { getApiErrorMessage, getAuthHeaders } from '../../auth/auth';
import api from '../../lib/api';

type RequestType = 'CUTI' | 'IZIN' | 'PENGGANTIAN_BIAYA';
type RequestStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'DIBATALKAN';

interface RequestItem {
  id: number;
  type: RequestType;
  status: RequestStatus;
  createdAt: string;
  totalDays?: number;
  leaveRequest?: {
    leaveType: 'TAHUNAN' | 'KHUSUS';
    startDate: string;
    endDate: string;
    reason: string;
  } | null;
}

interface RequestListResponse {
  data: RequestItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const router = useRouter();
const requests = ref<RequestItem[]>([]);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const page = ref(1);
const type = ref('');
const status = ref('');
const order = ref<'asc' | 'desc'>('desc');
const loading = ref(false);
const errorMessage = ref('');

function typeLabel(request: RequestItem) {
  if (request.type === 'CUTI') {
    return request.leaveRequest?.leaveType === 'KHUSUS'
      ? 'Cuti Khusus'
      : 'Cuti Tahunan';
  }
  if (request.type === 'IZIN') return 'Izin';
  return 'Penggantian Biaya';
}

function statusLabel(value: RequestStatus) {
  return {
    MENUNGGU: 'Menunggu',
    DISETUJUI: 'Disetujui',
    DITOLAK: 'Ditolak',
    DIBATALKAN: 'Dibatalkan',
  }[value];
}

function statusClass(value: RequestStatus) {
  if (value === 'MENUNGGU') return 'status-warning';
  if (value === 'DISETUJUI') return 'status-success';
  return 'status-danger';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function summary(request: RequestItem) {
  if (request.leaveRequest) {
    return `${formatDate(request.leaveRequest.startDate)} – ${formatDate(request.leaveRequest.endDate)}`;
  }
  return `Diajukan ${formatDate(request.createdAt)}`;
}

async function loadRequests() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const { data } = await api.get<RequestListResponse>('/requests', {
      headers: getAuthHeaders(),
      params: {
        page: page.value,
        limit: 10,
        type: type.value || undefined,
        status: status.value || undefined,
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

function openDetail(request: RequestItem) {
  if (request.type === 'CUTI') {
    void router.push(`/pengajuan/cuti/${request.id}`);
  }
}

function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > meta.value.totalPages) return;
  page.value = nextPage;
  void loadRequests();
}

watch([type, status, order], () => {
  page.value = 1;
  void loadRequests();
});

onMounted(loadRequests);
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />

    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-medium text-primary-soft">Portal Karyawan</p>
          <h1 class="mt-1 text-2xl font-semibold text-primary">Pengajuan</h1>
          <p class="mt-2 text-sm text-text-muted">Pantau cuti, izin, dan reimbursement Anda.</p>
        </div>
        <RouterLink class="primary-button" to="/pengajuan/cuti/baru">Buat Pengajuan Cuti</RouterLink>
      </header>

      <section class="mt-7 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div class="grid gap-3 md:grid-cols-3">
          <label>
            <span class="form-label">Jenis</span>
            <select v-model="type" class="form-input">
              <option value="">Semua jenis</option>
              <option value="CUTI">Cuti</option>
              <option value="IZIN">Izin</option>
              <option value="PENGGANTIAN_BIAYA">Penggantian Biaya</option>
            </select>
          </label>
          <label>
            <span class="form-label">Status</span>
            <select v-model="status" class="form-input">
              <option value="">Semua status</option>
              <option value="MENUNGGU">Menunggu</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="DITOLAK">Ditolak</option>
              <option value="DIBATALKAN">Dibatalkan</option>
            </select>
          </label>
          <label>
            <span class="form-label">Urutan</span>
            <select v-model="order" class="form-input">
              <option value="desc">Terbaru</option>
              <option value="asc">Terlama</option>
            </select>
          </label>
        </div>

        <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">
          {{ errorMessage }}
        </div>

        <div class="mt-5 overflow-x-auto rounded-xl border border-border">
          <table class="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead class="bg-surface-soft text-xs font-semibold uppercase tracking-wide text-text-muted">
              <tr>
                <th class="px-4 py-3">Pengajuan</th>
                <th class="px-4 py-3">Periode</th>
                <th class="px-4 py-3">Diajukan</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-if="loading">
                <td class="px-4 py-10 text-center text-text-muted" colspan="5">Memuat pengajuan...</td>
              </tr>
              <tr v-else-if="requests.length === 0">
                <td class="px-4 py-10 text-center" colspan="5">
                  <p class="font-medium text-primary">Belum ada pengajuan.</p>
                  <p class="mt-1 text-sm text-text-muted">Buat pengajuan pertama Anda saat dibutuhkan.</p>
                  <RouterLink class="secondary-button mt-4" to="/pengajuan/cuti/baru">Buat Pengajuan</RouterLink>
                </td>
              </tr>
              <template v-else>
                <tr v-for="request in requests" :key="request.id" class="text-text hover:bg-surface-soft">
                  <td class="px-4 py-4">
                    <p class="font-medium text-primary">{{ typeLabel(request) }}</p>
                    <p class="mt-1 text-xs text-text-muted">REQ-{{ request.id }}</p>
                  </td>
                  <td class="px-4 py-4 text-text-muted">{{ summary(request) }}</td>
                  <td class="px-4 py-4 text-text-muted">{{ formatDate(request.createdAt) }}</td>
                  <td class="px-4 py-4"><span :class="statusClass(request.status)">{{ statusLabel(request.status) }}</span></td>
                  <td class="px-4 py-4 text-right">
                    <button
                      v-if="request.type === 'CUTI'"
                      class="rounded-lg border border-primary-soft px-3 py-2 text-xs font-semibold text-primary-soft hover:bg-[#e9f0f7]"
                      type="button"
                      @click="openDetail(request)"
                    >
                      Lihat detail
                    </button>
                    <span v-else class="text-xs text-text-muted">—</span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div class="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p class="text-text-muted">{{ meta.total }} data</p>
          <div class="flex items-center gap-3">
            <button class="secondary-button" type="button" :disabled="meta.page <= 1 || loading" @click="changePage(meta.page - 1)">Sebelumnya</button>
            <span class="text-text-muted">{{ meta.page }} / {{ meta.totalPages }}</span>
            <button class="secondary-button" type="button" :disabled="meta.page >= meta.totalPages || loading" @click="changePage(meta.page + 1)">Berikutnya</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
