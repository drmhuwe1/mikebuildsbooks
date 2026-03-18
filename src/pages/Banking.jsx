import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, ArrowUpRight, ArrowDownRight, RefreshCw, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import AccountSummaryCard from "@/components/banking/AccountSummaryCard";
import TransactionActivityFeed from "@/components/banking/TransactionActivityFeed";
import SpendingBreakdown from "@/components/banking/SpendingBreakdown";
import CashFlowChart from "@/components/banking/CashFlowChart";
import TransactionCategoryizer from "@/components/banking/TransactionCategoryizer";
import AccountConnectWizard from "@/components/banking/AccountConnectWizard";
import { formatCurrency, formatDate } from "@/lib/formatters";

const emptyTxn = { description: "", amount: 0, type: "inflow", date: "", category: "other", bank_account_id: "", bank_account_name: "", account_category: "business", job_id: "", job_title: "", vendor: "", is_categorized: false, notes: "" };

export default function Banking() {
  const [tab, setTab] = useState("business");
  const [connectWizardOpen, setConnectWizardOpen] = useState(false);
  const [txnDialog, setTxnDialog] = useState(false);
  const [txnForm, setTxnForm] = useState(emptyTxn);
  const [editTxnId, setEditTxnId] = useState(null);
  const [categorizerOpen, setCategorizerOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const qc = useQueryClient();

  const { data: accounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => base44.entities.BankAccount.list("-created_date", 100) });
  const { data: txns = [] } = useQuery({ queryKey: ["bankTxns"], queryFn: () => base44.entities.BankTransaction.list("-date", 1000) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });

  const saveTxn = useMutation({
    mutationFn: (d) => editTxnId ? base44.entities.BankTransaction.update(editTxnId, d) : base44.entities.BankTransaction.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bankTxns"] }); setTxnDialog(false); setEditTxnId(null); setTxnForm(emptyTxn); },
  });

  const saveAccount = useMutation({
    mutationFn: (d) => base44.entities.BankAccount.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bankAccounts"] }); },
  });

  const deleteTxn = useMutation({ mutationFn: (id) => base44.entities.BankTransaction.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["bankTxns"] }) });
  const deleteAccount = useMutation({ mutationFn: (id) => base44.entities.BankAccount.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["bankAccounts"] }) });

  const businessAccounts = accounts.filter(a => a.account_category === "business");
  const personalAccounts = accounts.filter(a => a.account_category === "personal");

  const businessTxns = txns.filter(t => t.account_category === "business");
  const personalTxns = txns.filter(t => t.account_category === "personal");

  const businessBalance = businessAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);
  const personalBalance = personalAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);

  const businessIncome = businessTxns.filter(t => t.type === "inflow").reduce((s, t) => s + (t.amount || 0), 0);
  const businessExpense = businessTxns.filter(t => t.type === "outflow").reduce((s, t) => s + (t.amount || 0), 0);
  const personalIncome = personalTxns.filter(t => t.type === "inflow").reduce((s, t) => s + (t.amount || 0), 0);
  const personalExpense = personalTxns.filter(t => t.type === "outflow").reduce((s, t) => s + (t.amount || 0), 0);

  const uncategorized = txns.filter(t => !t.is_categorized);

  const handleRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["bankAccounts", "bankTxns"] });
    setRefreshing(false);
  };

  const handleEditTxn = (txn) => {
    setTxnForm(txn);
    setEditTxnId(txn.id);
    setTxnDialog(true);
  };

  const handleCategorizeTxn = (txn) => {
    setSelectedTxn(txn);
    setCategorizerOpen(true);
  };

  const handleSaveCategorizer = async (txn) => {
    await saveTxn.mutateAsync(txn);
    setCategorizerOpen(false);
  };

  return (
    <div>
      <PageHeader title="Banking & Cash Flow" description="Track accounts, transactions, and cash flow" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Balance" value={formatCurrency(totalBalance)} icon={Building2} />
        <StatCard title="Total Inflow" value={formatCurrency(inflow)} icon={ArrowUpRight} />
        <StatCard title="Total Outflow" value={formatCurrency(outflow)} icon={ArrowDownRight} />
      </div>

      {uncategorized.length > 0 && <GuidedPrompt message={`${uncategorized.length} transaction(s) are uncategorized.`} variant="warning" />}

      <div className="flex items-center justify-between mt-4 mb-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList><TabsTrigger value="accounts">Accounts</TabsTrigger><TabsTrigger value="transactions">Transactions</TabsTrigger></TabsList>
        </Tabs>
        <Button size="sm" onClick={() => tab === "accounts" ? (setAccountForm(emptyAccount), setEditAccountId(null), setAccountDialog(true)) : (setTxnForm(emptyTxn), setEditTxnId(null), setTxnDialog(true))}>
          <Plus className="w-4 h-4 mr-1" /> Add {tab === "accounts" ? "Account" : "Transaction"}
        </Button>
      </div>

      {tab === "accounts" ? (
        accounts.length === 0 ? (
          <EmptyState icon={Building2} title="No bank accounts" description="Add your bank accounts to track balances." actionLabel="Add Account" onAction={() => setAccountDialog(true)} />
        ) : (
          <div className="grid gap-3">
            {accounts.map(a => (
              <Card key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.institution || "—"} · {a.account_type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-base font-bold">{formatCurrency(a.current_balance)}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setAccountForm({ name: a.name, institution: a.institution || "", account_type: a.account_type || "checking", current_balance: a.current_balance || 0, status: a.status || "active" }); setEditAccountId(a.id); setAccountDialog(true); }}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteAccount.mutate(a.id)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        txns.length === 0 ? (
          <EmptyState icon={Building2} title="No transactions" description="Add transactions to track cash flow." actionLabel="Add Transaction" onAction={() => setTxnDialog(true)} />
        ) : (
          <div className="space-y-2">
            {txns.map(t => (
              <Card key={t.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === "inflow" ? "bg-green-100" : "bg-red-100"}`}>
                    {t.type === "inflow" ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <ArrowDownRight className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.date)} · {t.category} {t.job_title ? `· ${t.job_title}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${t.type === "inflow" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "inflow" ? "+" : "-"}{formatCurrency(t.amount)}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setTxnForm({ description: t.description, amount: t.amount || 0, type: t.type || "inflow", date: t.date || "", category: t.category || "other", bank_account_id: t.bank_account_id || "", bank_account_name: t.bank_account_name || "", job_id: t.job_id || "", job_title: t.job_title || "", vendor: t.vendor || "", is_categorized: t.is_categorized || false, notes: t.notes || "" }); setEditTxnId(t.id); setTxnDialog(true); }}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteTxn.mutate(t.id)}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Account Dialog */}
      <Dialog open={accountDialog} onOpenChange={setAccountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editAccountId ? "Edit Account" : "New Account"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={accountForm.name} onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Institution</Label><Input value={accountForm.institution} onChange={e => setAccountForm(f => ({ ...f, institution: e.target.value }))} /></div>
              <div><Label>Type</Label>
                <Select value={accountForm.account_type} onValueChange={v => setAccountForm(f => ({ ...f, account_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="checking">Checking</SelectItem><SelectItem value="savings">Savings</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Current Balance</Label><Input type="number" value={accountForm.current_balance} onChange={e => setAccountForm(f => ({ ...f, current_balance: parseFloat(e.target.value) || 0 }))} /></div>
            <Button className="w-full" onClick={() => saveAccount.mutate(accountForm)} disabled={!accountForm.name || saveAccount.isPending}>
              {saveAccount.isPending ? "Saving..." : editAccountId ? "Update" : "Create Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={txnDialog} onOpenChange={setTxnDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editTxnId ? "Edit Transaction" : "New Transaction"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Description *</Label><Input value={txnForm.description} onChange={e => setTxnForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Amount *</Label><Input type="number" value={txnForm.amount} onChange={e => setTxnForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label>Type</Label>
                <Select value={txnForm.type} onValueChange={v => setTxnForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="inflow">Inflow</SelectItem><SelectItem value="outflow">Outflow</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Date *</Label><Input type="date" value={txnForm.date} onChange={e => setTxnForm(f => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={txnForm.category} onValueChange={v => setTxnForm(f => ({ ...f, category: v, is_categorized: true }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Account</Label>
                <Select value={txnForm.bank_account_id} onValueChange={v => { setTxnForm(f => ({ ...f, bank_account_id: v, bank_account_name: accounts.find(a => a.id === v)?.name || "" })); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Job</Label>
                <Select value={txnForm.job_id} onValueChange={v => setTxnForm(f => ({ ...f, job_id: v, job_title: jobs.find(j => j.id === v)?.title || "" }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent><SelectItem value=" ">None</SelectItem>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Vendor</Label><Input value={txnForm.vendor} onChange={e => setTxnForm(f => ({ ...f, vendor: e.target.value }))} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={txnForm.notes} onChange={e => setTxnForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button className="w-full" onClick={() => saveTxn.mutate(txnForm)} disabled={!txnForm.description || !txnForm.date || saveTxn.isPending}>
              {saveTxn.isPending ? "Saving..." : editTxnId ? "Update" : "Add Transaction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}