<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import AppSidebar from '../components/AppSidebar.vue';
import {
  authState,
  getApiErrorMessage,
  getAuthHeaders,
  getProfilePictureBlob,
} from '../auth/auth';
import api from '../lib/api';

interface LeaveBalance {
  year: number;
  totalDays: number;
  reservedDays: number;
  usedDays: number;
  availableDays: number;
}

interface ActiveRequest {
  id: number;
  type: 'CUTI' | 'IZIN' | 'PENGGANTIAN_BIAYA';
  createdAt: string;
  totalDays?: number;
  leaveRequest?: {
    leaveType: 'TAHUNAN' | 'KHUSUS';
    startDate: string;
    endDate: string;
  } | null;
  permissionRequest?: {
    permissionType: 'HARIAN' | 'JAM';
    startDate: string;
    endDate: string;
    totalDays: number | string;
    startTime: string | null;
    endTime: string | null;
  } | null;
}

interface ActiveRequestsResponse {
  data: ActiveRequest[];
  meta: {
    total: number;
  };
}

type ComplaintStatus = 'TERBUKA' | 'DIPROSES' | 'SELESAI' | 'DITUTUP';

interface RecentComplaint {
  id: number;
  subject: string;
  status: ComplaintStatus;
  createdAt: string;
  reporter?: { name: string };
}

interface RecentComplaintsResponse {
  data: RecentComplaint[];
}

const profilePictureUrl = ref('');
const leaveBalance = ref<LeaveBalance | null>(null);
const activeRequests = ref<ActiveRequest[]>([]);
const activeRequestTotal = ref(0);
const recentComplaints = ref<RecentComplaint[]>([]);
const loadingDashboard = ref(false);
const dashboardError = ref('');
const isHrManager = computed(
  () =>
    authState.user?.role === 'MANAJER' &&
    authState.user.department.name === 'Human Resources',
);

const availablePercentage = computed(() => {
  if (!leaveBalance.value?.totalDays) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      (leaveBalance.value.availableDays / leaveBalance.value.totalDays) * 100,
    ),
  );
});

const usedPercentage = computed(() => {
  if (!leaveBalance.value?.totalDays) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      (leaveBalance.value.usedDays / leaveBalance.value.totalDays) * 100,
    ),
  );
});

const reservedPercentage = computed(() => {
  if (!leaveBalance.value?.totalDays) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      (leaveBalance.value.reservedDays / leaveBalance.value.totalDays) * 100,
    ),
  );
});

function requestLabel(request: ActiveRequest) {
  if (request.type === 'CUTI') {
    return request.leaveRequest?.leaveType === 'KHUSUS'
      ? 'Cuti Khusus'
      : 'Cuti Tahunan';
  }
  if (request.type === 'IZIN') {
    return request.permissionRequest?.permissionType === 'JAM'
      ? 'Izin Per Jam'
      : 'Izin Harian';
  }
  return 'Penggantian Biaya';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(value));
}

function requestSummary(request: ActiveRequest) {
  if (request.leaveRequest) {
    return `${formatDate(request.leaveRequest.startDate)} – ${formatDate(request.leaveRequest.endDate)} · ${request.totalDays ?? 0} hari`;
  }
  if (request.permissionRequest?.permissionType === 'HARIAN') {
    return `${formatDate(request.permissionRequest.startDate)} – ${formatDate(request.permissionRequest.endDate)} · ${Number(request.permissionRequest.totalDays)} hari`;
  }
  if (request.permissionRequest) {
    return `${formatDate(request.permissionRequest.startDate)} · ${formatTime(request.permissionRequest.startTime)}–${formatTime(request.permissionRequest.endTime)}`;
  }
  return `Diajukan ${formatDate(request.createdAt)}`;
}

function requestDetailPath(request: ActiveRequest) {
  if (request.type === 'CUTI') return `/pengajuan/cuti/${request.id}`;
  if (request.type === 'IZIN') return `/pengajuan/izin/${request.id}`;
  return '';
}

function complaintStatusLabel(value: ComplaintStatus) {
  return {
    TERBUKA: 'Terbuka',
    DIPROSES: 'Diproses',
    SELESAI: 'Selesai',
    DITUTUP: 'Ditutup',
  }[value];
}

function complaintStatusClass(value: ComplaintStatus) {
  if (value === 'TERBUKA') return 'status-warning';
  if (value === 'SELESAI') return 'status-success';
  return 'status-info';
}

function complaintDetailPath(complaintId: number) {
  return isHrManager.value
    ? `/kelola-keluhan/${complaintId}`
    : `/keluhan/${complaintId}`;
}

async function loadDashboardData() {
  loadingDashboard.value = true;
  dashboardError.value = '';

  try {
    const complaintEndpoint = isHrManager.value
      ? '/manage/complaints'
      : '/complaints';
    const [balanceResponse, requestsResponse, complaintsResponse] = await Promise.all([
      api.get<LeaveBalance>('/leave/balance', {
        headers: getAuthHeaders(),
      }),
      api.get<ActiveRequestsResponse>('/requests', {
        headers: getAuthHeaders(),
        params: {
          page: 1,
          limit: 3,
          status: 'MENUNGGU',
          sort: 'createdAt',
          order: 'desc',
        },
      }),
      api.get<RecentComplaintsResponse>(complaintEndpoint, {
        headers: getAuthHeaders(),
        params: {
          page: 1,
          limit: 3,
          sort: 'createdAt',
          order: 'desc',
        },
      }),
    ]);

    leaveBalance.value = balanceResponse.data;
    activeRequests.value = requestsResponse.data.data;
    activeRequestTotal.value = requestsResponse.data.meta.total;
    recentComplaints.value = complaintsResponse.data.data;
  } catch (error) {
    dashboardError.value = getApiErrorMessage(error);
  } finally {
    loadingDashboard.value = false;
  }
}

async function loadProfilePicture() {
  if (!authState.user?.profilePictureUrl) return;

  try {
    const blob = await getProfilePictureBlob();
    profilePictureUrl.value = URL.createObjectURL(blob);
  } catch {
    profilePictureUrl.value = '';
  }
}

onMounted(() => {
  void loadDashboardData();
  void loadProfilePicture();
});

onBeforeUnmount(() => {
  if (profilePictureUrl.value) {
    URL.revokeObjectURL(profilePictureUrl.value);
  }
});
</script>

<template>
  <div class="min-h-screen bg-background md:grid md:grid-cols-[auto_minmax(0,1fr)]">
    <AppSidebar />

    <main class="min-w-0 px-5 py-7 sm:px-7 md:px-8 md:py-9 lg:px-10">
      <header class="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-medium text-primary-soft">Beranda Karyawan</p>
          <h1 class="mt-1 text-2xl font-semibold text-primary">Selamat datang, {{ authState.user?.name }}</h1>
          <p class="mt-2 text-sm text-text-muted">Ringkasan aktivitas Anda.</p>
        </div>

        <div class="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 sm:max-w-xs">
          <img
            v-if="profilePictureUrl"
            class="h-10 w-10 shrink-0 rounded-full object-cover"
            :src="profilePictureUrl"
            :alt="`Foto profil ${authState.user?.name ?? ''}`"
          />
          <span v-else class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {{ authState.user?.name?.charAt(0).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-text">{{ authState.user?.name }}</p>
            <p class="mt-0.5 truncate text-xs text-text-muted">{{ authState.user?.employeeNumber }}</p>
          </div>
        </div>
      </header>

      <div v-if="dashboardError" class="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger" role="alert">
        {{ dashboardError }}
      </div>

      <div class="mt-7 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-text-muted">Sisa Cuti Tahunan</p>
              <p class="mt-3 text-4xl font-semibold tracking-tight text-primary">
                {{ loadingDashboard ? '—' : (leaveBalance?.availableDays ?? '—') }}
                <span class="text-base font-medium text-text-muted">hari</span>
              </p>
            </div>
            <span class="status-info">Tahun {{ leaveBalance?.year ?? new Date().getFullYear() }}</span>
          </div>
          <div class="mt-6 flex h-2.5 w-full gap-1 rounded-full bg-[#e9edf2]" aria-label="Komposisi saldo cuti tahunan">
            <div
              v-if="availablePercentage > 0"
              class="group relative h-full basis-0 bg-[#58a997] first:rounded-l-full last:rounded-r-full"
              :style="{ flexGrow: availablePercentage }"
              :aria-label="`Tersedia ${leaveBalance?.availableDays ?? 0} hari`"
              tabindex="0"
            >
              <span class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:inline-flex group-focus:inline-flex">
                <span class="h-2 w-2 rounded-full bg-[#58a997]"></span>
                Tersedia · {{ leaveBalance?.availableDays ?? 0 }} hari
              </span>
            </div>
            <div
              v-if="usedPercentage > 0"
              class="group relative h-full basis-0 bg-[#216052] first:rounded-l-full last:rounded-r-full"
              :style="{ flexGrow: usedPercentage }"
              :aria-label="`Terpakai ${leaveBalance?.usedDays ?? 0} hari`"
              tabindex="0"
            >
              <span class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:inline-flex group-focus:inline-flex">
                <span class="h-2 w-2 rounded-full bg-[#216052]"></span>
                Terpakai · {{ leaveBalance?.usedDays ?? 0 }} hari
              </span>
            </div>
            <div
              v-if="reservedPercentage > 0"
              class="group relative h-full basis-0 bg-warning first:rounded-l-full last:rounded-r-full"
              :style="{ flexGrow: reservedPercentage }"
              :aria-label="`Dipesan ${leaveBalance?.reservedDays ?? 0} hari`"
              tabindex="0"
            >
              <span class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:inline-flex group-focus:inline-flex">
                <span class="h-2 w-2 rounded-full bg-warning"></span>
                Dipesan · {{ leaveBalance?.reservedDays ?? 0 }} hari
              </span>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-muted">
            <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-[#58a997]"></span>Tersedia</span>
            <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-[#216052]"></span>Terpakai</span>
            <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-warning"></span>Dipesan</span>
          </div>
        </section>

        <section class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-text-muted">Pengajuan Aktif</p>
              <p class="mt-3 text-4xl font-semibold tracking-tight text-primary">{{ loadingDashboard ? '—' : activeRequestTotal }}</p>
            </div>
            <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8efdf] text-[#9a6824]">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </svg>
            </span>
          </div>
          <p class="mt-6 text-sm leading-6 text-text-muted">
            {{ activeRequestTotal > 0
              ? `${activeRequestTotal} pengajuan sedang menunggu proses persetujuan.`
              : 'Tidak ada pengajuan yang sedang menunggu persetujuan.' }}
          </p>
        </section>
      </div>

      <section class="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-primary">Pengajuan Aktif Terbaru</h2>
            <p class="mt-1 text-sm text-text-muted">Pengajuan yang masih menunggu persetujuan.</p>
          </div>
          <RouterLink
            class="rounded-lg border border-primary-soft px-3 py-2 text-xs font-semibold text-primary-soft hover:bg-[#e9f0f7]"
            to="/pengajuan"
          >
            Lihat Semua Pengajuan
          </RouterLink>
        </div>

        <div class="mt-5 divide-y divide-border">
          <p v-if="loadingDashboard" class="py-5 text-sm text-text-muted">Memuat pengajuan aktif...</p>
          <p v-else-if="activeRequests.length === 0" class="py-5 text-sm text-text-muted">Tidak ada pengajuan yang sedang menunggu.</p>
          <template v-else>
            <div
              v-for="request in activeRequests"
              :key="request.id"
              class="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center gap-3">
                <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e9f0f7] text-primary-soft">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path d="M7 3v3M17 3v3M4 9h16" />
                    <rect x="4" y="5" width="16" height="15" rx="2" />
                  </svg>
                </span>
                <div>
                  <p class="text-sm font-medium text-text">{{ requestLabel(request) }}</p>
                  <p class="mt-1 text-xs text-text-muted">{{ requestSummary(request) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 self-start sm:self-auto">
                <RouterLink
                  v-if="requestDetailPath(request)"
                  class="text-xs font-semibold text-primary-soft hover:text-primary"
                  :to="requestDetailPath(request)"
                >
                  Lihat detail
                </RouterLink>
                <span class="status-warning">Menunggu</span>
              </div>
            </div>
          </template>
        </div>
      </section>

      <section v-if="loadingDashboard || recentComplaints.length" class="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-primary">{{ isHrManager ? 'Keluhan Masuk Terbaru' : 'Keluhan Terbaru' }}</h2>
            <p class="mt-1 text-sm text-text-muted">{{ isHrManager ? 'Keluhan karyawan yang baru disampaikan.' : 'Perkembangan keluhan yang Anda sampaikan.' }}</p>
          </div>
          <RouterLink
            class="rounded-lg border border-primary-soft px-3 py-2 text-xs font-semibold text-primary-soft hover:bg-[#e9f0f7]"
            :to="isHrManager ? '/kelola-keluhan' : '/keluhan'"
          >
            Lihat Semua Keluhan
          </RouterLink>
        </div>

        <div class="mt-5 divide-y divide-border">
          <p v-if="loadingDashboard" class="py-5 text-sm text-text-muted">Memuat keluhan terbaru...</p>
          <template v-else>
            <div
              v-for="complaint in recentComplaints"
              :key="complaint.id"
              class="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center gap-3">
                <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef3f1] text-primary-soft">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path d="M5 18.5 3.5 21l4-1.2a9 9 0 1 0-2.5-1.3Z" />
                    <path d="M12 8v4M12 15.5h.01" />
                  </svg>
                </span>
                <div>
                  <p class="text-sm font-medium text-text">{{ complaint.subject }}</p>
                  <p class="mt-1 text-xs text-text-muted">
                    <span v-if="isHrManager && complaint.reporter">{{ complaint.reporter.name }} · </span>{{ formatDate(complaint.createdAt) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3 self-start sm:self-auto">
                <RouterLink class="text-xs font-semibold text-primary-soft hover:text-primary" :to="complaintDetailPath(complaint.id)">Lihat detail</RouterLink>
                <span :class="complaintStatusClass(complaint.status)">{{ complaintStatusLabel(complaint.status) }}</span>
              </div>
            </div>
          </template>
        </div>
      </section>
    </main>
  </div>
</template>
