import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, ArrowUpRight, ArrowDownRight, RefreshCw, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import AccountSummaryCard from "@/components/banking/AccountSummaryCard.jsx";
import TransactionActivityFeed from "@/components/banking/TransactionActivityFeed.jsx";
import SpendingBreakdown from "@/components/banking/SpendingBreakdown.jsx";
import CashFlowChart from "@/components/banking/CashFlowChart.jsx";
import TransactionCategoryizer from "@/components/banking/TransactionCategoryizer.jsx";
import AccountConnectWizard from "@/components/banking/AccountConnectWizard.jsx";
import { formatCurrency, formatDate } from "@/lib/formatters";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";

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
  const [accountEditOpen, setAccountEditOpen] = useState(false);
  const [accountEditId, setAccountEditId] = useState(null);
  const [accountEditForm, setAccountEditForm] = useState({
    name: "",
    institution: "",
    account_type: "checking",
    current_balance: 0,
    available_balance: "",
  });
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

  const updateAccount = useMutation({
    mutationFn: ({ id, ...patch }) => base44.entities.BankAccount.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bankAccounts"] });
      setAccountEditOpen(false);
      setAccountEditId(null);
    },
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
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["bankAccounts"] }),
      qc.invalidateQueries({ queryKey: ["bankTxns"] }),
    ]);
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

  const openAccountEdit = (account) => {
    setAccountEditId(account.id);
    setAccountEditForm({
      name: account.name || "",
      institution: account.institution || "",
      account_type: account.account_type || "checking",
      current_balance: account.current_balance ?? 0,
      available_balance: account.available_balance != null && account.available_balance !== "" ? account.available_balance : "",
    });
    setAccountEditOpen(true);
  };

  const saveAccountEdit = () => {
    if (!accountEditId) return;
    const patch = {
      name: accountEditForm.name,
      institution: accountEditForm.institution,
      account_type: accountEditForm.account_type,
      current_balance: Number(accountEditForm.current_balance) || 0,
      available_balance:
        accountEditForm.available_balance === "" || accountEditForm.available_balance == null
          ? null
          : Number(accountEditForm.available_balance) || 0,
    };
    updateAccount.mutate({ id: accountEditId, ...patch });
  };

  return (
    <SubscriptionGate feature="banking">
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="Banking & Cash Flow" description="Track business and personal accounts separately" />
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Syncing..." : "Refresh"}
        </Button>
      </div>

      {uncategorized.length > 0 && (
        <GuidedPrompt
          message={`${uncategorized.length} transaction(s) need categorization.`}
          variant="warning"
        />
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="combined">Combined</TabsTrigger>
        </TabsList>

        {/* Business Tab */}
        {tab === "business" && (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Business Cash" value={formatCurrency(businessBalance)} icon={Building2} />
              <StatCard title="Monthly Income" value={formatCurrency(businessIncome)} icon={ArrowUpRight} />
              <StatCard title="Monthly Expenses" value={formatCurrency(businessExpense)} icon={ArrowDownRight} />
            </div>

            {/* Accounts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Business Accounts</h3>
                <Button size="sm" onClick={() => setConnectWizardOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Connect Account
                </Button>
              </div>
              {businessAccounts.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No business accounts connected.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businessAccounts.map(a => (
                    <AccountSummaryCard
                      key={a.id}
                      account={a}
                      onEdit={openAccountEdit}
                      onDelete={(id) => deleteAccount.mutate(id)}
                      onSync={(id) => handleRefresh()}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendingBreakdown transactions={businessTxns} type="expense" />
              <SpendingBreakdown transactions={businessTxns} type="income" />
            </div>

            <CashFlowChart transactions={businessTxns} />

            {/* Transactions */}
            <div>
              <h3 className="font-semibold mb-4">Transaction Activity</h3>
              <TransactionActivityFeed
                transactions={businessTxns}
                accounts={businessAccounts}
                onEdit={handleEditTxn}
                onDelete={(id) => deleteTxn.mutate(id)}
                onCategorize={handleCategorizeTxn}
              />
            </div>
          </div>
        )}

        {/* Personal Tab */}
        {tab === "personal" && (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Personal Cash" value={formatCurrency(personalBalance)} icon={Building2} />
              <StatCard title="Monthly Income" value={formatCurrency(personalIncome)} icon={ArrowUpRight} />
              <StatCard title="Monthly Expenses" value={formatCurrency(personalExpense)} icon={ArrowDownRight} />
            </div>

            {/* Accounts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Personal Accounts</h3>
                <Button size="sm" onClick={() => setConnectWizardOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Connect Account
                </Button>
              </div>
              {personalAccounts.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No personal accounts connected.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personalAccounts.map(a => (
                    <AccountSummaryCard
                      key={a.id}
                      account={a}
                      onEdit={openAccountEdit}
                      onDelete={(id) => deleteAccount.mutate(id)}
                      onSync={(id) => handleRefresh()}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendingBreakdown transactions={personalTxns} type="expense" />
              <SpendingBreakdown transactions={personalTxns} type="income" />
            </div>

            <CashFlowChart transactions={personalTxns} />

            {/* Transactions */}
            <div>
              <h3 className="font-semibold mb-4">Transaction Activity</h3>
              <TransactionActivityFeed
                transactions={personalTxns}
                accounts={personalAccounts}
                onEdit={handleEditTxn}
                onDelete={(id) => deleteTxn.mutate(id)}
                onCategorize={handleCategorizeTxn}
              />
            </div>
          </div>
        )}

        {/* Combined Tab */}
        {tab === "combined" && (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Business Cash</p>
                <p className="text-2xl font-bold">{formatCurrency(businessBalance)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Personal Cash</p>
                <p className="text-2xl font-bold">{formatCurrency(personalBalance)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Combined</p>
                <p className="text-2xl font-bold">{formatCurrency(businessBalance + personalBalance)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Net Monthly Flow</p>
                <p className={`text-2xl font-bold ${
                  (businessIncome + personalIncome) - (businessExpense + personalExpense) >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency((businessIncome + personalIncome) - (businessExpense + personalExpense))}
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CashFlowChart transactions={[...businessTxns, ...personalTxns]} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Business Accounts ({businessAccounts.length})</p>
                    <p className="text-lg font-bold">{formatCurrency(businessBalance)}</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground mb-2">Personal Accounts ({personalAccounts.length})</p>
                    <p className="text-lg font-bold">{formatCurrency(personalBalance)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Tabs>

      {/* Transaction Dialog */}
      <Dialog open={txnDialog} onOpenChange={setTxnDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTxnId ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description *</Label>
              <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={txnForm.description} onChange={e => setTxnForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Amount *</Label>
                <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={txnForm.amount} onChange={e => setTxnForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={txnForm.type} onValueChange={v => setTxnForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inflow">Inflow</SelectItem>
                    <SelectItem value="outflow">Outflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date *</Label>
                <input type="date" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={txnForm.date} onChange={e => setTxnForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={txnForm.category} onValueChange={v => setTxnForm(f => ({ ...f, category: v, is_categorized: true }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="subcontractor">Subcontractor</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="tools_equipment">Tools/Equipment</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="groceries">Groceries</SelectItem>
                    <SelectItem value="housing">Housing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Account</Label>
                <Select value={txnForm.bank_account_id} onValueChange={v => {
                  const acc = accounts.find(a => a.id === v);
                  setTxnForm(f => ({
                    ...f,
                    bank_account_id: v,
                    bank_account_name: acc?.name || "",
                    account_category: acc?.account_category || "business"
                  }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Job (Optional)</Label>
                <Select value={txnForm.job_id} onValueChange={v => setTxnForm(f => ({ ...f, job_id: v || "", job_title: v ? jobs.find(j => j.id === v)?.title || "" : "" }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vendor</Label>
                <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={txnForm.vendor} onChange={e => setTxnForm(f => ({ ...f, vendor: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={txnForm.notes} onChange={e => setTxnForm(f => ({ ...f, notes: e.target.value }))} placeholder="Add notes..." rows={2} />
            </div>

            <Button className="w-full" onClick={() => saveTxn.mutate(txnForm)} disabled={!txnForm.description || !txnForm.date || saveTxn.isPending}>
              {saveTxn.isPending ? "Saving..." : editTxnId ? "Update" : "Add Transaction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit bank account */}
      <Dialog
        open={accountEditOpen}
        onOpenChange={(open) => {
          setAccountEditOpen(open);
          if (!open) setAccountEditId(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="acct-name">Display name</Label>
              <Input
                id="acct-name"
                value={accountEditForm.name}
                onChange={(e) => setAccountEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="acct-inst">Institution</Label>
              <Input
                id="acct-inst"
                value={accountEditForm.institution}
                onChange={(e) => setAccountEditForm((f) => ({ ...f, institution: e.target.value }))}
              />
            </div>
            <div>
              <Label>Account type</Label>
              <Select
                value={accountEditForm.account_type}
                onValueChange={(v) => setAccountEditForm((f) => ({ ...f, account_type: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="acct-bal">Current balance</Label>
              <Input
                id="acct-bal"
                type="number"
                step="0.01"
                value={accountEditForm.current_balance}
                onChange={(e) =>
                  setAccountEditForm((f) => ({ ...f, current_balance: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div>
              <Label htmlFor="acct-avail">Available balance (optional)</Label>
              <Input
                id="acct-avail"
                type="number"
                step="0.01"
                placeholder="Same as current if empty"
                value={accountEditForm.available_balance}
                onChange={(e) =>
                  setAccountEditForm((f) => ({ ...f, available_balance: e.target.value }))
                }
              />
            </div>
            <Button
              className="w-full"
              onClick={saveAccountEdit}
              disabled={!accountEditForm.name?.trim() || updateAccount.isPending}
            >
              {updateAccount.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Connect Wizard */}
      <AccountConnectWizard
        open={connectWizardOpen}
        onClose={() => setConnectWizardOpen(false)}
        onSave={(formData) => saveAccount.mutateAsync(formData)}
      />

      {/* Categorizer */}
      <TransactionCategoryizer
        open={categorizerOpen}
        transaction={selectedTxn}
        onClose={() => setCategorizerOpen(false)}
        onSave={handleSaveCategorizer}
      />
    </div>
    </SubscriptionGate>
  );
}