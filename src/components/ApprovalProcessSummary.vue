<script setup lang="ts">
type ApprovalStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
type RequestStatus = ApprovalStatus | 'DIBATALKAN';

interface ApprovalStep {
  id: number;
  status: ApprovalStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  approver: {
    department: { name: string };
  };
}

const props = defineProps<{
  requestStatus: RequestStatus;
  approvals: ApprovalStep[];
}>();

function statusLabel(value: ApprovalStatus) {
  return {
    MENUNGGU: 'Menunggu',
    DISETUJUI: 'Disetujui',
    DITOLAK: 'Ditolak',
  }[value];
}

function approverLabel(department: string) {
  if (department === 'Human Resources') return 'HR Manager';
  if (department === 'Finance') return 'Finance Manager';
  return `Manager ${department}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
</script>

<template>
  <div class="mt-6 border-t border-border pt-5">
    <h3 class="text-sm font-semibold text-primary">Proses Persetujuan</h3>
    <p v-if="approvals.length === 0" class="mt-3 text-sm leading-6 text-text-muted">
      {{ props.requestStatus === 'DISETUJUI' ? 'Pengajuan disetujui otomatis.' : 'Belum ada tahapan persetujuan.' }}
    </p>
    <ol v-else class="mt-4">
      <li
        v-for="(step, index) in approvals"
        :key="step.id"
        class="relative flex gap-3 pb-6 last:pb-0"
      >
        <span
          v-if="index < approvals.length - 1"
          class="absolute left-[9px] top-5 h-full w-px bg-border"
        ></span>
        <span
          class="relative z-10 mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold"
          :class="step.status === 'DISETUJUI' ? 'border-success bg-success text-white' : step.status === 'DITOLAK' ? 'border-danger bg-danger text-white' : 'border-primary-soft bg-white text-primary-soft'"
        >
          {{ step.status === 'DISETUJUI' ? '✓' : step.status === 'DITOLAK' ? '×' : '○' }}
        </span>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-primary">{{ approverLabel(step.approver.department.name) }}</p>
          <p
            class="mt-1 text-xs"
            :class="step.status === 'DISETUJUI' ? 'text-success' : step.status === 'DITOLAK' ? 'text-danger' : 'text-text-muted'"
          >
            {{ statusLabel(step.status) }}<span v-if="step.reviewedAt"> · {{ formatDateTime(step.reviewedAt) }}</span>
          </p>
          <p v-if="step.reviewNote" class="mt-2 break-words text-xs leading-5 text-text-muted">“{{ step.reviewNote }}”</p>
        </div>
      </li>
    </ol>
  </div>
</template>
