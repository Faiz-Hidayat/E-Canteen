import { RegisterForm } from '@/components/shared/RegisterForm';

export default function RegisterPage() {
  return (
    <div>
      <h2 className="mb-1 text-center text-xl font-bold text-[#333333]">Daftar Akun Kantin 40</h2>
      <p className="mb-6 text-center text-sm text-[#A3A3A3]">Buat akun baru untuk mulai pesan makanan</p>
      <RegisterForm />
    </div>
  );
}
