import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { UserPlus, Trash2, RefreshCw, Shield } from "lucide-react";

const ACCESS_TYPES = ["full", "limited", "admin", "business", "professional", "trial_extension", "custom"];

export default function AdminWhitelistTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: "", email: "", access_type: "full" });

  const { data: whitelist = [], isLoading, refetch } = useQuery({
    queryKey: ["whitelist"],
    queryFn: () => base44.entities.Whitelist.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.Whitelist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelist"] });
      setShowAdd(false);
      setNewEntry({ name: "", email: "", access_type: "full" });
      toast({ title: "Whitelist entry added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Whitelist.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whitelist"] });
      toast({ title: "Whitelist entry removed" });
    },
  });

  const updateAccess = async (id, access_type) => {
    await base44.entities.Whitelist.update(id, { access_type });
    queryClient.invalidateQueries({ queryKey: ["whitelist"] });
    toast({ title: "Access type updated" });
  };

  const handleAdd = () => {
    if (!newEntry.email) { toast({ title: "Email is required", variant: "destructive" }); return; }
    addMutation.mutate({
      ...newEntry,
      added_by: user?.email || "",
      date_added: new Date().toISOString().split("T")[0],
    });
  };

  const getUserForEmail = (email) => users.find(u => u.email === email);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Whitelist Management ({whitelist.length})</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-1.5" /> Refresh</Button>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}><UserPlus className="w-4 h-4 mr-1.5" /> Add</Button>
        </div>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 rounded-lg border bg-muted/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={newEntry.name} onChange={e => setNewEntry({ ...newEntry, name: e.target.value })} placeholder="Optional" />
            </div>
            <div>
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={newEntry.email} onChange={e => setNewEntry({ ...newEntry, email: e.target.value })} placeholder="user@example.com" />
            </div>
            <div>
              <Label className="text-xs">Access Type</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={newEntry.access_type} onChange={e => setNewEntry({ ...newEntry, access_type: e.target.value })}>
                {ACCESS_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending}>Add to Whitelist</Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      ) : whitelist.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No whitelist entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground border-b">
                <th className="text-left py-2 px-2 font-medium">Name</th>
                <th className="text-left py-2 px-2 font-medium">Email</th>
                <th className="text-left py-2 px-2 font-medium">Access Type</th>
                <th className="text-left py-2 px-2 font-medium">Added By</th>
                <th className="text-left py-2 px-2 font-medium">Date</th>
                <th className="text-left py-2 px-2 font-medium">Account</th>
                <th className="text-right py-2 px-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {whitelist.map(w => {
                const linkedUser = getUserForEmail(w.email);
                return (
                  <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-2 font-medium">{w.name || "—"}</td>
                    <td className="py-3 px-2 text-muted-foreground">{w.email}</td>
                    <td className="py-3 px-2">
                      <select
                        className="text-xs rounded border border-input bg-background px-2 py-1"
                        value={w.access_type}
                        onChange={e => updateAccess(w.id, e.target.value)}
                      >
                        {ACCESS_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">{w.added_by || "—"}</td>
                    <td className="py-3 px-2 text-muted-foreground">{w.date_added || "—"}</td>
                    <td className="py-3 px-2">
                      {linkedUser ? (
                        <Badge variant="secondary" className="text-xs">Registered</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteMutation.mutate(w.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}