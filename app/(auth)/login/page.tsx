import { LoginForm } from '@/components/shared/LoginForm';

export default function LoginPage() {
  return (
    <div>
      <h2 className="mb-1 text-center text-xl font-bold text-[#333333]">Masuk ke Kantin 40</h2>
      <p className="mb-6 text-center text-sm text-[#A3A3A3]">Masukkan email dan password kamu</p>
      <LoginForm />
    </div>
  );
}
