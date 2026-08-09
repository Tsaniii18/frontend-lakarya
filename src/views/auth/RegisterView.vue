<script setup lang="ts">
import AppLogo from '../../components/AppLogo.vue';
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-background px-5 py-10">
    <div class="w-full max-w-lg">
      <RouterLink class="mb-7 flex justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft" to="/">
        <span class="scale-[1.08]">
          <AppLogo />
        </span>
      </RouterLink>

      <section class="rounded-2xl border border-border bg-surface p-6 shadow-[0_18px_45px_rgba(15,39,71,0.08)] sm:p-8">
        <div>
          <p class="text-sm font-medium text-primary-soft">Portal Karyawan</p>
          <h1 class="mt-2 text-2xl font-semibold text-primary">Buat akun LaKarya</h1>
          <p class="mt-2 text-sm leading-6 text-text-muted">
            Isi data berikut untuk menyiapkan akun karyawan Anda.
          </p>
        </div>

        <form class="mt-7 grid gap-5 sm:grid-cols-2" @submit.prevent>
          <div class="sm:col-span-2">
            <label class="form-label" for="employee-number">Nomor pegawai</label>
            <input id="employee-number" class="form-input" type="text" autocomplete="off" placeholder="Masukkan nomor pegawai" />
          </div>

          <div class="sm:col-span-2">
            <label class="form-label" for="name">Nama lengkap</label>
            <input id="name" class="form-input" type="text" autocomplete="name" placeholder="Masukkan nama lengkap" />
          </div>

          <div class="sm:col-span-2">
            <label class="form-label" for="register-email">Email</label>
            <input id="register-email" class="form-input" type="email" autocomplete="email" placeholder="nama@perusahaan.com" />
          </div>

          <div class="sm:col-span-2">
            <label class="form-label" for="department">Departemen</label>
            <select id="department" class="form-input bg-white">
              <option value="">Pilih departemen</option>
              <option>Human Resources</option>
              <option>Finance</option>
              <option>Information Technology</option>
              <option>Marketing</option>
            </select>
          </div>

          <div>
            <label class="form-label" for="register-password">Password</label>
            <input id="register-password" class="form-input" type="password" autocomplete="new-password" placeholder="Masukkan password" />
          </div>

          <div>
            <label class="form-label" for="repeat-password">Ulangi password</label>
            <input id="repeat-password" class="form-input" type="password" autocomplete="new-password" placeholder="Ulangi password" />
          </div>

          <button class="primary-button w-full sm:col-span-2" type="submit">Daftar</button>
        </form>
      </section>

      <p class="mt-6 text-center text-sm text-text-muted">
        Sudah punya akun?
        <RouterLink class="font-medium text-primary-soft hover:text-primary hover:underline" to="/masuk">Masuk</RouterLink>.
      </p>
    </div>
  </main>
</template>
