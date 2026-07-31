"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaCarSide, FaMagnifyingGlass, FaPen, FaPlus, FaTrash } from "react-icons/fa6";
import { vehicleApi } from "@/api/endpoints";
import { Badge, Button, Card, EmptyState, Loader, MeterBar, Modal, SectionTitle } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { debounce, fromNow, statusTone, titleCase } from "@/utils/helpers";
import type { VehicleWithDriver } from "@/utils/types";

type FormState = {
  id?: number;
  vehicleNumber: string;
  model: string;
  manufacturer: string;
  vehicleType: string;
  status: string;
  autonomyLevel: number;
  safetyScore: number;
};

const EMPTY_FORM: FormState = {
  vehicleNumber: "",
  model: "",
  manufacturer: "",
  vehicleType: "sedan",
  status: "online",
  autonomyLevel: 3,
  safetyScore: 90,
};

export default function VehiclesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const { data, loading, refetch } = useApi(() => vehicleApi.list({ q: query, status: statusFilter }), {
    pollMs: 25000,
    deps: [query, statusFilter],
  });

  const onSearch = useMemo(() => debounce((value: string) => setQuery(value), 350), []);

  const save = async () => {
    try {
      if (form.id) {
        await vehicleApi.update(form.id, { ...form });
        toast.success(`${form.vehicleNumber} updated`);
      } else {
        await vehicleApi.create({ ...form });
        toast.success(`${form.vehicleNumber} added to fleet`);
      }
      setModalOpen(false);
      setForm(EMPTY_FORM);
      void refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    }
  };

  const remove = async (vehicle: VehicleWithDriver) => {
    if (!confirm(`Decommission ${vehicle.vehicleNumber}?`)) return;
    try {
      await vehicleApi.remove(vehicle.id);
      toast.success("Vehicle removed from grid");
      void refetch();
    } catch {
      toast.error("Unable to remove vehicle");
    }
  };

  if (loading && !data) return <Loader label="Loading fleet registry" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight">Vehicle management</h1>
          <p className="m-0 mt-1 text-sm text-muted">{data?.length ?? 0} autonomous nodes registered.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaMagnifyingGlass aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="field !w-auto pl-9"
              placeholder="Search vehicle or model"
              aria-label="Search vehicles"
              onChange={(event) => onSearch(event.target.value)}
            />
          </div>
          <select className="field !w-auto" aria-label="Filter status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All status</option>
            <option value="online">Online</option>
            <option value="idle">Idle</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
          <Button
            onClick={() => {
              setForm(EMPTY_FORM);
              setModalOpen(true);
            }}
          >
            <FaPlus /> Add vehicle
          </Button>
        </div>
      </div>

      {!data?.length ? (
        <EmptyState title="No vehicles match" message="Adjust the filters or register a new autonomous node." icon={<FaCarSide />} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((vehicle, index) => (
            <motion.article
              key={vehicle.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="glass glass-hover flex flex-col p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/vehicles/${vehicle.id}`} className="no-underline">
                    <h2 className="m-0 truncate text-base font-semibold text-[var(--aas-text)]">{vehicle.vehicleNumber}</h2>
                  </Link>
                  <p className="m-0 truncate text-xs text-muted">
                    {vehicle.manufacturer} {vehicle.model} · {vehicle.year}
                  </p>
                </div>
                <Badge tone={statusTone(vehicle.status)}>{titleCase(vehicle.status)}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="glass-soft px-2 py-2">
                  <p className="m-0 text-[0.58rem] uppercase tracking-widest text-muted">Speed</p>
                  <p className="m-0 text-sm font-semibold">{Math.round(vehicle.currentSpeed)}</p>
                </div>
                <div className="glass-soft px-2 py-2">
                  <p className="m-0 text-[0.58rem] uppercase tracking-widest text-muted">Battery</p>
                  <p className="m-0 text-sm font-semibold">{vehicle.batteryLevel}%</p>
                </div>
                <div className="glass-soft px-2 py-2">
                  <p className="m-0 text-[0.58rem] uppercase tracking-widest text-muted">L{vehicle.autonomyLevel}</p>
                  <p className="m-0 text-sm font-semibold">Auto</p>
                </div>
              </div>

              <div className="mt-4">
                <MeterBar label="Safety score" value={vehicle.safetyScore} tone={vehicle.safetyScore > 88 ? "success" : "warning"} />
              </div>

              <div className="mt-3 flex items-center justify-between text-[0.7rem] text-muted">
                <span className="truncate">{vehicle.driver?.fullName ?? "Unassigned"}</span>
                <span>{fromNow(vehicle.lastSeenAt)}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/vehicles/${vehicle.id}`} className="btn btn-ghost !min-h-9 flex-1 no-underline !text-xs">
                  Open node
                </Link>
                <button
                  className="btn btn-ghost !min-h-9 !px-3"
                  aria-label={`Edit ${vehicle.vehicleNumber}`}
                  onClick={() => {
                    setForm({
                      id: vehicle.id,
                      vehicleNumber: vehicle.vehicleNumber,
                      model: vehicle.model,
                      manufacturer: vehicle.manufacturer,
                      vehicleType: vehicle.vehicleType,
                      status: vehicle.status,
                      autonomyLevel: vehicle.autonomyLevel,
                      safetyScore: vehicle.safetyScore,
                    });
                    setModalOpen(true);
                  }}
                >
                  <FaPen />
                </button>
                <button className="btn btn-ghost !min-h-9 !px-3" aria-label={`Delete ${vehicle.vehicleNumber}`} onClick={() => void remove(vehicle)}>
                  <FaTrash />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={form.id ? "Update vehicle" : "Register vehicle"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()}>{form.id ? "Save changes" : "Add to fleet"}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="vehicleNumber">Vehicle number</label>
            <input id="vehicleNumber" className="field" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="model">Model</label>
            <input id="model" className="field" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="manufacturer">Manufacturer</label>
            <input id="manufacturer" className="field" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="vehicleType">Type</label>
            <select id="vehicleType" className="field" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
              {["sedan", "suv", "truck", "shuttle", "van"].map((type) => (
                <option key={type} value={type}>{titleCase(type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["online", "idle", "maintenance", "offline"].map((status) => (
                <option key={status} value={status}>{titleCase(status)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="autonomy">Autonomy level</label>
            <input
              id="autonomy"
              type="number"
              min={0}
              max={5}
              className="field"
              value={form.autonomyLevel}
              onChange={(e) => setForm({ ...form, autonomyLevel: Number(e.target.value) })}
            />
          </div>
        </div>
      </Modal>

      <Card delay={0.1}>
        <SectionTitle title="Fleet composition" subtitle="Autonomy readiness by node" icon={<FaCarSide />} />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {["online", "idle", "maintenance", "offline"].map((status) => (
            <div key={status} className="glass-soft p-3">
              <p className="m-0 text-[0.62rem] uppercase tracking-widest text-muted">{titleCase(status)}</p>
              <p className="m-0 text-xl font-semibold">{(data ?? []).filter((v) => v.status === status).length}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
