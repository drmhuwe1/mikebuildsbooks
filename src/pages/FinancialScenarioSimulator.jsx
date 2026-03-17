import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import ScenarioForm from "@/components/simulator/ScenarioForm";
import ScenarioResults from "@/components/simulator/ScenarioResults";
import ScenarioCharts from "@/components/simulator/ScenarioCharts";
import ScenarioComparison from "@/components/simulator/ScenarioComparison";
import ScenarioWizard from "@/components/simulator/ScenarioWizard";
import GuidedPrompt from "@/components/shared/GuidedPrompt";
import { calculateScenarioProjection, getBaselineFromData, generateMonthlyProjection, generateInsights } from "@/lib/scenarioCalculations";

export default function FinancialScenarioSimulator() {
  const [variables, setVariables] = useState({});
  const [currentResults, setCurrentResults] = useState(null);
  const [currentMonthlyData, setCurrentMonthlyData] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("simulator");
  const qc = useQueryClient();

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date", 200) });
  const { data: bills = [] } = useQuery({ queryKey: ["bills"], queryFn: () => base44.entities.Bill.list("-due_date", 200) });
  const { data: personalBills = [] } = useQuery({ queryKey: ["personalBills"], queryFn: () => base44.entities.PersonalBill.list("-due_date", 200) });
  const { data: scenarios = [] } = useQuery({ queryKey: ["scenarios"], queryFn: () => base44.entities.FinancialScenario.filter({ is_saved: true }) });
  const { data: bankAccounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => base44.entities.BankAccount.list("-created_date", 200) });

  const saveScenarioMutation = useMutation({
    mutationFn: (data) => base44.entities.FinancialScenario.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scenarios"] }),
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialScenario.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scenarios"] }),
  });

  const baseline = useMemo(() => getBaselineFromData(jobs, bills, personalBills, bankAccounts), [jobs, bills, personalBills, bankAccounts]);

  const handleVariableChange = (key, value) => {
    setVariables(v => ({ ...v, [key]: value }));
  };

  const handleCalculate = () => {
    const results = calculateScenarioProjection(variables, baseline, jobs, bills, personalBills);
    const monthlyData = generateMonthlyProjection(variables, baseline, 12);
    const insights = generateInsights(variables, results, baseline);
    
    setCurrentResults(results);
    setCurrentMonthlyData(monthlyData);
  };

  const handleSaveScenario = async (scenarioData) => {
    const results = calculateScenarioProjection(scenarioData.variables, baseline, jobs, bills, personalBills);
    saveScenarioMutation.mutate({
      ...scenarioData,
      is_saved: true,
      baseline_data: baseline,
      projection_results: results,
      projection_months: 12,
    });
    setWizardOpen(false);
  };

  const insights = currentResults ? generateInsights(variables, currentResults, baseline) : [];

  return (
    <div>
      <PageHeader
        title="Financial Scenario Simulator"
        description="Test financial decisions before implementing them"
        actionLabel="New Scenario"
        onAction={() => setWizardOpen(true)}
      >
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export Report
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="simulator">Simulator</TabsTrigger>
          <TabsTrigger value="compare">Compare Scenarios ({scenarios.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="simulator" className="mt-6 space-y-6">
          <GuidedPrompt 
            message="Adjust variables below to see how different decisions impact your finances. Use sliders and inputs to explore scenarios."
            variant="info"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-1">
              <ScenarioForm
                variables={variables}
                onVariableChange={handleVariableChange}
                onCalculate={handleCalculate}
                baselineData={baseline}
              />
            </div>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">
              {currentResults && (
                <>
                  <ScenarioResults
                    results={currentResults}
                    baseline={baseline}
                    insights={insights}
                  />
                  <ScenarioCharts monthlyData={currentMonthlyData} />
                </>
              )}

              {!currentResults && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Adjust variables and click "Calculate Projections" to see results.</p>
                </div>
              )}
            </div>
          </div>

          {currentResults && (
            <Button
              onClick={() => {
                const scenarioData = {
                  name: `Scenario - ${new Date().toLocaleDateString()}`,
                  description: `Custom scenario with ${Object.entries(variables).filter(([,v]) => v !== 0).length} variables`,
                  scenario_type: "custom",
                  variables,
                };
                handleSaveScenario(scenarioData);
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" /> Save This Scenario for Comparison
            </Button>
          )}
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          {scenarios.length >= 2 ? (
            <ScenarioComparison
              scenarios={scenarios}
              onDelete={deleteScenarioMutation.mutate}
            />
          ) : (
            <GuidedPrompt
              message={`You have ${scenarios.length} saved scenario(s). Create at least 2 scenarios to compare them side-by-side.`}
              variant="info"
            />
          )}
        </TabsContent>
      </Tabs>

      <ScenarioWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSave={handleSaveScenario}
      />
    </div>
  );
}