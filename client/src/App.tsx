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
import StripeLab from "./pages/StripeLab";
import WebsiteStudio from "./pages/WebsiteStudio";
import DomainGallery from "./pages/DomainGallery";
import IntegrationCenter from "./pages/IntegrationCenter";
import DeveloperCenter from "./pages/DeveloperCenter";
import Workspace from "./pages/Workspace";

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
        <Route path="/stripe-lab" component={StripeLab} />
        <Route path="/code" component={CodeWorkspace} />
        <Route path="/ai" component={AiWorkspace} />
        <Route path="/github" component={GithubWorkspace} />
        <Route path="/plans" component={PlansWorkspace} />
        <Route path="/image-studio" component={ImageStudio} />
        <Route path="/website-studio" component={WebsiteStudio} />
        <Route path="/domains" component={DomainGallery} />
        <Route path="/integrations" component={IntegrationCenter} />
        <Route path="/developer-center" component={DeveloperCenter} />
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
