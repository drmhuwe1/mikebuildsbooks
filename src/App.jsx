import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Landing from '@/pages/Landing';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import Jobs from '@/pages/Jobs';
import BidBuilder from '@/pages/BidBuilder';
import Contracts from '@/pages/Contracts';
import BillsCalendarUnified from '@/pages/BillsCalendarUnified';
import Subcontractors from '@/pages/Subcontractors';
import PayoutEngine from '@/pages/PayoutEngine';
import Banking from '@/pages/Banking';
import JobTimeline from '@/pages/JobTimeline';
import Documents from '@/pages/Documents';
import Settings from '@/pages/Settings';
import DocGenerator from '@/pages/DocGenerator';
import DailyAssistant from '@/pages/DailyAssistant';
import AdminPanel from '@/pages/AdminPanel';
import CustomerAccount from '@/pages/CustomerAccount';
import TaxExport from '@/pages/TaxExport';
import BusinessFinancials from '@/pages/BusinessFinancials';
import PersonalFinancials from '@/pages/PersonalFinancials';
import FinancialSnapshot from '@/pages/FinancialSnapshot';
import FinancialGoals from '@/pages/FinancialGoals';
import FinancialScenarioSimulator from '@/pages/FinancialScenarioSimulator';
import OperationsCommandCenter from '@/pages/OperationsCommandCenter';
import FinancialAlerts from '@/pages/FinancialAlerts';
import JobCalendar from '@/pages/JobCalendar';
import Invoicing from '@/pages/Invoicing';
import HelpGuide from '@/pages/HelpGuide';
import PermitDrawingWizard from '@/pages/PermitDrawingWizard';
import UnifiedDesignWorkflow from '@/pages/UnifiedDesignWorkflow';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    // Show landing while auth loads
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/Landing" replace />} />
        <Route path="/Landing" element={<Landing />} />
        <Route path="*" element={
          <div className="fixed inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
          </div>
        } />
      </Routes>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Not logged in — show landing, redirect everything else to landing with login redirect
      return (
        <Routes>
          <Route path="/" element={<Navigate to="/Landing" replace />} />
          <Route path="/Landing" element={<Landing />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      );
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Dashboard" replace />} />
      <Route path="/Landing" element={<Navigate to="/Dashboard" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Clients" element={<Clients />} />
        <Route path="/Jobs" element={<Jobs />} />
        <Route path="/BidBuilder" element={<BidBuilder />} />
        <Route path="/Contracts" element={<Contracts />} />
        <Route path="/BillsCalendarUnified" element={<BillsCalendarUnified />} />
        <Route path="/Subcontractors" element={<Subcontractors />} />
        <Route path="/PayoutEngine" element={<PayoutEngine />} />
        <Route path="/Banking" element={<Banking />} />
        <Route path="/JobTimeline" element={<JobTimeline />} />
        <Route path="/Documents" element={<Documents />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="/DocGenerator" element={<DocGenerator />} />
        <Route path="/DailyAssistant" element={<DailyAssistant />} />
        <Route path="/FinancialAlerts" element={<FinancialAlerts />} />
        <Route path="/AdminPanel" element={<AdminPanel />} />
        <Route path="/CustomerAccount" element={<CustomerAccount />} />
        <Route path="/TaxExport" element={<TaxExport />} />
        <Route path="/BusinessFinancials" element={<BusinessFinancials />} />
        <Route path="/PersonalFinancials" element={<PersonalFinancials />} />
        <Route path="/FinancialSnapshot" element={<FinancialSnapshot />} />
        <Route path="/FinancialGoals" element={<FinancialGoals />} />
        <Route path="/FinancialScenarioSimulator" element={<FinancialScenarioSimulator />} />
        <Route path="/OperationsCommandCenter" element={<OperationsCommandCenter />} />
        <Route path="/JobCalendar" element={<JobCalendar />} />
        <Route path="/Invoicing" element={<Invoicing />} />
        <Route path="/HelpGuide" element={<HelpGuide />} />
        <Route path="/PermitDrawingWizard" element={<PermitDrawingWizard />} />
        <Route path="/UnifiedDesignWorkflow" element={<UnifiedDesignWorkflow />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App