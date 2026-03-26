import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search, Upload, CheckCircle } from "lucide-react";

export default function UploadContractModal({ onClose }) {
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);

  useState(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => base44.entities.Contract.list("-created_date", 100)
  });

  const filteredContracts = contracts.filter(c =>
    searchQuery === "" ||
    c.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      setUploading(true);

      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Update contract with signed document
      await base44.entities.Contract.update(selectedContract.id, {
        signed_contract_images: [
          ...(selectedContract.signed_contract_images || []),
          file_url
        ],
        signed_and_accepted: true
      });

      // Log activity
      await base44.entities.FieldActivityLog.create({
        item_type: "signed_contract_upload",
        contract_id: selectedContract.id,
        client_id: selectedContract.client_id,
        client_name: selectedContract.client_name,
        job_id: selectedContract.job_id,
        file_url,
        file_name: file.name,
        uploaded_by_email: user?.email,
        uploaded_by_name: user?.full_name,
        timestamp: new Date().toISOString(),
        status: "pending_review"
      });

      setUploading(false);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
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
          <h2 className="text-lg font-bold">Contract Uploaded</h2>
          <p className="text-sm text-muted-foreground mt-2">Pending office review</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md rounded-t-lg sm:rounded-lg">
        <div className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Upload Signed Contract</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === "search" && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Search Contract</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Client name or contract..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredContracts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedContract(c);
                      setStep("upload");
                    }}
                    className="w-full text-left p-3 border rounded-lg hover:bg-muted transition"
                  >
                    <p className="font-semibold text-sm">{c.client_name}</p>
                    <p className="text-xs text-muted-foreground">{c.title}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "upload" && selectedContract && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-700">{selectedContract.client_name}</p>
                <p className="font-bold text-sm">{selectedContract.title}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Select File</label>
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

              {file && (
                <div className="text-xs text-green-600 font-semibold">
                  ✓ {file.name} selected
                </div>
              )}

              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={!file || uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload & Save"}
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