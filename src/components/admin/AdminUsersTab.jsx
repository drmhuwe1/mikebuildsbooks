import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Users, Mail, Trash2, KeyRound, CheckCircle, XCircle, RefreshCw, Send
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export default function AdminUsersTab({ currentUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User deleted successfully" });
      setDeleteTarget(null);
    },
  });

  const setLoading = (userId, action, val) =>
    setActionLoading(prev => ({ ...prev, [`${userId}_${action}`]: val }));
  const isLoading_ = (userId, action) => !!actionLoading[`${userId}_${action}`];

  const sendWelcomeEmail = async (u) => {
    setLoading(u.id, "welcome", true);
    await base44.integrations.Core.SendEmail({
      to: u.email,
      subject: "Welcome to MikeBuildsBooks!",
      body: `Hi ${u.full_name || "there"},\n\nWelcome to MikeBuildsBooks — your all-in-one construction business platform!\n\nYou can log in at any time to manage your jobs, bids, contracts, subcontractors, and financials.\n\nIf you have any questions, just reply to this email.\n\nBest,\nThe MikeBuildsBooks Team`,
    });
    setLoading(u.id, "welcome", false);
    toast({ title: "Welcome email sent", description: `Sent to ${u.email}` });
  };

  const sendPasswordReset = async (u) => {
    setLoading(u.id, "reset", true);
    await base44.integrations.Core.SendEmail({
      to: u.email,
      subject: "Password Reset — MikeBuildsBooks",
      body: `Hi ${u.full_name || "there"},\n\nYou (or an admin) requested a password reset for your MikeBuildsBooks account.\n\nPlease visit the login page and use the "Forgot Password" option to reset your password.\n\nIf you did not request this, you can safely ignore this email.\n\nBest,\nThe MikeBuildsBooks Team`,
    });
    setLoading(u.id, "reset", false);
    toast({ title: "Password reset email sent", description: `Sent to ${u.email}` });
  };

  const toggleStatus = async (u) => {
    setLoading(u.id, "status", true);
    const newStatus = u.status === "inactive" ? "active" : "inactive";
    await base44.entities.User.update(u.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    setLoading(u.id, "status", false);
    toast({ title: `User marked as ${newStatus}` });
  };

  const formatDate = (d) => d ? format(new Date(d), "M/d/yyyy") : "—";

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">All Users ({users.length})</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading users…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground border-b">
                <th className="text-left py-2 px-2 font-medium">Name</th>
                <th className="text-left py-2 px-2 font-medium">Email</th>
                <th className="text-left py-2 px-2 font-medium">Role</th>
                <th className="text-left py-2 px-2 font-medium">Status</th>
                <th className="text-left py-2 px-2 font-medium">Signup Date</th>
                <th className="text-right py-2 px-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2 font-medium">{u.full_name || "—"}</td>
                  <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                  <td className="py-3 px-2">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize text-xs">
                      {u.role || "user"}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    {u.status === "inactive" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">{formatDate(u.created_date)}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-end gap-1">
                      {/* Send Welcome Email */}
                      <Button
                        variant="ghost" size="icon"
                        title="Send welcome email"
                        disabled={isLoading_(u.id, "welcome")}
                        onClick={() => sendWelcomeEmail(u)}
                        className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                      >
                        <Send className="w-4 h-4" />
                      </Button>

                      {/* Send Password Reset */}
                      <Button
                        variant="ghost" size="icon"
                        title="Send password reset email"
                        disabled={isLoading_(u.id, "reset")}
                        onClick={() => sendPasswordReset(u)}
                        className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>

                      {/* Toggle Active/Inactive */}
                      <Button
                        variant="ghost" size="icon"
                        title={u.status === "inactive" ? "Mark active" : "Mark inactive"}
                        disabled={isLoading_(u.id, "status")}
                        onClick={() => toggleStatus(u)}
                        className={`h-8 w-8 ${u.status === "inactive" ? "text-green-500 hover:text-green-600 hover:bg-green-50" : "text-orange-500 hover:text-orange-600 hover:bg-orange-50"}`}
                      >
                        {u.status === "inactive" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </Button>

                      {/* Delete */}
                      {u.id !== currentUser?.id && (
                        <Button
                          variant="ghost" size="icon"
                          title="Delete user"
                          onClick={() => setDeleteTarget(u)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteTarget?.full_name || deleteTarget?.email}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteUserMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}