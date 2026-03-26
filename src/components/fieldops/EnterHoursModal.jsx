import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search, CheckCircle } from "lucide-react";

export default function EnterHoursModal({ onClose }) {
  const qc = useQueryClient();
  const [step, setStep] = useState("selectSub");
  const [subSearch, setSubSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [user, setUser] = useState(null);

  useState(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: subs = [] } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => base44.entities.Subcontractor.list()
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list()
  });

  const filteredSubs = subs.filter(s =>
    subSearch === "" || s.name?.toLowerCase().includes(subSearch.toLowerCase())
  );

  const filteredJobs = jobs.filter(j =>
    jobSearch === "" || j.title?.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.SubcontractorWorkEntry.create({
        subcontractor_id: selectedSub.id,
        subcontractor_name: selectedSub.name,
        job_id: selectedJob.id,
        job_title: selectedJob.title,
        work_date: new Date().toISOString().split("T")[0],
        hours_worked: parseFloat(hours),
        description,
        payment_status: "Unpaid"
      });

      await base44.entities.FieldActivityLog.create({
        item_type: "subcontractor_hours",
        subcontractor_id: selectedSub.id,
        subcontractor_name: selectedSub.name,
        job_id: selectedJob.id,
        job_title: selectedJob.title,
        hours: parseFloat(hours),
        uploaded_by_email: user?.email,
        uploaded_by_name: user?.full_name,
        timestamp: new Date().toISOString(),
        status: "submitted"
      });

      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workEntries"] });
      qc.invalidateQueries({ queryKey: ["fieldActivityLogs"] });
      setStep("success");
      setTimeout(onClose, 2000);
    }
  });

  if (step === "success") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-96 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold">Hours Recorded</h2>
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
            <h2 className="text-lg font-bold">Enter Hours</h2>
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
                    placeholder="Search..."
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
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === "selectJob" && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm font-bold">{selectedSub.name}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Select Job</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
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
                        setStep("hours");
                      }}
                      className="w-full text-left p-3 border rounded-lg hover:bg-muted transition"
                    >
                      <p className="font-semibold text-sm">{j.title}</p>
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

          {step === "hours" && (
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
                  className="text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Work Description (optional)</label>
                <Input
                  placeholder="What was accomplished..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!hours || saveMutation.isPending}
                className="w-full"
              >
                {saveMutation.isPending ? "Saving..." : "Save Hours"}
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