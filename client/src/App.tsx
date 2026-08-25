import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";
import BlogPost from "./pages/BlogPost";
import Board from "./pages/Board";
import Habits from "./pages/Habits";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      {/* Ferramenta interna, tela cheia: fica fora do Layout do site. */}
      <Route path="/acesso" component={Login} />
      <Route path="/board">
        <ProtectedRoute returnTo="/board">
          <Board />
        </ProtectedRoute>
      </Route>
      <Route path="/habitos">
        <ProtectedRoute returnTo="/habitos">
          <Habits />
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
