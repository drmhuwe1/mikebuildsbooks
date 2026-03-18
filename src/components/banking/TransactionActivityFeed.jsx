import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpRight, ArrowDownRight, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

const CATEGORIES = [
  "deposit", "payment", "transfer", "payroll", "materials", "subcontractor",
  "overhead", "tax", "owner_draw", "fuel", "insurance", "tools_equipment",
  "software", "utilities", "permit_fees", "groceries", "housing",
  "transportation", "debt_payments", "entertainment", "healthcare",
  "savings_transfer", "personal_bills", "other"
];

export default function TransactionActivityFeed({
  transactions = [],
  accounts = [],
  onEdit,
  onDelete,
  onCategorize,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  const filtered = useMemo(() => {
    let result = transactions;

    if (searchTerm) {
      result = result.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.vendor && t.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterCategory !== "all") {
      result = result.filter(t => t.category === filterCategory);
    }

    if (filterAccount !== "all") {
      result = result.filter(t => t.bank_account_id === filterAccount);
    }

    if (filterType !== "all") {
      result = result.filter(t => t.type === filterType);
    }

    // Sort
    if (sortBy === "date-desc") {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === "date-asc") {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === "amount-desc") {
      result.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === "amount-asc") {
      result.sort((a, b) => a.amount - b.amount);
    }

    return result;
  }, [transactions, searchTerm, filterCategory, filterAccount, filterType, sortBy]);

  const uncategorized = filtered.filter(t => !t.is_categorized);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {uncategorized.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {uncategorized.length} uncategorized
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="inflow">Income</SelectItem>
              <SelectItem value="outflow">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest</SelectItem>
              <SelectItem value="date-asc">Oldest</SelectItem>
              <SelectItem value="amount-desc">Highest</SelectItem>
              <SelectItem value="amount-asc">Lowest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No transactions found.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <Card key={t.id} className="p-3 hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    t.type === "inflow" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {t.type === "inflow" ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      {!t.is_categorized && <Badge variant="outline" className="text-xs">Uncategorized</Badge>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                      <span>{formatDate(t.date)}</span>
                      <span>•</span>
                      <span>{t.category}</span>
                      {t.bank_account_name && (
                        <>
                          <span>•</span>
                          <span>{t.bank_account_name}</span>
                        </>
                      )}
                      {t.job_title && (
                        <>
                          <span>•</span>
                          <span className="font-medium">{t.job_title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <p className={`text-sm font-semibold whitespace-nowrap ${
                    t.type === "inflow" ? "text-green-600" : "text-red-600"
                  }`}>
                    {t.type === "inflow" ? "+" : "-"}{formatCurrency(t.amount)}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!t.is_categorized && (
                        <DropdownMenuItem onClick={() => onCategorize(t)}>
                          🏷️ Categorize
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(t)}>
                        <Pencil className="w-3.5 h-3.5 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(t.id)}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}