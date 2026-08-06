import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Download, Upload, DatabaseBackup, AlertTriangle, FileJson, CheckCircle,
  Loader2, Files, ShieldAlert, FileArchive,
} from "lucide-react";

export default function DataBackupTab() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState("merge");
  const [lastExport, setLastExport] = useState(null);
  const [importReport, setImportReport] = useState(null);
  const fileRef = useRef(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await base44.functions.invoke("exportAllData", {});
      const result = res.data;
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `mikebuildsbooks-COMPLETE-migration-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setLastExport(result);
      const total = result.manifest?.totalRecords ?? Object.values(result.entityCounts || {}).reduce((s, n) => s + n, 0);
      if (result.complete) {
        toast({
          title: "Migration backup complete",
          description: `${total} records across ${result.manifest?.entitiesExported?.length ?? 0} entities + ${result.users?.length ?? 0} users + ${result.fileManifest?.length ?? 0} file assets.`,
        });
      } else {
        toast({
          title: "BACKUP INCOMPLETE — DO NOT DISCONTINUE THE CURRENT APP",
          description: `${result.manifest?.incompleteEntities?.length ?? 0} entity/entities failed. See details below.`,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportFiles = async () => {
    let data = lastExport;
    if (!data) {
      setExporting(true);
      try {
        const res = await base44.functions.invoke("exportAllData", {});
        data = res.data;
        setLastExport(data);
      } catch (err) {
        toast({ title: "Export failed", description: err.message, variant: "destructive" });
        setExporting(false);
        return;
      } finally {
        setExporting(false);
      }
    }
    const fileManifest = data.fileManifest || [];
    const payload = {
      exportDate: data.exportedAt,
      formatVersion: "mikebuildsbooks-migration-files-manifest-v1",
      fileAssetCount: fileManifest.length,
      note: "Each entry references a file stored in Base44 storage. Download the actual file bytes from the 'url' field before Base44 is discontinued. The record_id + entity fields link each file back to its owning record in the main migration backup JSON.",
      files: fileManifest,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `mikebuildsbooks-migration-files-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast({
      title: "File manifest downloaded",
      description: `${fileManifest.length} file asset references. Download the actual files from the URLs before migration.`,
    });
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportReport(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.entities) {
        throw new Error("This does not look like a valid backup file (missing 'entities').");
      }
      if (importMode === "replace") {
        const ok = window.confirm(
          "Replace mode will PERMANENTLY DELETE all existing data in this app before importing. Are you sure?"
        );
        if (!ok) { setImporting(false); e.target.value = ""; return; }
      }
      const importRes = await base44.functions.invoke("importAllData", {
        entities: parsed.entities,
        mode: importMode,
      });
      const report = importRes.data;
      setImportReport(report);
      const total = Object.values(report.created || {}).reduce((s, n) => s + n, 0);
      toast({
        title: report.status === "success" ? "Import complete" : "Import finished with errors",
        description: `${total} records created, ${report.fkPatched || 0} links restored.`,
        variant: report.status === "success" ? "default" : "destructive",
      });
    } catch (err) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const m = lastExport?.manifest;
  const isComplete = lastExport?.complete;

  return (
    <div className="space-y-6">
      {/* Export */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
          <DatabaseBackup className="w-5 h-5 text-blue-500" /> Export Complete Migration Backup
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Downloads a single JSON file containing every record from all 42 data entities —
          clients, jobs, bids, contracts, change orders, bank accounts <strong>and bank transactions</strong>,
          subcontractors, receipts, payments, expenses, schedules, documents, financial goals/scenarios,
          field activity, admin whitelist, report settings, self-test results, and more — plus a
          user migration reference and a file/storage manifest. Original record IDs are preserved
          so foreign-key relationships can be remapped during import.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Exporting..." : "Export Complete Migration Backup"}
          </Button>
          <Button onClick={handleExportFiles} disabled={exporting} variant="outline" className="gap-2">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
            Export Migration Files
          </Button>
        </div>

        {/* Verification status */}
        {lastExport && (
          <div className="mt-4">
            {isComplete ? (
              <div className="flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 p-4">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Backup Complete</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    All {m?.entitiesExported?.length ?? 0} entities exported and verified.
                    {m?.totalRecords ?? 0} total records, {lastExport.users?.length ?? 0} user references,
                    {" "}{m?.fileAssetCount ?? 0} file assets inventoried.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-red-400 bg-red-50 p-4">
                <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-800">
                    BACKUP INCOMPLETE — DO NOT DISCONTINUE THE CURRENT APP
                  </p>
                  <p className="text-xs text-red-700 mt-0.5">
                    {m?.incompleteEntities?.length ?? 0} entity/entities failed to export completely.
                    Missing required: {m?.missingRequiredEntities?.length ? m.missingRequiredEntities.join(", ") : "none"}.
                    See errors below.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manifest details */}
        {lastExport && (
          <div className="mt-4 rounded-lg border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <FileJson className="w-4 h-4" />
              <p className="text-sm font-medium">Migration manifest</p>
              <Badge variant="secondary" className="text-xs ml-auto">{m?.formatVersion}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Export date</p>
                <p className="font-medium">{m?.exportDate ? new Date(m.exportDate).toLocaleString() : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total records</p>
                <p className="font-medium">{m?.totalRecords ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Entities</p>
                <p className="font-medium">{m?.entitiesExported?.length ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">File assets</p>
                <p className="font-medium">{m?.fileAssetCount ?? 0}</p>
              </div>
            </div>

            {/* Verification checklist */}
            {m?.verification && (
              <div className="flex flex-wrap gap-2 pt-1">
                {m.verification.bankTransactionIncluded && <Badge className="bg-green-100 text-green-700 border-green-200">BankTransaction ✓</Badge>}
                {m.verification.whitelistIncluded && <Badge className="bg-green-100 text-green-700 border-green-200">Whitelist ✓</Badge>}
                {m.verification.reportSettingIncluded && <Badge className="bg-green-100 text-green-700 border-green-200">ReportSetting ✓</Badge>}
                {m.verification.selfTestResultsIncluded && <Badge className="bg-green-100 text-green-700 border-green-200">SelfTestResults ✓</Badge>}
                {m.verification.paginationComplete && <Badge className="bg-green-100 text-green-700 border-green-200">Pagination complete ✓</Badge>}
                {m.verification.foreignKeysPreserved && <Badge className="bg-green-100 text-green-700 border-green-200">Foreign keys preserved ✓</Badge>}
              </div>
            )}

            {/* Errors */}
            {m?.errors?.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-medium text-red-700 mb-1">Export errors ({m.errors.length}):</p>
                <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                  {m.errors.map((er, i) => (
                    <div key={i} className="text-red-600">{er.entity}: {er.error}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Entity counts */}
            <div>
              <p className="text-xs font-medium mb-1.5">Records per entity:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs max-h-56 overflow-y-auto">
                {Object.entries(lastExport.entityCounts || {}).map(([name, n]) => (
                  <div key={name} className="flex justify-between">
                    <span className="text-muted-foreground">{name}</span>
                    <span className={`font-medium ${n === 0 ? "text-muted-foreground" : ""}`}>{n}</span>
                  </div>
                ))}
              </div>
            </div>

            {lastExport.users?.length > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Files className="w-3.5 h-3.5" />
                {lastExport.users.length} user account(s) included as a migration reference (id, email, name, role, created date). Users must be re-invited in the new app — auth credentials are never exported.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Import */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
          <Upload className="w-5 h-5 text-green-600" /> Import / Restore Data
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a previously exported backup file to re-create all records. Foreign-key links
          (client→job→contract→change order, etc.) are automatically remapped to the new record IDs.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Mode:</span>
            <select
              value={importMode}
              onChange={(e) => setImportMode(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="merge">Merge — add to existing data</option>
              <option value="replace">Replace — wipe existing, then import</option>
            </select>
          </div>
        </div>

        {importMode === "replace" && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              Replace mode permanently deletes <strong>all</strong> current data before importing. This cannot be undone.
            </p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="gap-2"
        >
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {importing ? "Importing..." : "Choose Backup File"}
        </Button>

        {importReport && (
          <div className="mt-4 rounded-lg border bg-muted/40 p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-1.5">
              {importReport.status === "success" ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              Import {importReport.status === "success" ? "successful" : "completed with errors"}
            </p>
            <p className="text-xs text-muted-foreground">
              {Object.values(importReport.created || {}).reduce((s, n) => s + n, 0)} records created ·{" "}
              {importReport.fkPatched || 0} relationships restored
            </p>
            {importReport.errors?.length > 0 && (
              <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                {importReport.errors.slice(0, 50).map((er, i) => (
                  <div key={i} className="text-red-600">
                    {er.entity}: {er.error}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{importReport.note}</p>
          </div>
        )}
      </Card>
    </div>
  );
}