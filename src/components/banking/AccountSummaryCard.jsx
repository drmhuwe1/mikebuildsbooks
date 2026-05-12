import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Wallet, CreditCard, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/formatters";

const typeIcons = {
  checking: Wallet,
  savings: Building2,
  credit: CreditCard,
};

export default function AccountSummaryCard({ account, onEdit, onDelete, onSync }) {
  const Icon = typeIcons[account.account_type] || Wallet;
  const isBusiness = account.account_category === "business";

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${isBusiness ? "bg-blue-100" : "bg-green-100"}`}>
            <Icon className={`w-5 h-5 ${isBusiness ? "text-blue-600" : "text-green-600"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{account.name}</p>
            <p className="text-xs text-muted-foreground">{account.institution || "—"} · {account.account_type}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Account actions">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(account)}>
              <Pencil className="w-3.5 h-3.5 mr-2" />Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSync(account.id)}>
              🔄 Sync
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(account.id)}>
              <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground">Current Balance</p>
          <p className="text-xl font-bold">{formatCurrency(account.current_balance)}</p>
        </div>

        {account.available_balance && account.available_balance !== account.current_balance && (
          <div>
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="text-sm font-semibold">{formatCurrency(account.available_balance)}</p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <Badge variant={isBusiness ? "default" : "secondary"} className="text-xs">
            {isBusiness ? "Business" : "Personal"}
          </Badge>
          {account.is_connected_via_plaid && (
            <Badge variant="outline" className="text-xs">
              Plaid Connected
            </Badge>
          )}
        </div>

        {account.last_synced && (
          <p className="text-xs text-muted-foreground pt-2">
            Last synced: {formatDate(account.last_synced)}
          </p>
        )}
      </div>
    </Card>
  );
}