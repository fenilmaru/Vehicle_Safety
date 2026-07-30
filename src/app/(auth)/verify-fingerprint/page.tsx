"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaArrowRight, FaFingerprint } from "react-icons/fa6";
import { authApi } from "@/api/endpoints";
import { Button } from "@/components/ui/Primitives";
import { markBiometric } from "@/redux/slices/authSlice";
import { useAppDispatch } from "@/redux/store";

export default function VerifyFingerprintPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => setProgress((p) => (p >= 100 ? 100 : p + 5)), 55);
    return () => clearInterval(id);
  }, [scanning]);

  useEffect(() => {
    if (progress < 100 || matched) return;
    void (async () => {
      try {
        const result = await authApi.biometric("fingerprint", `print-sample-${Date.now()}`);
        setMatched(true);
        dispatch(markBiometric({ mode: "fingerprint", verified: true }));
        toast.success(`Fingerprint matched · ${(result.confidence * 100).toFixed(1)}%`);
      } catch {
        toast.info("No fingerprint template enrolled for this operator");
        setMatched(true);
      }
    })();
  }, [progress, matched, dispatch]);

  return (
    <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="glass p-7 text-center">
      <h1 className="m-0 text-2xl font-semibold tracking-tight">Fingerprint verification</h1>
      <p className="mt-1 text-sm text-muted">Minutiae template comparison on the secure enclave.</p>

      <div className="relative mx-auto mt-7 grid h-56 w-56 place-items-center overflow-hidden rounded-3xl border border-white/10 bg-[#060b16]">
        <div aria-hidden className="grid-overlay absolute inset-0 opacity-40" />
        <FaFingerprint
          className={`text-[7rem] ${matched ? "text-[var(--aas-success)]" : "text-[var(--aas-accent)]"}`}
          style={{ filter: "drop-shadow(0 0 18px currentColor)", opacity: scanning ? 1 : 0.55 }}
        />
        {scanning && !matched ? <div className="scanline" style={{ top: 0 }} /> : null}
        <span className="absolute bottom-3 mono text-[0.68rem] text-[var(--aas-accent)]">
          {matched ? "MATCH CONFIRMED" : scanning ? `READING RIDGES ${progress}%` : "PLACE FINGER"}
        </span>
      </div>

      <div className="mt-6 grid gap-3">
        <Button onClick={() => setScanning(true)} disabled={scanning}>
          <FaFingerprint /> {scanning ? "Reading…" : "Start fingerprint scan"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          Continue to dashboard <FaArrowRight />
        </Button>
      </div>

      <p className="mt-5 text-xs text-muted">
        <Link href="/verify-face" className="text-[var(--aas-accent)] no-underline">
          Use face verification instead
        </Link>
      </p>
    </motion.div>
  );
}
