<script setup lang="ts">
withDefaults(
  defineProps<{
    mode?: 'default' | 'inverse' | 'compact';
  }>(),
  {
    mode: 'default',
  },
);
</script>

<template>
  <span
    v-if="mode === 'compact'"
    class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold tracking-tight text-white"
    aria-label="LaKarya"
  >
    LK
  </span>
  <span
    v-else
    class="inline-flex items-center text-xl font-semibold tracking-[-0.035em]"
    :class="mode === 'inverse' ? 'text-brand-light' : 'text-primary'"
    aria-label="LaKarya"
  >
    <span
      class="inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-white"
      :class="mode === 'inverse' ? 'bg-white/14' : 'bg-primary'"
    >L</span>
    <span>a</span>
    <span
      class="ml-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-white"
      :class="mode === 'inverse' ? 'bg-white/14' : 'bg-primary'"
    >K</span>
    <span>arya</span>
  </span>
</template>

