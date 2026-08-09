<script setup lang="ts">
import AppLogo from '../../components/AppLogo.vue';
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-background px-5 py-12">
    <div class="w-full max-w-md">
      <RouterLink class="mb-8 flex justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft" to="/">
        <span class="scale-[1.08]">
          <AppLogo />
        </span>
      </RouterLink>

      <section class="rounded-2xl border border-border bg-surface p-6 shadow-[0_18px_45px_rgba(15,39,71,0.08)] sm:p-8">
        <div>
          <p class="text-sm font-medium text-primary-soft">Portal Karyawan</p>
          <h1 class="mt-2 text-2xl font-semibold text-primary">Masuk ke LaKarya</h1>
          <p class="mt-2 text-sm leading-6 text-text-muted">
            Gunakan akun karyawan Anda untuk masuk ke portal.
          </p>
        </div>

        <form class="mt-7 space-y-5" @submit.prevent>
          <div>
            <label class="form-label" for="email">Email</label>
            <input id="email" class="form-input" type="email" autocomplete="email" placeholder="nama@perusahaan.com" />
          </div>

          <div>
            <label class="form-label" for="password">Password</label>
            <input id="password" class="form-input" type="password" autocomplete="current-password" placeholder="Masukkan password" />
          </div>

          <button class="primary-button w-full" type="submit">Masuk</button>
        </form>
      </section>

      <p class="mt-6 text-center text-sm text-text-muted">
        Belum punya akun?
        <RouterLink class="font-medium text-primary-soft hover:text-primary hover:underline" to="/daftar">Daftar</RouterLink>.
      </p>
    </div>
  </main>
</template>
