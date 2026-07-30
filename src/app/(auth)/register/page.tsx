"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaCamera, FaCheck, FaFingerprint, FaArrowRight } from "react-icons/fa6";
import { Button } from "@/components/ui/Primitives";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/utils/constants";
import { passwordStrength, validators } from "@/utils/validators";
import { HttpError } from "@/api/httpClient";

type FormValues = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  mobile: string;
  role: string;
  vehicleNumber: string;
};

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [fingerprintCaptured, setFingerprintCaptured] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { role: "driver", vehicleNumber: "", fullName: "", username: "", email: "", mobile: "" },
  });

  const password = watch("password") ?? "";
  const strength = passwordStrength(password);

  const onSubmit = handleSubmit(async (values) => {
    if (values.password !== values.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await registerUser({ ...values, faceCaptured, fingerprintCaptured, avatarUrl: "" });
      toast.success("Operator profile provisioned");
      router.push(faceCaptured ? "/verify-face?next=/dashboard" : "/dashboard");
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "Registration failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="glass p-7">
      <h1 className="m-0 text-2xl font-semibold tracking-tight">Register operator</h1>
      <p className="mt-1 text-sm text-muted">Provision credentials, vehicle assignment and biometric templates.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="fullName">Full name</label>
            <input id="fullName" className="field" placeholder="Aarav Mehta" {...register("fullName", validators.required("Full name"))} />
            {errors.fullName ? <p className="mt-1 text-xs text-[var(--aas-danger)]">{errors.fullName.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="username">Username</label>
            <input id="username" className="field" placeholder="operator.name" {...register("username", validators.username)} />
            {errors.username ? <p className="mt-1 text-xs text-[var(--aas-danger)]">{errors.username.message}</p> : null}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="field" placeholder="operator@fleet.ai" {...register("email", validators.email)} />
          {errors.email ? <p className="mt-1 text-xs text-[var(--aas-danger)]">{errors.email.message}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="field" {...register("password", validators.password)} />
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${strength.score}%`,
                  background: strength.score >= 75 ? "#34d399" : strength.score >= 50 ? "#fbbf24" : "#fb7185",
                }}
              />
            </div>
            <p className="mt-1 text-[0.7rem] text-muted">{password ? strength.label : "Minimum 8 characters"}</p>
          </div>
          <div>
            <label className="label" htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" type="password" className="field" {...register("confirmPassword", validators.password)} />
            {errors.confirmPassword ? <p className="mt-1 text-xs text-[var(--aas-danger)]">{errors.confirmPassword.message}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="mobile">Mobile number</label>
            <input id="mobile" className="field" placeholder="+91 98450 11223" {...register("mobile", validators.mobile)} />
            {errors.mobile ? <p className="mt-1 text-xs text-[var(--aas-danger)]">{errors.mobile.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="role">Operator role</label>
            <select id="role" className="field" {...register("role")}>
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="vehicleNumber">Vehicle number</label>
            <input id="vehicleNumber" className="field" placeholder="AAS-07-KA-2201" {...register("vehicleNumber")} />
          </div>
          <div>
            <label className="label" htmlFor="photo">Profile photo</label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              className="field !py-2 text-xs"
              onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? "")}
            />
            {photoName ? <p className="mt-1 truncate text-[0.7rem] text-muted">{photoName}</p> : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setFaceCaptured(true)}
            className={`btn ${faceCaptured ? "btn-primary" : "btn-ghost"}`}
            aria-pressed={faceCaptured}
          >
            {faceCaptured ? <FaCheck /> : <FaCamera />} {faceCaptured ? "Face captured" : "Capture face"}
          </button>
          <button
            type="button"
            onClick={() => setFingerprintCaptured(true)}
            className={`btn ${fingerprintCaptured ? "btn-primary" : "btn-ghost"}`}
            aria-pressed={fingerprintCaptured}
          >
            {fingerprintCaptured ? <FaCheck /> : <FaFingerprint />} {fingerprintCaptured ? "Print enrolled" : "Register fingerprint"}
          </button>
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Provisioning…" : "Create operator"} <FaArrowRight />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already provisioned?{" "}
        <Link href="/login" className="text-[var(--aas-accent)] no-underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
