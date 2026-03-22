import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { lazy, Suspense as ReactSuspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Landing from '@/pages/Landing';
import AppLayout from '@/components/layout/AppLayout';

const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const FAQ = lazy(() => import('@/pages/FAQ'));

// Lazy-loaded pages (split into separate bundles)
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Clients = lazy(() => import('@/pages/Clients'));
const Jobs = lazy(() => import('@/pages/Jobs'));
const BidBuilder = lazy(() => import('@/pages/BidBuilder'));
const SmartBidBuilder = lazy(() => import('@/pages/SmartBidBuilder'));
const AIEstimateBuilder = lazy(() => import('@/pages/AIEstimateBuilder'));
const Contracts = lazy(() => import('@/pages/Contracts'));
const BillsCalendarUnified = lazy(() => import('@/pages/BillsCalendarUnified'));
const Subcontractors = lazy(() => import('@/pages/Subcontractors'));
const PayoutEngine = lazy(() => import('@/pages/PayoutEngine'));
const Banking = lazy(() => import('@/pages/Banking'));
const JobTimeline = lazy(() => import('@/pages/JobTimeline'));
const Documents = lazy(() => import('@/pages/Documents'));
const Settings = lazy(() => import('@/pages/Settings'));
const DocGenerator = lazy(() => import('@/pages/DocGenerator'));
const DailyAssistant = lazy(() => import('@/pages/DailyAssistant'));
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const CustomerAccount = lazy(() => import('@/pages/CustomerAccount'));
const TaxExport = lazy(() => import('@/pages/TaxExport'));
const BusinessFinancials = lazy(() => import('@/pages/BusinessFinancials'));
const PersonalFinancials = lazy(() => import('@/pages/PersonalFinancials'));
const FinancialSnapshot = lazy(() => import('@/pages/FinancialSnapshot'));
const FinancialGoals = lazy(() => import('@/pages/FinancialGoals'));
const FinancialScenarioSimulator = lazy(() => import('@/pages/FinancialScenarioSimulator'));
const OperationsCommandCenter = lazy(() => import('@/pages/OperationsCommandCenter'));
const FinancialAlerts = lazy(() => import('@/pages/FinancialAlerts'));
const JobCalendar = lazy(() => import('@/pages/JobCalendar'));
const Invoicing = lazy(() => import('@/pages/Invoicing'));
const HelpGuide = lazy(() => import('@/pages/HelpGuide'));
const PermitDrawingWizard = lazy(() => import('@/pages/PermitDrawingWizard'));
const UnifiedDesignWorkflow = lazy(() => import('@/pages/UnifiedDesignWorkflow'));
const PersonalBillsCalendar = lazy(() => import('@/pages/PersonalBillsCalendar'));
const Expenses = lazy(() => import('@/pages/Expenses'));
const QuickBid = lazy(() => import('@/pages/QuickBid'));
const ChangeOrders = lazy(() => import('@/pages/ChangeOrders'));
const ChangeOrderApproval = lazy(() => import('@/pages/ChangeOrderApproval'));
const BidPackageWizard = lazy(() => import('@/pages/BidPackageWizard'));

const PageLoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
  </div>
);

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
      <Route path="/Landing" element={<Landing />} />
      <Route path="/change-order-approval" element={<ReactSuspense fallback={<PageLoadingFallback />}><ChangeOrderApproval /></ReactSuspense>} />
      <Route path="/privacy-policy" element={<ReactSuspense fallback={<PageLoadingFallback />}><PrivacyPolicy /></ReactSuspense>} />
      <Route path="/privacy" element={<ReactSuspense fallback={<PageLoadingFallback />}><PrivacyPolicy /></ReactSuspense>} />
      <Route path="/Privacy" element={<ReactSuspense fallback={<PageLoadingFallback />}><PrivacyPolicy /></ReactSuspense>} />
      <Route path="/terms" element={<ReactSuspense fallback={<PageLoadingFallback />}><TermsOfService /></ReactSuspense>} />
      <Route path="/about" element={<ReactSuspense fallback={<PageLoadingFallback />}><About /></ReactSuspense>} />
      <Route path="/contact" element={<ReactSuspense fallback={<PageLoadingFallback />}><Contact /></ReactSuspense>} />
      <Route path="/FAQ" element={<ReactSuspense fallback={<PageLoadingFallback />}><FAQ /></ReactSuspense>} />
      <Route element={<AppLayout />}>
        <Route path="/Dashboard" element={<ReactSuspense fallback={<PageLoadingFallback />}><Dashboard /></ReactSuspense>} />
        <Route path="/Clients" element={<ReactSuspense fallback={<PageLoadingFallback />}><Clients /></ReactSuspense>} />
        <Route path="/Jobs" element={<ReactSuspense fallback={<PageLoadingFallback />}><Jobs /></ReactSuspense>} />
        <Route path="/BidBuilder" element={<ReactSuspense fallback={<PageLoadingFallback />}><BidBuilder /></ReactSuspense>} />
        <Route path="/SmartBidBuilder" element={<ReactSuspense fallback={<PageLoadingFallback />}><SmartBidBuilder /></ReactSuspense>} />
        <Route path="/AIEstimateBuilder" element={<ReactSuspense fallback={<PageLoadingFallback />}><AIEstimateBuilder /></ReactSuspense>} />
        <Route path="/Contracts" element={<ReactSuspense fallback={<PageLoadingFallback />}><Contracts /></ReactSuspense>} />
        <Route path="/BillsCalendarUnified" element={<ReactSuspense fallback={<PageLoadingFallback />}><BillsCalendarUnified /></ReactSuspense>} />
        <Route path="/Subcontractors" element={<ReactSuspense fallback={<PageLoadingFallback />}><Subcontractors /></ReactSuspense>} />
        <Route path="/PayoutEngine" element={<ReactSuspense fallback={<PageLoadingFallback />}><PayoutEngine /></ReactSuspense>} />
        <Route path="/Banking" element={<ReactSuspense fallback={<PageLoadingFallback />}><Banking /></ReactSuspense>} />
        <Route path="/JobTimeline" element={<ReactSuspense fallback={<PageLoadingFallback />}><JobTimeline /></ReactSuspense>} />
        <Route path="/Documents" element={<ReactSuspense fallback={<PageLoadingFallback />}><Documents /></ReactSuspense>} />
        <Route path="/Settings" element={<ReactSuspense fallback={<PageLoadingFallback />}><Settings /></ReactSuspense>} />
        <Route path="/DocGenerator" element={<ReactSuspense fallback={<PageLoadingFallback />}><DocGenerator /></ReactSuspense>} />
        <Route path="/DailyAssistant" element={<ReactSuspense fallback={<PageLoadingFallback />}><DailyAssistant /></ReactSuspense>} />
        <Route path="/FinancialAlerts" element={<ReactSuspense fallback={<PageLoadingFallback />}><FinancialAlerts /></ReactSuspense>} />
        <Route path="/AdminPanel" element={<ReactSuspense fallback={<PageLoadingFallback />}><AdminPanel /></ReactSuspense>} />
        <Route path="/CustomerAccount" element={<ReactSuspense fallback={<PageLoadingFallback />}><CustomerAccount /></ReactSuspense>} />
        <Route path="/TaxExport" element={<ReactSuspense fallback={<PageLoadingFallback />}><TaxExport /></ReactSuspense>} />
        <Route path="/BusinessFinancials" element={<ReactSuspense fallback={<PageLoadingFallback />}><BusinessFinancials /></ReactSuspense>} />
        <Route path="/PersonalFinancials" element={<ReactSuspense fallback={<PageLoadingFallback />}><PersonalFinancials /></ReactSuspense>} />
        <Route path="/FinancialSnapshot" element={<ReactSuspense fallback={<PageLoadingFallback />}><FinancialSnapshot /></ReactSuspense>} />
        <Route path="/FinancialGoals" element={<ReactSuspense fallback={<PageLoadingFallback />}><FinancialGoals /></ReactSuspense>} />
        <Route path="/FinancialScenarioSimulator" element={<ReactSuspense fallback={<PageLoadingFallback />}><FinancialScenarioSimulator /></ReactSuspense>} />
        <Route path="/OperationsCommandCenter" element={<ReactSuspense fallback={<PageLoadingFallback />}><OperationsCommandCenter /></ReactSuspense>} />
        <Route path="/JobCalendar" element={<ReactSuspense fallback={<PageLoadingFallback />}><JobCalendar /></ReactSuspense>} />
        <Route path="/Invoicing" element={<ReactSuspense fallback={<PageLoadingFallback />}><Invoicing /></ReactSuspense>} />
        <Route path="/HelpGuide" element={<ReactSuspense fallback={<PageLoadingFallback />}><HelpGuide /></ReactSuspense>} />
        <Route path="/PermitDrawingWizard" element={<ReactSuspense fallback={<PageLoadingFallback />}><PermitDrawingWizard /></ReactSuspense>} />
        <Route path="/UnifiedDesignWorkflow" element={<ReactSuspense fallback={<PageLoadingFallback />}><UnifiedDesignWorkflow /></ReactSuspense>} />
        <Route path="/PersonalBillsCalendar" element={<ReactSuspense fallback={<PageLoadingFallback />}><PersonalBillsCalendar /></ReactSuspense>} />
        <Route path="/Expenses" element={<ReactSuspense fallback={<PageLoadingFallback />}><Expenses /></ReactSuspense>} />
        <Route path="/QuickBid" element={<ReactSuspense fallback={<PageLoadingFallback />}><QuickBid /></ReactSuspense>} />
        <Route path="/ChangeOrders" element={<ReactSuspense fallback={<PageLoadingFallback />}><ChangeOrders /></ReactSuspense>} />
        <Route path="/BidPackageWizard" element={<ReactSuspense fallback={<PageLoadingFallback />}><BidPackageWizard /></ReactSuspense>} />
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