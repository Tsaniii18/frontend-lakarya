<script setup lang="ts">
defineProps<{
  colspan: number;
  loading?: boolean;
  loadingText?: string;
  title?: string;
  description?: string;
  icon?: 'document' | 'people' | 'complaint';
}>();
</script>

<template>
  <tr class="data-state-row">
    <td :colspan="colspan" class="px-5 py-12 text-center">
      <div v-if="loading" class="inline-flex items-center gap-3 text-sm text-text-muted" role="status">
        <span class="h-4 w-4 animate-spin rounded-full border-2 border-border-strong border-t-primary-soft"></span>
        {{ loadingText ?? 'Memuat data...' }}
      </div>
      <div v-else class="mx-auto flex max-w-sm flex-col items-center">
        <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9f0f7] text-primary-soft">
          <svg v-if="icon === 'people'" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.5-3.5 2.4-5.5 5.5-5.5s5 2 5.5 5.5M16 6.5a3 3 0 0 1 0 5.8M17 14c2 .6 3.1 2.2 3.5 5" /></svg>
          <svg v-else-if="icon === 'complaint'" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 18.5 3.5 21l4-1.2a9 9 0 1 0-2.5-1.3Z" /><path d="m9 12 2 2 4-4" /></svg>
          <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M7 3v3M17 3v3M4 9h16" /><rect x="4" y="5" width="16" height="15" rx="2" /><path d="m9 14 2 2 4-4" /></svg>
        </span>
        <p class="mt-3 text-sm font-semibold text-primary">{{ title }}</p>
        <p class="mt-1 text-xs leading-5 text-text-muted">{{ description }}</p>
      </div>
    </td>
  </tr>
</template>
