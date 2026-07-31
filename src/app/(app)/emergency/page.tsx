"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaHospital,
  FaLocationCrosshairs,
  FaPhone,
  FaTowerBroadcast,
  FaTruckMedical,
  FaUserShield,
  FaUsers,
} from "react-icons/fa6";
import { emergencyApi } from "@/api/endpoints";
import { Badge, Button, Card, Loader, Modal, SectionTitle, StatTile } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { fromNow, titleCase } from "@/utils/helpers";
import type { EmergencyContactRow } from "@/utils/types";

const GROUPS: { key: string; label: string; icon: React.ReactNode; tone: string }[] = [
  { key: "hospital", label: "Hospital", icon: <FaHospital />, tone: "success" },
  { key: "police", label: "Police", icon: <FaUserShield />, tone: "primary" },
  { key: "ambulance", label: "Ambulance", icon: <FaTruckMedical />, tone: "warning" },
  { key: "family", label: "Family contacts", icon: <FaUsers />, tone: "danger" },
];

export default function EmergencyCenterPage() {
  const { data, loading, refetch } = useApi(() => emergencyApi.center(), { pollMs: 12000 });
  const [confirmSos, setConfirmSos] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Loader label="Linking emergency gateway" />;

  const act = async (action: string, service?: string) => {
    setBusy(true);
    try {
      await emergencyApi.trigger({
        action,
        service,
        accidentId: data?.activeIncident?.id,
        vehicleId: data?.activeIncident?.vehicleId,
      });
      toast.success(
        action === "sos"
          ? "SOS broadcast transmitted to all responders"
          : action === "share"
            ? "Live location shared with responders"
            : action === "notify"
              ? "Emergency contacts notified"
              : `${titleCase(service ?? "unit")} contacted`,
      );
      void refetch();
    } catch {
      toast.error("Emergency gateway unreachable — retrying on failover");
    } finally {
      setBusy(false);
      setConfirmSos(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="m-0 text-xl font-semibold tracking-tight">Emergency center</h1>
        <p className="m-0 mt-1 text-sm text-muted">Autonomous dispatch grid for hospitals, police, ambulances and family.</p>
      </div>

      {data?.activeIncident ? (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass neon-ring border-[rgba(251,113,133,0.4)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge tone="danger">
                <FaTowerBroadcast /> Active incident
              </Badge>
              <h2 className="mono m-0 mt-2 text-lg font-semibold">{data.activeIncident.code}</h2>
              <p className="m-0 text-sm text-muted">{data.activeIncident.address}</p>
              <p className="m-0 mt-1 text-xs text-muted">
                {data.activeIncident.vehicle?.vehicleNumber} · detected {fromNow(data.activeIncident.detectedAt)}
              </p>
            </div>
            <Link href={`/accidents/${data.activeIncident.id}`} className="btn btn-ghost no-underline">
              Open incident file
            </Link>
          </div>
        </motion.div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Active incidents" value={data?.stats.activeIncidents ?? 0} icon={<FaTowerBroadcast />} tone="danger" />
        <StatTile label="Units en route" value={data?.stats.unitsEnRoute ?? 0} icon={<FaTruckMedical />} tone="warning" delay={0.05} />
        <StatTile label="Average ETA" value={data?.stats.avgEtaMin ?? 0} unit="min" icon={<FaLocationCrosshairs />} delay={0.1} />
        <StatTile label="Contacts reachable" value={data?.stats.contactsReachable ?? 0} icon={<FaPhone />} tone="success" delay={0.15} />
      </section>

      <Card>
        <SectionTitle title="Rapid actions" subtitle="One-tap response protocol" icon={<FaTowerBroadcast />} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Button variant="danger" disabled={busy} onClick={() => setConfirmSos(true)}>
            <FaTowerBroadcast /> Send SOS
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => void act("share")}>
            <FaLocationCrosshairs /> Share location
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => void act("call", "ambulance")}>
            <FaPhone /> Call emergency
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => void act("notify")}>
            <FaUsers /> Notify contacts
          </Button>
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {GROUPS.map((group, index) => {
          const contacts = (data?.responseGrid?.[group.key] ?? []) as EmergencyContactRow[];
          return (
            <motion.div
              key={group.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="glass glass-hover p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-lg text-[var(--aas-accent)]">
                  {group.icon}
                </span>
                <Badge tone={group.tone}>{contacts.length}</Badge>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{group.label}</h3>
              <ul className="m-0 mt-2 space-y-2 p-0">
                {contacts.slice(0, 3).map((contact) => (
                  <li key={contact.id} className="list-none border-b border-white/5 pb-2 last:border-0">
                    <p className="m-0 truncate text-xs font-medium">{contact.name}</p>
                    <p className="mono m-0 text-[0.62rem] text-muted">{contact.phone}</p>
                    {contact.etaMin ? <p className="m-0 text-[0.62rem] text-[var(--aas-accent)]">ETA {contact.etaMin} min</p> : null}
                  </li>
                ))}
              </ul>
              <button
                className="btn btn-ghost mt-3 w-full !min-h-9 !text-xs"
                disabled={busy}
                onClick={() => void act("call", group.key)}
              >
                Contact {group.label.toLowerCase()}
              </button>
            </motion.div>
          );
        })}
      </section>

      <Card delay={0.1}>
        <SectionTitle title="Dispatch log" subtitle="Recent emergency transmissions" icon={<FaTruckMedical />} />
        <ul className="m-0 space-y-2 p-0">
          {(data?.dispatches ?? []).map((dispatch) => (
            <li key={dispatch.id} className="glass-soft flex list-none flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{titleCase(dispatch.service)}</span>
                <span className="block truncate text-xs text-muted">{dispatch.notes}</span>
              </span>
              <span className="flex items-center gap-2">
                <Badge tone={dispatch.status === "en_route" ? "warning" : "success"}>{titleCase(dispatch.status)}</Badge>
                <span className="text-[0.65rem] text-muted">{fromNow(dispatch.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={confirmSos}
        title="Confirm SOS broadcast"
        tone="critical"
        onClose={() => setConfirmSos(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmSos(false)}>Cancel</Button>
            <Button variant="danger" disabled={busy} onClick={() => void act("sos")}>
              Transmit SOS now
            </Button>
          </>
        }
      >
        <p className="m-0 text-sm text-muted">
          This transmits vehicle identity, live GPS, driver vitals and impact telemetry to the regional emergency
          gateway. Hospitals, police and registered family contacts are notified simultaneously.
        </p>
      </Modal>
    </div>
  );
}
