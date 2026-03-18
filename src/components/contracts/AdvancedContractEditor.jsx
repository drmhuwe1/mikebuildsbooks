import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit2, Printer } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { CONTRACT_TEMPLATE_V1 } from "@/lib/contractTemplateV1";

const LOGO_URL = "https://media.base44.com/images/public/69b9774720c1d890b1162f57/17e5112da_MikeBuildsBooksLogo.png";

export default function AdvancedContractEditor({ contract, company, onClose }) {
  const [data, setData] = useState({ ...contract });
  const [showEdit, setShowEdit] = useState(false);
  const [printing, setPrinting] = useState(false);

  const co = company || {};

  const buildHtml = (forPrint = false) => {
    return CONTRACT_TEMPLATE_V1.buildHTML(data, co, LOGO_URL, forPrint);
  };

  const fetchImageAsDataUrl = async (url) => {
    if (!url) return null;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      
      // Fetch images as data URLs for proper PDF embedding
      const companyLogoData = co.company_logo_url ? await fetchImageAsDataUrl(co.company_logo_url) : null;
      const appLogoData = await fetchImageAsDataUrl(LOGO_URL);
      
      // Build the HTML with embedded images
      let html = buildHtml(true);
      
      // Replace image src with data URLs
      if (companyLogoData && co.company_logo_url) {
        html = html.replace(
          new RegExp(`src="[^"]*\\Q${co.company_logo_url}\\E[^"]*"`, 'g'),
          `src="${companyLogoData}"`
        );
      }
      if (appLogoData) {
        html = html.replace(
          /src="[^"]*MikeBuildsBooksLogo[^"]*"/g,
          `src="${appLogoData}"`
        );
      }
      
      // Create print window with proper settings
      const printWindow = window.open('', '', 'width=1200,height=800');
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Wait for images to load before printing
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 500);
      }, 1500);
    } catch (error) {
      console.error('Print error:', error);
      alert('Error preparing PDF. Try again.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b bg-white shrink-0">
        <Button size="sm" onClick={handlePrint} disabled={printing}>
          <Printer className="w-4 h-4 mr-1" /> {printing ? "Generating PDF..." : "Print / Save as PDF"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowEdit(v => !v)}>
          <Edit2 className="w-4 h-4 mr-1" />{showEdit ? "Hide" : "Edit"} Details
        </Button>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick editor panel */}
      {showEdit && (
        <div className="border-b bg-slate-50 p-3 shrink-0">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Client First Name</label>
              <Input value={data.client_name || ""} onChange={e => setData(d => ({ ...d, client_name: e.target.value }))} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Client Last Name</label>
              <Input value={data.client_last_name || ""} onChange={e => setData(d => ({ ...d, client_last_name: e.target.value }))} className="text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Start Date</label>
              <Input type="date" value={data.start_date || ""} onChange={e => setData(d => ({ ...d, start_date: e.target.value }))} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Est. Completion</label>
              <Input type="date" value={data.estimated_completion || ""} onChange={e => setData(d => ({ ...d, estimated_completion: e.target.value }))} className="text-sm" />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold block mb-1">2nd Payment Milestone Label</label>
            <Input value={data.start_of_construction_label || ""} onChange={e => setData(d => ({ ...d, start_of_construction_label: e.target.value }))} className="text-sm" placeholder="Upon completion and passing of framing and footer inspection:" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              ["Contract Total", "contract_amount"],
              ["Deposit", "deposit_amount"],
              ["2nd Payment", "start_of_construction_amount"],
              ["Final Payment", "final_payment_amount"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs font-semibold block mb-1">{label}</label>
                <Input type="number" value={data[key] || 0} onChange={e => setData(d => ({ ...d, [key]: parseFloat(e.target.value) || 0 }))} className="text-sm" />
              </div>
            ))}
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold block mb-1">Disclaimer / Additional Fees</label>
            <textarea value={data.disclaimer || ""} onChange={e => setData(d => ({ ...d, disclaimer: e.target.value }))} className="w-full text-xs border rounded p-2" rows={2} placeholder="e.g., 'Possible Manifold replacement - estimated $500 if needed'" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Client Paid Amount</label>
            <Input type="number" value={data.client_paid_amount || 0} onChange={e => setData(d => ({ ...d, client_paid_amount: parseFloat(e.target.value) || 0 }))} className="text-sm" placeholder="0" />
          </div>
          </div>
          )}

      {/* Live preview - shows the paper-card layout */}
      <div className="flex-1 overflow-hidden">
        <iframe
          srcDoc={buildHtml(false)}
          title="Contract Preview"
          style={{ width: "100%", height: "100%", border: "none" }}
          key={JSON.stringify(data)}
        />
      </div>
    </div>
  );
}