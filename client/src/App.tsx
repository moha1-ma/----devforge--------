import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import AiWorkspace from "./pages/AiWorkspace";
import CodeWorkspace from "./pages/CodeWorkspace";
import GithubWorkspace from "./pages/GithubWorkspace";
import PlansWorkspace from "./pages/PlansWorkspace";
import ImageStudio from "./pages/ImageStudio";
import WebsiteStudio from "./pages/WebsiteStudio";
import DomainGallery from "./pages/DomainGallery";
import IntegrationCenter from "./pages/IntegrationCenter";
import DeveloperCenter from "./pages/DeveloperCenter";
import VisitorSubmissionPage from "./pages/VisitorSubmissionPage";
import VisitorReviewCenter from "./pages/VisitorReviewCenter";
import VisitorMessagesPage from "./pages/VisitorMessagesPage";
import CommunityHub from "./pages/CommunityHub";
import CommunityReviewCenter from "./pages/CommunityReviewCenter";
import JavaScriptWorkstation from "./pages/JavaScriptWorkstation";
import PeriodicDevelopmentCenter from "./pages/PeriodicDevelopmentCenter";
import Workspace from "./pages/Workspace";
import ApiReferencePage from "./pages/ApiReferencePage";
import GlobalResearchHub from "./pages/GlobalResearchHub";
import MarketplaceHub from "./pages/MarketplaceHub";
import MarketplaceReviewCenter from "./pages/MarketplaceReviewCenter";
import AiTaskRouter from "./pages/AiTaskRouter";
import TechnicalPartnerHub from "./pages/TechnicalPartnerHub";
import ContinuityCenter from "./pages/ContinuityCenter";
import ApiControlCenter from "./pages/ApiControlCenter";
import JavaScriptMigrationCenter from "./pages/JavaScriptMigrationCenter";
import MiniWorkstations from "./pages/MiniWorkstations";
import NotificationCenter from "./pages/NotificationCenter";
import AzizMarketHub from "./pages/AzizMarketHub";
import AzizDesignReviewCenter from "./pages/AzizDesignReviewCenter";

const toHashHref = (href: string) => `#${href}`;

function AppRoutes() {
  return (
    <WouterRouter hook={useHashLocation} hrefs={toHashHref}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/workspace" component={Workspace} />
        <Route path="/projects" component={Workspace} />
        <Route path="/work-items" component={Workspace} />
        <Route path="/pull-requests" component={Workspace} />
        <Route path="/releases" component={Workspace} />
        <Route path="/code" component={CodeWorkspace} />
        <Route path="/ai" component={AiWorkspace} />
        <Route path="/github" component={GithubWorkspace} />
        <Route path="/plans" component={PlansWorkspace} />
        <Route path="/image-studio" component={ImageStudio} />
        <Route path="/website-studio" component={WebsiteStudio} />
        <Route path="/domains" component={DomainGallery} />
        <Route path="/integrations" component={IntegrationCenter} />
        <Route path="/developer-center" component={DeveloperCenter} />
        <Route path="/share" component={VisitorSubmissionPage} />
        <Route path="/visitor-review" component={VisitorReviewCenter} />
        <Route path="/visitor/messages" component={VisitorMessagesPage} />
        <Route path="/community" component={CommunityHub} />
        <Route path="/community-review" component={CommunityReviewCenter} />
        <Route path="/javascript-lab" component={JavaScriptWorkstation} />
        <Route path="/periodic-development" component={PeriodicDevelopmentCenter} />
        <Route path="/api" component={ApiReferencePage} />
        <Route path="/global-research" component={GlobalResearchHub} />
        <Route path="/marketplace" component={MarketplaceHub} />
        <Route path="/marketplace-review" component={MarketplaceReviewCenter} />
        <Route path="/aziz-market" component={AzizMarketHub} />
        <Route path="/aziz-market-review" component={AzizDesignReviewCenter} />
        <Route path="/ai-router" component={AiTaskRouter} />
        <Route path="/partners" component={TechnicalPartnerHub} />
        <Route path="/continuity" component={ContinuityCenter} />
        <Route path="/api-control" component={ApiControlCenter} />
        <Route path="/javascript-migration" component={JavaScriptMigrationCenter} />
        <Route path="/mini-workstations" component={MiniWorkstations} />
        <Route path="/notifications" component={NotificationCenter} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark" switchable>
          <TooltipProvider>
            <Toaster richColors position="top-center" />
            <AppRoutes />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
