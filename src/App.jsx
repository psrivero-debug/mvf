import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Layout from './components/Layout';
import Landing from './pages/Landing';
import Ius from './pages/Ius';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients';
import Cases from './pages/Cases';
import Documents from './pages/Documents';
import DocumentDrafting from './pages/DocumentDrafting';
import LegalConsultant from './pages/LegalConsultant';
import Consultas from './pages/Consultas';
import Requisitos from './pages/Requisitos';
import EstudioCaso from './pages/EstudioCaso';
import Recibos from './pages/Recibos';
import Presupuestos from './pages/Presupuestos';
import InterpretarDocumento from './pages/InterpretarDocumento';
import Legajos from './pages/Legajos';
import Calendario from './pages/Calendario';
import Publicidad from './pages/Publicidad';
import ConcursoQuiebraPage from './pages/ConcursoQuiebraPage';
import Facturacion from './pages/Facturacion';
import EscritorJudicial from './pages/EscritorJudicial';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/causas" element={<Cases />} />
        <Route path="/documentos" element={<Documents />} />
        <Route path="/redaccion" element={<DocumentDrafting />} />
        <Route path="/consulta" element={<LegalConsultant />} />
        <Route path="/consultas" element={<Consultas />} />
        <Route path="/requisitos" element={<Requisitos />} />
        <Route path="/estudio-caso" element={<EstudioCaso />} />
        <Route path="/recibos" element={<Recibos />} />
        <Route path="/presupuestos" element={<Presupuestos />} />
        <Route path="/interpretar" element={<InterpretarDocumento />} />
        <Route path="/legajos" element={<Legajos />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/publicidad" element={<Publicidad />} />
        <Route path="/concurso-quiebra" element={<ConcursoQuiebraPage />} />
        <Route path="/facturacion" element={<Facturacion />} />
        <Route path="/escritor-judicial" element={<EscritorJudicial />} />
      </Route>
        <Route path="/web" element={<Landing />} />
        <Route path="/ius" element={<Ius />} />
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