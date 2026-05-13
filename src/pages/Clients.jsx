import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Search, MoreHorizontal, Pencil, Trash2, Briefcase } from "lucide-react";
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
import ClientDetailView from "@/components/clients/ClientDetailView";
import { getStatusColor } from "@/lib/formatters";

const emptyClient = { name: "", email: "", phone: "", address: "", zip_code: "", city: "", state: "", notes: "", status: "active" };

export default function Clients() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyClient);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: allJobs = [] } = useQuery({ queryKey: ["all-jobs"], queryFn: () => base44.entities.Job.list("-created_date", 500) });

  const saveMutation = useMutation({
    mutationFn: (data) => editId ? base44.entities.Client.update(editId, data) : base44.entities.Client.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setDialogOpen(false); setEditId(null); setForm(emptyClient); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const openEdit = (c) => { setForm({ name: c.name, email: c.email || "", phone: c.phone || "", address: c.address || "", zip_code: c.zip_code || "", city: c.city || "", state: c.state || "", notes: c.notes || "", status: c.status || "active" }); setEditId(c.id); setDialogOpen(true); };
  const openCreate = () => { setForm(emptyClient); setEditId(null); setDialogOpen(true); };

  // Normalize a client name for grouping: lowercase, collapse whitespace, normalize & vs and
  const normalizeName = (name) =>
    (name || "")
      .toLowerCase()
      .replace(/\s*&\s*/g, " and ")   // "Bryan & Sharon" → "bryan and sharon"
      .replace(/\s+/g, " ")
      .trim();

  // Group clients by normalized name — collapses "Bryan and Sharon Tann", "Bryan & Sharon Tann", etc.
  const groupedClients = useMemo(() => {
    const groups = new Map();
    clients.forEach(c => {
      const key = normalizeName(c.name) || c.id;
      if (!groups.has(key)) {
        groups.set(key, { primary: c, all: [c] });
      } else {
        groups.get(key).all.push(c);
      }
    });
    return Array.from(groups.values());
  }, [clients]);

  const filtered = groupedClients.filter(g =>
    g.primary.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.all.some(c => c.email?.toLowerCase().includes(search.toLowerCase()))
  );

  // Build a merged client object — pick the best contact info from any record in the group
  const buildMergedClient = (group) => {
    const allClientIds = group.all.map(c => c.id);
    const phone = group.all.map(c => c.phone).find(p => p?.trim());
    const email = group.all.map(c => c.email).find(e => e?.trim());
    const address = group.all.map(c => c.address).find(a => a?.trim());
    return { ...group.primary, phone: phone || "", email: email || "", address: address || group.primary.address || "", _allClientIds: allClientIds, _normalizedName: normalizeName(group.primary.name) };
  };

  return (
    <div>
      <PageHeader title="Clients" description="Manage client contacts and project details" actionLabel="Add Client" onAction={openCreate} />

      <div className="relative mb-4 max-w-sm">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
         <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
       </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Users} title="No clients yet" description="Add your first client to get started." actionLabel="Add Client" onAction={openCreate} />
      ) : (
        <div className="grid gap-3">
          {filtered.map(group => {
            const c = group.primary;
            const bestPhone = group.all.map(x => x.phone).find(p => p?.trim()) || "";
            const bestEmail = group.all.map(x => x.email).find(e => e?.trim()) || "";
            const groupNormName = normalizeName(c.name);
            const jobsForGroup = allJobs.filter(j =>
              group.all.some(gc => gc.id === j.client_id) ||
              normalizeName(j.client_name).startsWith(groupNormName) ||
              groupNormName.startsWith(normalizeName(j.client_name))
            );
            const allJobsDone = jobsForGroup.length > 0 && jobsForGroup.every(j => j.status === "completed" || j.status === "cancelled");
            const displayStatus = allJobsDone ? "completed" : c.status;
            return (
              <Card key={c.id} className="p-4 cursor-pointer hover:shadow-md hover:bg-muted/50 transition-all" onClick={() => setSelectedClient(buildMergedClient(group))}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <Badge className={`text-xs ${getStatusColor(displayStatus)}`}>{displayStatus}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{[bestEmail, bestPhone].filter(Boolean).join(" · ") || "No contact info"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {jobsForGroup.length > 0 && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />{jobsForGroup.length} job{jobsForGroup.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Actions for ${c.name || "client"}`}><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {jobsForGroup.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {jobsForGroup.map(j => (
                      <span key={j.id} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{j.title}</span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader><DialogTitle>{editId ? "Edit Client" : "New Client"}</DialogTitle></DialogHeader>
           <div className="space-y-4">
             <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
             <div className="grid grid-cols-2 gap-3">
               <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
               <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
             </div>
             <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
             <div className="grid grid-cols-3 gap-3">
               <div><Label>ZIP Code</Label><Input value={form.zip_code} onChange={e => setForm({ ...form, zip_code: e.target.value })} maxLength="5" /></div>
               <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
               <div><Label>State</Label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength="2" /></div>
             </div>
             <div><Label>Status</Label>
               <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="active">Active</SelectItem>
                   <SelectItem value="inactive">Inactive</SelectItem>
                   <SelectItem value="prospect">Prospect</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
             <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending}>
               {saveMutation.isPending ? "Saving..." : editId ? "Update Client" : "Create Client"}
             </Button>
           </div>
         </DialogContent>
       </Dialog>

       {selectedClient && (
         <ClientDetailView client={selectedClient} onClose={() => setSelectedClient(null)} />
       )}
       </div>
       );
       }