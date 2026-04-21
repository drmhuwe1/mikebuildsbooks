import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function generateJobNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `JOB-${year}-${rand}`;
}

const defaultData = {
  client_id: "", client_name: "", client_phone: "", client_email: "", client_address: "", client_city: "", client_state: "", client_zip_code: "",
  title: "", scope: "", start_date: "", projected_completion: "",
  bid_amount_estimate: 0, deposit_amount: 0,
};

export default function JobSetupWizard({ initialBid, initialContract, initialChangeOrder, existingJob, onClose, onJobCreated }) {
  const getInitialData = () => {
    if (initialChangeOrder) {
      const parseAddress = (addressStr) => {
        if (!addressStr) return {};
        const trimmed = addressStr.trim();
        const stateZipMatch = trimmed.match(/([A-Z]{2})\s+(\d{5})/);
        if (!stateZipMatch) return { client_address: addressStr };
        const state = stateZipMatch[1];
        const zip = stateZipMatch[2];
        const beforeStateZip = trimmed.substring(0, stateZipMatch.index).trim();
        let street = beforeStateZip;
        let city = "";
        if (beforeStateZip.includes(",")) {
          const parts = beforeStateZip.split(",");
          street = parts[0].trim();
          city = parts[1].trim();
        } else {
          const words = beforeStateZip.split(" ");
          if (words.length > 1) {
            city = words.pop().trim();
            street = words.join(" ").trim();
          }
        }
        return street && city ? { client_address: street, client_city: city, client_state: state, client_zip_code: zip } : { client_address: addressStr };
      };
      const parsedAddr = parseAddress(initialChangeOrder.client_address);
      return {
        ...defaultData,
        client_id: initialChangeOrder.client_id || "",
        client_name: initialChangeOrder.client_name || "",
        client_address: parsedAddr.client_address || "",
        client_city: parsedAddr.client_city || "",
        client_state: parsedAddr.client_state || "",
        client_zip_code: parsedAddr.client_zip_code || "",
        title: initialChangeOrder.title || `Change Order - ${initialChangeOrder.job_title}`,
        scope: initialChangeOrder.scope_summary || initialChangeOrder.project_description || "",
        bid_amount_estimate: parseFloat(initialChangeOrder.change_order_amount) || 0,
        deposit_amount: parseFloat(initialChangeOrder.deposit_amount) || 0,
      };
    }
    if (initialContract) {
      const contractAmt = parseFloat(initialContract.contract_amount) || 0;
      return {
        ...defaultData,
        client_id: initialContract.client_id || "",
        client_name: initialContract.client_name || "",
        client_address: initialContract.client_address || "",
        client_zip_code: initialContract.client_zip_code || "",
        client_city: initialContract.client_city || "",
        client_state: initialContract.client_state || "",
        title: initialContract.title || "",
        scope: initialContract.scope_summary || "",
        bid_amount_estimate: contractAmt,
        deposit_amount: parseFloat(initialContract.deposit_amount) || 0,
      };
    }
    if (initialBid) {
      return {
        ...defaultData,
        client_id: initialBid.client_id || "",
        client_name: initialBid.client_name || "",
        client_address: initialBid.project_address || "",
        client_zip_code: initialBid.project_zip_code || "",
        client_city: initialBid.project_city || "",
        client_state: initialBid.project_state || "",
        title: initialBid.title || "",
        scope: initialBid.scope_summary || "",
        bid_amount_estimate: parseFloat(initialBid.bid_amount) || 0,
      };
    }
    return defaultData;
  };

  const [data] = useState(getInitialData());
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500) });

  const isValid = !!data.client_name && !!data.client_address && !!data.title && !!data.scope;

  const createJob = async () => {
    setSaving(true);
    try {
      // Get or create client
      let clientId = data.client_id;
      if (!clientId && data.client_name) {
        const existing = clients.find(c => c.name?.toLowerCase() === data.client_name.toLowerCase());
        clientId = existing?.id || (await base44.entities.Client.create({
          name: data.client_name,
          phone: data.client_phone,
          email: data.client_email,
          address: data.client_address,
          status: "active",
        })).id;
      }

      const jobData = {
        title: data.title,
        client_id: clientId,
        client_name: data.client_name,
        address: data.client_address,
        zip_code: data.client_zip_code || "",
        city: data.client_city || "",
        state: data.client_state || "",
        scope: data.scope,
        status: "contracted",
        start_date: data.start_date || null,
        projected_completion: data.projected_completion || null,
        contract_amount: parseFloat(data.bid_amount_estimate) || 0,
        deposits_received: parseFloat(data.deposit_amount) || 0,
      };

      let job;
      
      if (initialChangeOrder) {
        // Find existing job linked to this CO
        const originalJob = jobs.find(j => j.id === initialChangeOrder.job_id);
        if (originalJob) {
          // Merge CO with existing job, accounting for outstanding balance and payments
          const coAmount = parseFloat(data.bid_amount_estimate);
          const coPaymentAmount = parseFloat(initialChangeOrder.paid_amount) || 0;
          const newContractAmount = (originalJob.contract_amount || 0) + coAmount;
          const newTotalPaid = (originalJob.total_paid_by_customer || 0) + coPaymentAmount;
          // Merge payments: add CO paid amount to job's total
          job = await base44.entities.Job.update(originalJob.id, {
            contract_amount: newContractAmount,
            change_orders_total: (originalJob.change_orders_total || 0) + coAmount,
            total_paid_by_customer: newTotalPaid,
            scope: (originalJob.scope || "") + (data.scope ? `\n[CO] ${data.scope}` : ""),
          });
          await base44.entities.ChangeOrder.update(initialChangeOrder.id, { job_id: originalJob.id });
        } else {
          // Create new job and link CO
          job = await base44.entities.Job.create(jobData);
          await base44.entities.ChangeOrder.update(initialChangeOrder.id, { job_id: job.id });
        }
      } else {
        job = await base44.entities.Job.create(jobData);
      }

      qc.invalidateQueries({ queryKey: ["jobs"] });
      setSaving(false);
      onJobCreated?.(job);
      onClose();
    } catch (error) {
      console.error("Job creation failed:", error);
      setSaving(false);
      alert(`Failed to create job: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-bold">Create Job</h2>
        <p className="text-sm text-muted-foreground">Fill in details on the Jobs page after creating.</p>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Client</label>
            <p className="px-3 py-2 bg-gray-50 rounded text-sm">{data.client_name || "—"}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Project</label>
            <p className="px-3 py-2 bg-gray-50 rounded text-sm font-medium">{data.title || "—"}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Address</label>
            <p className="px-3 py-2 bg-gray-50 rounded text-sm">{data.client_address || "—"}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Scope</label>
            <p className="px-3 py-2 bg-gray-50 rounded text-sm text-muted-foreground line-clamp-2">{data.scope || "—"}</p>
          </div>
          {data.bid_amount_estimate > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Contract Amount</label>
              <p className="px-3 py-2 bg-gray-50 rounded text-sm font-medium">${data.bid_amount_estimate.toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={createJob}
            disabled={!isValid || saving}
            className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Creating..." : "Create Job"}
          </button>
        </div>
      </div>
    </div>
  );
}