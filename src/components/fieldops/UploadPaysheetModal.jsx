import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search, Upload, CheckCircle } from "lucide-react";

export default function UploadPaysheetModal({ onClose }) {
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState("selectSub");
  const [subSearch, setSubSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [file, setFile] = useState(null);
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);

  useState(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: subs = [] } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => base44.entities.Subcontractor.list("-created_date", 100)
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 100)
  });

  const filteredSubs = subs.filter(s =>
    subSearch === "" || s.name?.toLowerCase().includes(subSearch.toLowerCase())
  );

  const filteredJobs = jobs.filter(j =>
    jobSearch === "" || j.title?.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !hours) throw new Error("Missing file or hours");
      setUploading(true);

      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Create subcontractor payment record
      await base44.entities.SubcontractorLedgerPayment.create({
        subcontractor_id: selectedSub.id,
        subcontractor_name: selectedSub.name,
        job_id: selectedJob.id,
        job_title: selectedJob.title,
        total_hours: parseFloat(hours),
        total_amount_due: rate ? parseFloat(hours) * parseFloat(rate) : 0,
        payment_date: new Date().toISOString().split("T")[0],
        notes: note
      });

      // Create SubPaysheet record for document tracking
      await base44.entities.SubPaysheet.create({
        subcontractor_id: selectedSub.id,
        subcontractor_name: selectedSub.name,
        photo_url: file_url,
        job_title: selectedJob.title,
        upload_date: new Date().toISOString().split("T")[0]
      });

      // Log activity
      await base44.entities.FieldActivityLog.create({
        item_type: "subcontractor_paysheet",
        subcontractor_id: selectedSub.id,
        subcontractor_name: selectedSub.name,
        job_id: selectedJob.id,
        job_title: selectedJob.title,
        file_url,
        file_name: file.name,
        hours: parseFloat(hours),
        uploaded_by_email: user?.email,
        uploaded_by_name: user?.full_name,
        timestamp: new Date().toISOString(),
        status: "pending_review"
      });

      setUploading(false);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subPaysheets"] });
      qc.invalidateQueries({ queryKey: ["fieldActivityLogs"] });
      setStep("success");
      setTimeout(onClose, 2000);
    }
  });

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  if (step === "success") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-96 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold">Pay Sheet Uploaded</h2>
          <p className="text-sm text-muted-foreground mt-2">{hours}hrs - {selectedSub.name}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md rounded-t-lg sm:rounded-lg">
        <div className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Upload Pay Sheet</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === "selectSub" && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Select Subcontractor</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subcontractor..."
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="space-y-2">
                  {filteredSubs.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSub(s);
                        setStep("selectJob");
                      }}
                      className="w-full text-left p-3 border rounded-lg hover:bg-muted transition"
                    >
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.specialty}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === "selectJob" && selectedSub && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
                <p className="text-sm font-bold">{selectedSub.name}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Select Job</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search job..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="space-y-2">
                  {filteredJobs.map(j => (
                    <button
                      key={j.id}
                      onClick={() => {
                        setSelectedJob(j);
                        setStep("details");
                      }}
                      className="w-full text-left p-3 border rounded-lg hover:bg-muted transition"
                    >
                      <p className="font-semibold text-sm">{j.title}</p>
                      <p className="text-xs text-muted-foreground">{j.client_name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setStep("selectSub")}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            </>
          )}

          {step === "details" && selectedSub && selectedJob && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-1">
                <p className="text-xs text-blue-700">{selectedSub.name}</p>
                <p className="text-sm font-bold">{selectedJob.title}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Hours Worked</label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  step="0.5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Hourly Rate (optional)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Note (optional)</label>
                <Input
                  placeholder="Details..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Pay Sheet File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {file ? file.name : "Choose Photo or PDF"}
                </Button>
              </div>

              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={!file || !hours || uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Save Pay Sheet"}
              </Button>
              <Button
                onClick={() => setStep("selectJob")}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}