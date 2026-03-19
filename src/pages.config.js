/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminPanel from './pages/AdminPanel';
import Banking from './pages/Banking';
import BidBuilder from './pages/BidBuilder';
import BillsCalendar from './pages/BillsCalendar';
import BillsCalendarUnified from './pages/BillsCalendarUnified';
import BusinessFinancials from './pages/BusinessFinancials';
import Clients from './pages/Clients';
import Contracts from './pages/Contracts';
import CustomerAccount from './pages/CustomerAccount';
import DailyAssistant from './pages/DailyAssistant';
import Dashboard from './pages/Dashboard';
import DocGenerator from './pages/DocGenerator';
import Documents from './pages/Documents';
import FinancialAlerts from './pages/FinancialAlerts';
import FinancialGoals from './pages/FinancialGoals';
import FinancialScenarioSimulator from './pages/FinancialScenarioSimulator';
import FinancialSnapshot from './pages/FinancialSnapshot';
import HelpGuide from './pages/HelpGuide';
import Invoicing from './pages/Invoicing';
import JobCalendar from './pages/JobCalendar';
import JobTimeline from './pages/JobTimeline';
import Jobs from './pages/Jobs';
import Landing from './pages/Landing';
import OperationsCommandCenter from './pages/OperationsCommandCenter';
import PayoutEngine from './pages/PayoutEngine';
import PermitDrawingWizard from './pages/PermitDrawingWizard';
import PersonalBills from './pages/PersonalBills';
import PersonalBillsCalendar from './pages/PersonalBillsCalendar';
import PersonalFinancials from './pages/PersonalFinancials';
import Settings from './pages/Settings';
import Subcontractors from './pages/Subcontractors';
import TaxExport from './pages/TaxExport';
import UnifiedDesignWorkflow from './pages/UnifiedDesignWorkflow';
import PrivacyPolicy from './pages/PrivacyPolicy';


export const PAGES = {
    "AdminPanel": AdminPanel,
    "Banking": Banking,
    "BidBuilder": BidBuilder,
    "BillsCalendar": BillsCalendar,
    "BillsCalendarUnified": BillsCalendarUnified,
    "BusinessFinancials": BusinessFinancials,
    "Clients": Clients,
    "Contracts": Contracts,
    "CustomerAccount": CustomerAccount,
    "DailyAssistant": DailyAssistant,
    "Dashboard": Dashboard,
    "DocGenerator": DocGenerator,
    "Documents": Documents,
    "FinancialAlerts": FinancialAlerts,
    "FinancialGoals": FinancialGoals,
    "FinancialScenarioSimulator": FinancialScenarioSimulator,
    "FinancialSnapshot": FinancialSnapshot,
    "HelpGuide": HelpGuide,
    "Invoicing": Invoicing,
    "JobCalendar": JobCalendar,
    "JobTimeline": JobTimeline,
    "Jobs": Jobs,
    "Landing": Landing,
    "OperationsCommandCenter": OperationsCommandCenter,
    "PayoutEngine": PayoutEngine,
    "PermitDrawingWizard": PermitDrawingWizard,
    "PersonalBills": PersonalBills,
    "PersonalBillsCalendar": PersonalBillsCalendar,
    "PersonalFinancials": PersonalFinancials,
    "Settings": Settings,
    "Subcontractors": Subcontractors,
    "TaxExport": TaxExport,
    "UnifiedDesignWorkflow": UnifiedDesignWorkflow,
    "PrivacyPolicy": PrivacyPolicy,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
};