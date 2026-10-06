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
import Plano from "./pages/Plano";
import Calendario from "./pages/Calendario";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      {/* Ferramenta interna, tela cheia: fica fora do Layout do site. */}
      <Route path="/acesso" component={Login} />
      {/* O sistema interno é só Calendário e Plano; os endereços antigos caem no Calendário. */}
      <Route path="/board">
        <Redirect to="/calendario" replace />
      </Route>
      <Route path="/interno">
        <Redirect to="/calendario" replace />
      </Route>
      <Route path="/financeiro">
        <Redirect to="/calendario" replace />
      </Route>
      <Route path="/habitos">
        <Redirect to="/calendario" replace />
      </Route>
      <Route path="/cerebro">
        <Redirect to="/calendario" replace />
      </Route>
      <Route path="/plano">
        <ProtectedRoute returnTo="/plano">
          <Plano />
        </ProtectedRoute>
      </Route>
      <Route path="/calendario">
        <ProtectedRoute returnTo="/calendario">
          <Calendario />
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
