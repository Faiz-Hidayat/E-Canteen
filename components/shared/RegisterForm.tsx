"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { playfulToast } from "@/lib/toast";

import {
  RegisterSchema,
  type RegisterInput,
} from "@/lib/validations/auth.schema";
import { registerUser } from "@/actions/auth.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterInput) {
    const result = await registerUser(values);

    if (result.success) {
      playfulToast.success("Akun berhasil dibuat! Silakan masuk ya. 🎉");
      router.push("/login");
    } else {
      playfulToast.error(result.error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Nama */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  autoComplete="name"
                  className="h-11 rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="h-11 rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    autoComplete="new-password"
                    className="h-11 rounded-xl pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#333333] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Konfirmasi Password */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konfirmasi Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    autoComplete="new-password"
                    className="h-11 rounded-xl pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#333333] transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-11 w-full rounded-xl bg-[#FFB26B] text-white shadow-[0_8px_30px_rgba(255,178,107,0.15)] hover:bg-[#E5994F] active:scale-[0.98] transition-all"
        >
          {form.formState.isSubmitting ? (
            "Memproses..."
          ) : (
            <>
              <UserPlus className="size-4" />
              Daftar
            </>
          )}
        </Button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-[#A3A3A3]">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-medium text-[#FFB26B] hover:text-[#E5994F] transition-colors"
        >
          Masuk di sini
        </Link>
      </p>
    </Form>
  );
}
