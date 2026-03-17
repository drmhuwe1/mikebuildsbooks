import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ScenarioCharts({ monthlyData }) {
  if (!monthlyData || monthlyData.length === 0) return null;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="profit" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profit">Profit Trend</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="revenue">Revenue vs Expenses</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative Profit</TabsTrigger>
        </TabsList>

        <TabsContent value="profit" className="mt-4">
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" label={{ value: "Month", position: "insideBottomRight", offset: -5 }} />
                <YAxis />
                <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="profit" stroke="#fbbf24" fill="#fbbf2422" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="mt-4">
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                <Bar dataKey="cash_flow" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="cumulative" className="mt-4">
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="cumulative_profit" stroke="#8b5cf6" fill="#8b5cf622" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}