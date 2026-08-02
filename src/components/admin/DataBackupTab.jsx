import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Download, Upload, DatabaseBackup, AlertTriangle, FileJson, CheckCircle, Loader2,
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
      const result = await base44.functions.invoke("exportAllData", {});
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `mikebuildsbooks-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setLastExport(result);
      toast({
        title: "Backup exported",
        description: `${Object.values(result.entityCounts || {}).reduce((s, n) => s + n, 0)} records downloaded.`,
      });
    } catch (err) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
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
      const report = await base44.functions.invoke("importAllData", {
        entities: parsed.entities,
        mode: importMode,
      });
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

  return (
    <div className="space-y-6">
      {/* Export */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
          <DatabaseBackup className="w-5 h-5 text-blue-500" /> Export All Data
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Downloads a single JSON file containing every record you've entered — clients, jobs, bids,
          contracts, change orders, subcontractors, receipts, payments, expenses, schedules, documents,
          and all financial calculations — ready to restore into a blank copy of this app.
        </p>
        <Button onClick={handleExport} disabled={exporting} className="gap-2">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "Exporting..." : "Export Full Backup"}
        </Button>

        {lastExport && (
          <div className="mt-4 rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <FileJson className="w-4 h-4" /> Backup contents
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs max-h-56 overflow-y-auto">
              {Object.entries(lastExport.entityCounts || {})
                .filter(([, n]) => n > 0)
                .map(([name, n]) => (
                  <div key={name} className="flex justify-between">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-medium">{n}</span>
                  </div>
                ))}
            </div>
            {lastExport.users?.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                {lastExport.users.length} user account(s) included for reference — users must be re-invited after import.
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