import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Upload, Search, MoreHorizontal, Trash2, ExternalLink, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/formatters";

const DOC_TYPES = ["bid","contract","payout_summary","bill_report","w9","invoice","receipt","other"];

export default function Documents() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("other");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const qc = useQueryClient();

  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => base44.entities.Document.list("-created_date", 200) });

  const createDoc = useMutation({
    mutationFn: (d) => base44.entities.Document.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); setDialogOpen(false); resetForm(); },
  });

  const deleteDoc = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const resetForm = () => { setTitle(""); setType("other"); setNotes(""); setFile(null); };

  const handleUpload = async () => {
    if (!file || !title) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    createDoc.mutate({ title, type, file_url, notes, doc_type: "imported" });
    setUploading(false);
  };

  const filtered = docs.filter(d => d.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Documents" description="Store and manage uploaded files and generated PDFs" actionLabel="Upload Document" onAction={() => { resetForm(); setDialogOpen(true); }} />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents yet" description="Upload bids, contracts, receipts, and more." actionLabel="Upload Document" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(d => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{d.type}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(d.created_date)}</span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={`Actions for ${d.title || "document"}`}><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {d.file_url && <DropdownMenuItem onClick={() => window.open(d.file_url, "_blank")}><ExternalLink className="w-3.5 h-3.5 mr-2" />Open File</DropdownMenuItem>}
                    {d.html_content && <DropdownMenuItem onClick={() => {
                      const win = window.open();
                      win.document.write(d.html_content);
                      win.document.close();
                    }}><ExternalLink className="w-3.5 h-3.5 mr-2" />View Document</DropdownMenuItem>}
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteDoc.mutate(d.id)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>File *</Label>
              <Input type="file" onChange={e => setFile(e.target.files[0])} className="mt-1" />
            </div>
            <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
            <Button className="w-full" onClick={handleUpload} disabled={!title || !file || uploading}>
              {uploading ? "Uploading..." : "Upload & Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}