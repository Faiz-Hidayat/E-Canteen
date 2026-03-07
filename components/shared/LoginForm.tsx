"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { playfulToast } from "@/lib/toast";

import { LoginSchema, type LoginInput } from "@/lib/validations/auth.schema";
import { loginUser } from "@/actions/auth.actions";

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

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    const result = await loginUser(values);

    if (result.success) {
      playfulToast.success("Berhasil masuk! Selamat datang kembali 👋");

      // Redirect based on role
      const role = result.role;
      if (role === "SUPER_ADMIN") {
        router.push("/super-admin");
      } else if (role === "ADMIN") {
        router.push("/admin/queue");
      } else {
        router.push("/menu");
      }
      router.refresh();
    } else {
      playfulToast.error(result.error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    placeholder="Masukkan password"
                    autoComplete="current-password"
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
              <LogIn className="size-4" />
              Masuk
            </>
          )}
        </Button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-[#A3A3A3]">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-medium text-[#FFB26B] hover:text-[#E5994F] transition-colors"
        >
          Daftar di sini
        </Link>
      </p>
    </Form>
  );
}
