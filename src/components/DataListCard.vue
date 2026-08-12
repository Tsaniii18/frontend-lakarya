<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  count: number;
  countLabel: string;
}>();
</script>

<template>
  <section class="data-card shadow-[0_8px_28px_rgba(15,39,71,0.04)]">
    <div class="data-card-heading">
      <div>
        <h2 class="text-base font-semibold text-primary">{{ title }}</h2>
        <p class="mt-1 text-sm leading-6 text-text-muted">{{ description }}</p>
      </div>
      <span class="data-count">{{ count }} {{ countLabel }}</span>
    </div>
    <div v-if="$slots.scope" class="mt-5">
      <slot name="scope" />
    </div>
    <div v-if="$slots.filters" class="mt-5 rounded-xl border border-border bg-surface-soft p-4">
      <slot name="filters" />
    </div>
    <slot />
    <slot name="pagination" />
  </section>
</template>
