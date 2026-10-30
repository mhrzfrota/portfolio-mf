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
import Noite, { NoitePrevia } from "./pages/Noite";
import Login from "./pages/Login";
import Bio from "./pages/Bio";
import Radar from "./pages/Radar";

function Router() {
  return (
    <Switch>
      {/* Ferramenta interna, tela cheia: fica fora do Layout do site. */}
      <Route path="/acesso" component={Login} />
      {/* Link da bio do Instagram: tela própria, sem a topbar e o rodapé do site. */}
      <Route path="/bio" component={Bio} />
      <Route path="/links">
        <Redirect to="/bio" replace />
      </Route>
      {/* O sistema interno é Calendário, Plano e Noite; os endereços antigos caem no Calendário. */}
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
      <Route path="/noite">
        <ProtectedRoute returnTo="/noite">
          <Noite />
        </ProtectedRoute>
      </Route>
      <Route path="/radar">
        <ProtectedRoute returnTo="/radar">
          <Radar />
        </ProtectedRoute>
      </Route>
      {/* Só no pnpm dev: prévia do relatório sem login, abrindo o arquivo salvo no Mac. */}
      {import.meta.env.DEV && <Route path="/dev/noite" component={NoitePrevia} />}
      {/* A home virou um app de tela cheia com dock próprio (2026-10-29):
          fica fora do Layout, como a /bio. Cases e blog seguem no Layout. */}
      <Route path="/" component={Home} />
      <Route>
        <Layout>
          <Switch>
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
