import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search, Upload, CheckCircle } from "lucide-react";

const CATEGORIES = [
  "materials", "labor", "subcontractor", "equipment", "permits", "overhead", "fuel", "tools", "other"
];

export default function UploadReceiptModal({ onClose }) {
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("materials");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);

  useState(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 100)
  });

  const filteredJobs = jobs.filter(j =>
    searchQuery === "" ||
    j.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !amount) throw new Error("Missing file or amount");
      setUploading(true);

      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Create receipt
      await base44.entities.JobReceipt.create({
        job_id: selectedJob.id,
        job_title: selectedJob.title,
        description: vendor || category,
        amount: parseFloat(amount),
        category,
        receipt_image_url: file_url,
        date: new Date().toISOString().split("T")[0],
        vendor,
        notes: note
      });

      // Log activity
      await base44.entities.FieldActivityLog.create({
        item_type: "expense_receipt",
        job_id: selectedJob.id,
        job_title: selectedJob.title,
        file_url,
        file_name: file.name,
        amount: parseFloat(amount),
        uploaded_by_email: user?.email,
        uploaded_by_name: user?.full_name,
        timestamp: new Date().toISOString(),
        status: "pending_review"
      });

      setUploading(false);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobReceipts"] });
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
          <h2 className="text-lg font-bold">Receipt Uploaded</h2>
          <p className="text-sm text-muted-foreground mt-2">${amount} for {selectedJob.title}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md rounded-t-lg sm:rounded-lg">
        <div className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Upload Receipt</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === "search" && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Search Job</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Job title or client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
            </>
          )}

          {step === "details" && selectedJob && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm font-bold">{selectedJob.title}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Amount</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 border border-input rounded-md px-3 text-sm"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Vendor (optional)</label>
                <Input
                  placeholder="e.g. Home Depot"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
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
                <label className="block text-sm font-semibold mb-2">Receipt File</label>
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
                disabled={!file || !amount || uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Save Receipt"}
              </Button>
              <Button
                onClick={() => setStep("search")}
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