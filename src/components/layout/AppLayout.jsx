import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import PWAInstallBanner from "@/components/pwa/PWAInstallBanner";
import ChatBot from "@/components/chatbot/ChatBot";
import { useBillBadge } from "@/hooks/useBillBadge";
import {
  LayoutDashboard, Users, Briefcase, FileText, FileCheck,
  Calendar, HardHat, DollarSign, Building2, Clock,
  FolderOpen, Settings, ChevronRight, Home, Sparkles, Receipt,
  BarChart2, TrendingUp, User, Target, Zap, AlertTriangle, HelpCircle, Hammer, Menu, X
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { label: "Operations Command Center", path: "/OperationsCommandCenter", icon: Zap },
  { label: "Dashboard", path: "/Dashboard", icon: LayoutDashboard },
  { label: "Daily Assistant", path: "/DailyAssistant", icon: Sparkles },
  { label: "Financial Alerts", path: "/FinancialAlerts", icon: AlertTriangle },
  { label: "Financial Snapshot", path: "/FinancialSnapshot", icon: BarChart2 },
  { label: "Business Financials", path: "/BusinessFinancials", icon: TrendingUp },
  { label: "Personal Financials", path: "/PersonalFinancials", icon: User },
  { label: "Financial Goals", path: "/FinancialGoals", icon: Target },
  { label: "Scenario Simulator", path: "/FinancialScenarioSimulator", icon: Zap },
  { label: "Clients", path: "/Clients", icon: Users },
  { label: "Jobs", path: "/Jobs", icon: Briefcase },
  { label: "Smart Bid Builder", path: "/SmartBidBuilder", icon: Sparkles },
  { label: "Bid Builder (Classic)", path: "/BidBuilder", icon: FileText },
  { label: "Quick Bid (AI)", path: "/QuickBid", icon: Zap },
  { label: "Contracts", path: "/Contracts", icon: FileCheck },
  { label: "Change Orders", path: "/ChangeOrders", icon: FileText },
  { label: "Bills Calendar", path: "/BillsCalendarUnified", icon: Calendar },
  { label: "Personal Bills Calendar", path: "/PersonalBillsCalendar", icon: Home },
  { label: "Subcontractors", path: "/Subcontractors", icon: HardHat },
  { label: "Payout Engine", path: "/PayoutEngine", icon: DollarSign },
  { label: "Banking", path: "/Banking", icon: Building2 },
  { label: "Job Timeline", path: "/JobTimeline", icon: Clock },
  { label: "Documents", path: "/Documents", icon: FolderOpen },
  { label: "Doc Generator", path: "/DocGenerator", icon: FileText },
  { label: "Permit Drawings", path: "/PermitDrawingWizard", icon: Hammer },
  { label: "Expenses", path: "/Expenses", icon: Receipt },
  { label: "Tax Export", path: "/TaxExport", icon: Receipt },
  { label: "Settings", path: "/Settings", icon: Settings },
  { label: "My Account", path: "/CustomerAccount", icon: Users },
  { label: "Help & Guide", path: "/HelpGuide", icon: HelpCircle },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  useBillBadge();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside style={{width: sidebarOpen ? '256px' : '0', minWidth: sidebarOpen ? '256px' : '0'}} className="shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-full overflow-hidden transition-all duration-200">
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <Link to="/Landing">
            <img
              src="https://media.base44.com/images/public/69b9774720c1d890b1162f57/77973bc53_MikeBuildsBooksLogo.png"
              alt="MikeBuildsBooks"
              className="h-10 w-auto object-contain hover:opacity-80 transition-opacity"
            />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <ScrollArea className="flex-1 py-3">
          <nav className="px-3 flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}

                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }
                  `}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="border-b border-border bg-card shrink-0">
          <div className="h-12 flex items-center px-4 gap-3">
            <button onClick={() => setSidebarOpen(o => !o)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-foreground truncate">
              {navItems.find(i => i.path === location.pathname)?.label || "MikeBuildsBooks"}
            </h1>
          </div>
        </header>

        <SubscriptionBanner />
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 pb-56 lg:pb-6 max-w-7xl mx-auto">
            <Outlet />
          </div>

        </main>
      </div>
      <PWAInstallBanner />
      <ChatBot />
    </div>
  );
}