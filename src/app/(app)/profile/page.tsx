"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaCarSide, FaCheck, FaFaceSmile, FaFingerprint, FaIdBadge, FaShieldHalved } from "react-icons/fa6";
import { authApi } from "@/api/endpoints";
import { Badge, Button, Card, Loader, MeterBar, SectionTitle } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, initials, titleCase } from "@/utils/helpers";

export default function ProfilePage() {
  const { refresh } = useAuth();
  const { data, loading } = useApi(() => authApi.me());
  const [form, setForm] = useState({ fullName: "", mobile: "", vehicleNumber: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.user) {
      setForm({ fullName: data.user.fullName, mobile: data.user.mobile, vehicleNumber: data.user.vehicleNumber });
    }
  }, [data]);

  if (loading || !data) return <Loader label="Loading operator identity" />;
  const user = data.user;

  const save = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      toast.success("Operator profile updated");
      refresh();
    } catch {
      toast.error("Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const enroll = async (mode: "face" | "fingerprint") => {
    try {
      await authApi.biometric(mode, `enroll-${Date.now()}`, true);
      toast.success(`${titleCase(mode)} template enrolled`);
      refresh();
    } catch {
      toast.error("Biometric enclave unavailable");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="m-0 text-xl font-semibold tracking-tight">User profile</h1>
        <p className="m-0 mt-1 text-sm text-muted">Identity, biometrics and assigned vehicles.</p>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-[var(--aas-accent)] to-[var(--aas-accent-2)] text-lg font-black text-[var(--aas-on-accent)]">
              {initials(user.fullName)}
            </span>
            <div className="min-w-0">
              <h2 className="m-0 truncate text-lg font-semibold">{user.fullName}</h2>
              <p className="m-0 truncate text-sm text-muted">@{user.username} · {titleCase(user.role)}</p>
              <p className="m-0 truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <MeterBar label="Operator safety score" value={user.safetyScore} tone="success" />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="glass-soft p-3">
                <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">Member since</p>
                <p className="m-0 text-sm">{formatDate(user.createdAt)}</p>
              </div>
              <div className="glass-soft p-3">
                <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">Last login</p>
                <p className="m-0 text-sm">{formatDate(user.lastLoginAt, "DD MMM · HH:mm")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={user.faceEnrolled ? "success" : "amber"}>
                <FaFaceSmile /> {user.faceEnrolled ? "Face enrolled" : "Face missing"}
              </Badge>
              <Badge tone={user.fingerprintEnrolled ? "success" : "amber"}>
                <FaFingerprint /> {user.fingerprintEnrolled ? "Print enrolled" : "Print missing"}
              </Badge>
              <Badge tone="primary">
                <FaShieldHalved /> JWT session active
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => void enroll("face")}>
                <FaFaceSmile /> Re-enroll face
              </Button>
              <Button variant="ghost" onClick={() => void enroll("fingerprint")}>
                <FaFingerprint /> Re-enroll print
              </Button>
            </div>
          </div>
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="Edit identity" subtitle="Operator contact record" icon={<FaIdBadge />} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="fullName">Full name</label>
              <input id="fullName" className="field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="mobile">Mobile</label>
              <input id="mobile" className="field" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="vehicleNumber">Primary vehicle</label>
              <input id="vehicleNumber" className="field" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
            </div>
          </div>
          <Button className="mt-4" onClick={() => void save()} disabled={saving}>
            <FaCheck /> {saving ? "Saving…" : "Save profile"}
          </Button>
        </Card>
      </section>

      <Card delay={0.1}>
        <SectionTitle title="Assigned vehicles" subtitle="Nodes linked to this operator" icon={<FaCarSide />} />
        {data.vehicles.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.vehicles.map((vehicle) => (
              <div key={vehicle.id} className="glass-soft p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{vehicle.vehicleNumber}</span>
                  <Badge tone={vehicle.status === "online" ? "success" : "amber"}>{titleCase(vehicle.status)}</Badge>
                </div>
                <p className="m-0 mt-1 text-xs text-muted">{vehicle.manufacturer} {vehicle.model}</p>
                <MeterBar value={vehicle.safetyScore} tone="success" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No vehicles are currently assigned to this operator.</p>
        )}
      </Card>
    </div>
  );
}
