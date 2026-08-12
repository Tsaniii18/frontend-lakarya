<script setup lang="ts">
defineProps<{
  icon: 'request' | 'complaint';
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface-soft px-5 py-8 text-center">
    <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9f0f7] text-primary-soft">
      <svg v-if="icon === 'request'" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
        <path d="M7 3v3M17 3v3M4 9h16" />
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="m9 14 2 2 4-4" />
      </svg>
      <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
        <path d="M5 18.5 3.5 21l4-1.2a9 9 0 1 0-2.5-1.3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </span>
    <p class="mt-3 text-sm font-semibold text-primary">{{ title }}</p>
    <p class="mt-1 max-w-sm text-xs leading-5 text-text-muted">{{ description }}</p>
  </div>
</template>
