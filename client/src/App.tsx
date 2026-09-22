import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";
import BlogPost from "./pages/BlogPost";
import Overview from "./pages/Overview";
import Finance from "./pages/Finance";
import Habits from "./pages/Habits";
import Cerebro from "./pages/Cerebro";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      {/* Ferramenta interna, tela cheia: fica fora do Layout do site. */}
      <Route path="/acesso" component={Login} />
      <Route path="/board">
        <Redirect to="/interno" replace />
      </Route>
      <Route path="/interno">
        <ProtectedRoute returnTo="/interno">
          <Overview />
        </ProtectedRoute>
      </Route>
      <Route path="/financeiro">
        <ProtectedRoute returnTo="/financeiro">
          <Finance />
        </ProtectedRoute>
      </Route>
      <Route path="/habitos">
        <ProtectedRoute returnTo="/habitos">
          <Habits />
        </ProtectedRoute>
      </Route>
      <Route path="/cerebro">
        <ProtectedRoute returnTo="/cerebro">
          <Cerebro />
        </ProtectedRoute>
      </Route>
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/projetos/:slug" component={ProjectDetail} />
            <Route path="/blog/:slug" component={BlogPost} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <AuthProvider>
          <LanguageProvider>
            <Router />
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
