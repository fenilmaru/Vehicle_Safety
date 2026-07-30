"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaEnvelope, FaShieldHalved } from "react-icons/fa6";
import { authApi } from "@/api/endpoints";
import { Button } from "@/components/ui/Primitives";
import { validators } from "@/utils/validators";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>();

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await authApi.forgotPassword(values.email);
      setSent(true);
      toast.success(result.hint);
    } catch {
      toast.error("Recovery service unavailable, try again");
    }
  });

  return (
    <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="glass p-7">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-xl text-[var(--aas-accent)]">
        <FaShieldHalved />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Recover access</h1>
      <p className="mt-1 text-sm text-muted">
        We will dispatch a signed recovery link to the registered operator mailbox. The link expires in 20 minutes.
      </p>

      {sent ? (
        <div className="mt-6 rounded-2xl border border-[rgba(52,211,153,0.35)] bg-[rgba(52,211,153,0.08)] p-4 text-sm">
          <p className="m-0 font-medium text-[var(--aas-success)]">Recovery dispatched</p>
          <p className="m-0 mt-1 text-muted">
            If an operator account matches that address, the reset link is on its way. Check spam folders as well.
          </p>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <label className="label" htmlFor="email">Registered email</label>
            <div className="relative">
              <FaEnvelope aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input id="email" type="email" className="field pl-9" placeholder="operator@fleet.ai" {...register("email", validators.email)} />
            </div>
            {errors.email ? <p className="mt-1 text-xs text-[var(--aas-danger)]">{errors.email.message}</p> : null}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Dispatching…" : "Send recovery link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="text-[var(--aas-accent)] no-underline">
          Back to sign in
        </Link>
      </p>
    </motion.div>
  );
}
