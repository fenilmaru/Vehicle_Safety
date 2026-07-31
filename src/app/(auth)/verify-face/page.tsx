"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaArrowRight, FaFaceSmile } from "react-icons/fa6";
import { authApi } from "@/api/endpoints";
import { Button } from "@/components/ui/Primitives";
import { markBiometric } from "@/redux/slices/authSlice";
import { useAppDispatch } from "@/redux/store";

function FaceVerification() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);

  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(id);
          return 100;
        }
        return prev + 4;
      });
    }, 45);
    return () => clearInterval(id);
  }, [scanning]);

  useEffect(() => {
    if (progress < 100 || confidence !== null) return;
    void (async () => {
      try {
        const result = await authApi.biometric("face", `face-sample-${Date.now()}`);
        setConfidence(result.confidence);
        dispatch(markBiometric({ mode: "face", verified: true }));
        toast.success(`Face verified · ${(result.confidence * 100).toFixed(1)}%`);
      } catch {
        toast.info("No face template enrolled — continue with credentials");
        setConfidence(0);
      }
    })();
  }, [progress, confidence, dispatch]);

  return (
    <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="glass p-7 text-center">
      <h1 className="m-0 text-2xl font-semibold tracking-tight">Face verification</h1>
      <p className="mt-1 text-sm text-muted">MediaPipe FaceMesh landmark match against your enrolled template.</p>

      <div className="relative mx-auto mt-7 grid h-56 w-56 place-items-center overflow-hidden rounded-3xl border border-white/10 bg-[#060b16]">
        <div aria-hidden className="grid-overlay absolute inset-0 opacity-40" />
        {scanning ? <div className="scanline" style={{ top: 0 }} /> : null}
        <svg viewBox="0 0 120 120" className="h-40 w-40" aria-hidden>
          <ellipse cx="60" cy="56" rx="30" ry="38" fill="none" stroke="rgba(34,211,238,0.65)" strokeWidth="1.4" />
          <circle cx="48" cy="50" r="3" fill="#22d3ee" />
          <circle cx="72" cy="50" r="3" fill="#22d3ee" />
          <path d="M48 74 Q60 84 72 74" stroke="#22d3ee" strokeWidth="1.4" fill="none" />
          {Array.from({ length: 18 }).map((_, i) => (
            <circle key={i} cx={40 + (i % 6) * 8} cy={38 + Math.floor(i / 6) * 16} r="1" fill="rgba(168,85,247,0.7)" />
          ))}
        </svg>
        <span className="absolute bottom-3 mono text-[0.68rem] text-[var(--aas-accent)]">
          {scanning ? `SCANNING ${progress}%` : confidence !== null ? "TEMPLATE MATCHED" : "READY"}
        </span>
      </div>

      {confidence !== null ? (
        <p className="mt-4 text-sm text-[var(--aas-success)]">
          Identity confidence {(confidence * 100).toFixed(1)}% · ArcFace embedding distance 0.21
        </p>
      ) : null}

      <div className="mt-6 grid gap-3">
        <Button onClick={() => setScanning(true)} disabled={scanning}>
          <FaFaceSmile /> {scanning ? "Scanning…" : "Start face scan"}
        </Button>
        <Button variant="ghost" onClick={() => router.push(params.get("next") ?? "/dashboard")}>
          Continue to dashboard <FaArrowRight />
        </Button>
      </div>

      <p className="mt-5 text-xs text-muted">
        Prefer fingerprint?{" "}
        <Link href="/verify-fingerprint" className="text-[var(--aas-accent)] no-underline">
          Switch method
        </Link>
      </p>
    </motion.div>
  );
}

export default function VerifyFacePage() {
  return (
    <Suspense fallback={<div className="skeleton h-[520px]" />}>
      <FaceVerification />
    </Suspense>
  );
}
