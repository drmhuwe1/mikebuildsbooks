import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PlatformStability from "@/components/admin/PlatformStability";
import CalcHealthCheck from "@/components/admin/CalcHealthCheck";
import AutomatedCrawl from "@/components/admin/stability/AutomatedCrawl";
import FreezeDriftPanel from "@/components/admin/stability/FreezeDriftPanel";
import CorrectivePrompts from "@/components/admin/stability/CorrectivePrompts";
import FeatureInventory from "@/components/admin/stability/FeatureInventory";

export default function StabilityCenter() {
  const [crawlResults, setCrawlResults] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Stability Center</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Unified stability monitoring: self-test scans, automated route crawling, freeze/drift protection,
          regression detection, corrective prompt generation, and feature inventory.
        </p>
      </div>

      <Tabs defaultValue="scan">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-0 flex-wrap">
          {[
            { value: "scan", label: "Stability Scan" },
            { value: "crawl", label: "Automated Crawl" },
            { value: "freeze", label: "Freeze / Drift" },
            { value: "prompts", label: "Corrective Prompts" },
            { value: "inventory", label: "Feature Inventory" },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm font-medium"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="scan" className="mt-6 space-y-8">
          <PlatformStability />
          <div className="border-t pt-8">
            <CalcHealthCheck />
          </div>
        </TabsContent>

        <TabsContent value="crawl" className="mt-6">
          <AutomatedCrawl onCrawlComplete={setCrawlResults} />
        </TabsContent>

        <TabsContent value="freeze" className="mt-6">
          <FreezeDriftPanel crawlResults={crawlResults} />
        </TabsContent>

        <TabsContent value="prompts" className="mt-6">
          <CorrectivePrompts />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <FeatureInventory />
        </TabsContent>
      </Tabs>
    </div>
  );
}