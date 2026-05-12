import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign, FileText, Receipt, Users, Clock, Activity,
  LogOut, ChevronRight
} from "lucide-react";
import CollectPaymentModal from "@/components/fieldops/CollectPaymentModal";
import UploadContractModal from "@/components/fieldops/UploadContractModal";
import UploadReceiptModal from "@/components/fieldops/UploadReceiptModal";
import UploadPaysheetModal from "@/components/fieldops/UploadPaysheetModal";
import EnterHoursModal from "@/components/fieldops/EnterHoursModal";
import FieldActivityModal from "@/components/fieldops/FieldActivityModal";

export default function FieldOperationsPortal() {
  const [activeModal, setActiveModal] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["fieldActivityLogs"],
    queryFn: () => base44.entities.FieldActivityLog.list("-timestamp", 10)
  });

  const handleLogout = async () => {
    sessionStorage.removeItem("fieldPaymentsOwner");
    base44.auth.logout("/FieldPaymentsLogin");
  };

  const actions = [
    {
      id: "payment",
      label: "Collect Payment",
      icon: DollarSign,
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700"
    },
    {
      id: "contract",
      label: "Upload Signed Contract",
      icon: FileText,
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700"
    },
    {
      id: "receipt",
      label: "Upload Receipt",
      icon: Receipt,
      color: "bg-orange-50 border-orange-200",
      textColor: "text-orange-700"
    },
    {
      id: "paysheet",
      label: "Upload Pay Sheet",
      icon: Users,
      color: "bg-purple-50 border-purple-200",
      textColor: "text-purple-700"
    },
    {
      id: "hours",
      label: "Enter Subcontractor Hours",
      icon: Clock,
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700"
    },
    {
      id: "activity",
      label: "View Recent Activity",
      icon: Activity,
      color: "bg-slate-50 border-slate-200",
      textColor: "text-slate-700"
    }
  ];

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4" tabIndex={-1}>
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Field Operations</h1>
            <p className="text-sm text-muted-foreground">{user?.full_name || "Portal"}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 gap-3">
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => setActiveModal(action.id)}
                className={`p-4 rounded-lg border-2 flex items-center justify-between transition-all hover:shadow-md active:scale-95 ${action.color}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${action.textColor}`} />
                  <span className={`font-semibold text-sm ${action.textColor}`}>
                    {action.label}
                  </span>
                </div>
                <ChevronRight className={`w-5 h-5 ${action.textColor}`} />
              </button>
            );
          })}
        </div>

        {/* Recent Activity Preview */}
        {activityLogs.length > 0 && (
          <Card className="p-4 mt-6">
            <h3 className="font-semibold text-sm mb-3">Recent Submissions</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {activityLogs.slice(0, 5).map(log => (
                <div key={log.id} className="text-xs p-2 bg-muted rounded flex justify-between">
                  <span className="font-medium">{log.item_type.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      {activeModal === "payment" && <CollectPaymentModal onClose={() => setActiveModal(null)} />}
      {activeModal === "contract" && <UploadContractModal onClose={() => setActiveModal(null)} />}
      {activeModal === "receipt" && <UploadReceiptModal onClose={() => setActiveModal(null)} />}
      {activeModal === "paysheet" && <UploadPaysheetModal onClose={() => setActiveModal(null)} />}
      {activeModal === "hours" && <EnterHoursModal onClose={() => setActiveModal(null)} />}
      {activeModal === "activity" && <FieldActivityModal onClose={() => setActiveModal(null)} />}
    </main>
  );
}