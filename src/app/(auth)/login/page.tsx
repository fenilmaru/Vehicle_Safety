"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaArrowRight, FaEnvelope, FaFingerprint, FaLock, FaFaceSmile } from "react-icons/fa6";
import { Button } from "@/components/ui/Primitives";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_CREDENTIALS } from "@/utils/constants";
import { HttpError } from "@/api/httpClient";

type FormValues = { identifier: string; password: string };

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { identifier: "", password: "" } });

      const onSubmit = handleSubmit(async (values) => {
        setSubmitting(true);
        try {
          const user = await login(values.identifier, values.password);
          toast.success(`Welcome back, ${user.fullName.split(" ")[0]}`);
          // Force navigation to dashboard using window.location to bypass any middleware race conditions
          const next = params.get("next") ?? "/dashboard";
          setTimeout(() => {
            window.location.href = next;
          }, 100);
        } catch (error) {
          const message = error instanceof HttpError ? error.message : "Unable to sign in";
          toast.error(message);
          setSubmitting(false);
        }
      });

  return (
    <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass p-7">
      <h1 className="m-0 text-2xl font-semibold tracking-tight">Operator sign in</h1>
      <p className="mt-1 text-sm text-muted">Authenticate to enter the autonomous command grid.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label className="label" htmlFor="identifier">Email or username</label>
          <div className="relative">
            <FaEnvelope aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="identifier"
              className="field pl-9"
              autoComplete="username"
              aria-invalid={Boolean(errors.identifier)}
              placeholder="commander@aas.ai"
              {...register("identifier", { required: "Email or username is required" })}
            />
          </div>
          {errors.identifier ? <p className="mt-1 text-xs text-[var(--aas-danger)]">{errors.identifier.message}</p> : null}
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <FaLock aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="password"
              type="password"
              className="field pl-9"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              placeholder="••••••••"
              {...register("password", { required: "Password is required", minLength: { value: 6, message: "Minimum 6 characters" } })}
            />
          </div>
          {errors.password ? <p className="mt-1 text-xs text-[var(--aas-danger)]">{errors.password.message}</p> : null}
        </div>

        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            className="text-[var(--aas-accent)] underline-offset-4 hover:underline"
            onClick={() => {
              setValue("identifier", DEMO_CREDENTIALS.identifier);
              setValue("password", DEMO_CREDENTIALS.password);
            }}
          >
            Use demo operator
          </button>
          <Link href="/forgot-password" className="text-muted no-underline hover:text-[var(--aas-accent)]">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Authenticating…" : "Sign in"} <FaArrowRight />
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-muted">
        <span className="h-px flex-1 bg-white/10" /> Biometric <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/verify-face" className="btn btn-ghost no-underline">
          <FaFaceSmile /> Face
        </Link>
        <Link href="/verify-fingerprint" className="btn btn-ghost no-underline">
          <FaFingerprint /> Print
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        New operator?{" "}
        <Link href="/register" className="text-[var(--aas-accent)] no-underline">
          Register access
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[520px]" />}>
      <LoginForm />
    </Suspense>
  );
}
