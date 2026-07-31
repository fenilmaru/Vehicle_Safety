"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { FaDownload, FaFileCsv, FaFileExcel, FaFileLines, FaFilePdf } from "react-icons/fa6";
import { reportApi } from "@/api/endpoints";
import { Badge, Button, Card, DataTable, Loader, SectionTitle } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { formatDate, severityTone, titleCase } from "@/utils/helpers";

type ReportRow = {
  id: number;
  name: string;
  format: string;
  scope: string;
  rowCount: number;
  sizeKb: number;
  status: string;
  generatedBy: string;
  createdAt: string;
};

type DatasetRow = {
  code: string;
  vehicle: string;
  severity: string;
  confidence: number;
  status: string;
  detectedAt: string;
  address: string;
  id?: string;
};

export default function ReportsPage() {
  const { data, loading, refetch } = useApi(() => reportApi.list());
  const [scope, setScope] = useState("accidents");
  const [format, setFormat] = useState("pdf");
  const [severity, setSeverity] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Loader label="Compiling report catalogue" />;

  const generate = async () => {
    setBusy(true);
    try {
      await reportApi.create({
        name: `${titleCase(scope)} export — ${new Date().toLocaleDateString()}`,
        scope,
        format,
        filters: { severity, vehicle, from, to },
        rowCount: data?.dataset.length ?? 0,
      });
      toast.success(`${format.toUpperCase()} report generated`);
      void refetch();
    } catch {
      toast.error("Report engine unavailable");
    } finally {
      setBusy(false);
    }
  };

  const filtered = (data?.dataset ?? []).filter((row) => {
    if (severity && row.severity !== severity) return false;
    if (vehicle && row.vehicle !== vehicle) return false;
    if (from && new Date(row.detectedAt) < new Date(from)) return false;
    if (to && new Date(row.detectedAt) > new Date(`${to}T23:59:59`)) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="m-0 text-xl font-semibold tracking-tight">Reports</h1>
        <p className="m-0 mt-1 text-sm text-muted">Generate PDF, Excel and CSV exports with granular filters.</p>
      </div>

      <Card>
        <SectionTitle title="Report builder" subtitle="Filter, preview and export" icon={<FaFileLines />} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div>
            <label className="label" htmlFor="scope">Dataset</label>
            <select id="scope" className="field" value={scope} onChange={(e) => setScope(e.target.value)}>
              {["accidents", "trips", "vehicles", "drivers", "analytics"].map((option) => (
                <option key={option} value={option}>{titleCase(option)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="format">Format</label>
            <select id="format" className="field" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="severity">Severity</label>
            <select id="severity" className="field" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="">All</option>
              {["normal", "warning", "accident", "critical"].map((option) => (
                <option key={option} value={option}>{titleCase(option)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="vehicle">Vehicle</label>
            <select id="vehicle" className="field" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              <option value="">All vehicles</option>
              {(data?.fleet ?? []).map((item) => (
                <option key={item.id} value={item.vehicleNumber}>{item.vehicleNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="from">From</label>
            <input id="from" type="date" className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="to">To</label>
            <input id="to" type="date" className="field" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void generate()} disabled={busy}>
            <FaFileLines /> {busy ? "Generating…" : "Generate report"}
          </Button>
          <a
            className="btn btn-ghost no-underline"
            href={reportApi.exportUrl({ scope, severity, format })}
            download
          >
            <FaDownload /> Download dataset
          </a>
          <Badge tone="primary">{filtered.length} rows match</Badge>
        </div>
      </Card>

      <Card delay={0.05}>
        <SectionTitle title="Preview" subtitle={`${titleCase(scope)} dataset`} icon={<FaFileCsv />} />
        <DataTable<DatasetRow>
          columns={[
            { key: "code", header: "Code", render: (row) => <span className="mono text-xs text-[var(--aas-accent)]">{row.code}</span> },
            { key: "vehicle", header: "Vehicle", render: (row) => row.vehicle },
            { key: "severity", header: "Severity", render: (row) => <Badge tone={severityTone(row.severity)}>{row.severity}</Badge> },
            { key: "confidence", header: "Confidence", render: (row) => `${(row.confidence * 100).toFixed(0)}%`, hideOnMobile: true },
            { key: "status", header: "Status", render: (row) => titleCase(row.status), hideOnMobile: true },
            { key: "date", header: "Detected", render: (row) => formatDate(row.detectedAt, "DD MMM YYYY HH:mm"), hideOnMobile: true },
          ]}
          rows={filtered.map((row) => ({ ...row, id: row.code }))}
          empty="No rows match the selected filters."
        />
      </Card>

      <Card delay={0.1}>
        <SectionTitle title="Report library" subtitle="Previously generated exports" icon={<FaFilePdf />} />
        <DataTable<ReportRow>
          columns={[
            { key: "name", header: "Report", render: (row) => <span className="font-medium">{row.name}</span> },
            {
              key: "format",
              header: "Format",
              render: (row) => (
                <span className="flex items-center gap-2 text-xs">
                  {row.format === "pdf" ? <FaFilePdf className="text-[var(--aas-danger)]" /> : row.format === "excel" ? <FaFileExcel className="text-[var(--aas-success)]" /> : <FaFileCsv className="text-[var(--aas-accent)]" />}
                  {row.format.toUpperCase()}
                </span>
              ),
            },
            { key: "rows", header: "Rows", render: (row) => row.rowCount.toLocaleString(), hideOnMobile: true },
            { key: "size", header: "Size", render: (row) => `${row.sizeKb} KB`, hideOnMobile: true },
            { key: "by", header: "Generated by", render: (row) => row.generatedBy, hideOnMobile: true },
            { key: "when", header: "Created", render: (row) => formatDate(row.createdAt, "DD MMM YYYY") },
            {
              key: "download",
              header: "",
              render: (row) => (
                <a className="chip chip-primary no-underline" href={reportApi.exportUrl({ scope: row.scope, format: row.format })} download>
                  <FaDownload /> Export
                </a>
              ),
            },
          ]}
          rows={data?.reports ?? []}
        />
      </Card>
    </div>
  );
}
