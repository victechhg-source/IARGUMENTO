import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import RequireProfile from '@/components/RequireProfile';
import RoleRoute from '@/components/RoleRoute';
import RedirectIfAuthenticated from '@/components/RedirectIfAuthenticated';
// Add page imports here
import Home from '@/pages/Home';
import Correction from '@/pages/Correction';
import Historico from '@/pages/Historico';
import EssayDetail from '@/pages/EssayDetail';
import TeacherDashboard from '@/pages/TeacherDashboard';
import StudentClasses from '@/pages/StudentClasses';
import StudentPerformance from '@/pages/StudentPerformance';
import AdminDashboard from '@/pages/AdminDashboard';
import DirectorDashboard from '@/pages/DirectorDashboard';
import ProfessorEssayDetail from '@/pages/ProfessorEssayDetail';
import SchoolDetail from '@/pages/SchoolDetail';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import CompleteSignup from '@/pages/CompleteSignup';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import OAuthConsent from '@/pages/OAuthConsent';
import ProtectedRoute from '@/components/ProtectedRoute';

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings, authError } = useAuth();

  // Spinner apenas enquanto as settings públicas do app carregam. A detecção
  // de autenticação é feita por rota (ProtectedRoute), permitindo que a landing
  // "/" e as telas de login/cadastro sejam acessíveis sem sessão.
  if (isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // "user_not_registered" é tratado por rota (ProtectedRoute), para não bloquear
  // a landing pública nem as telas de login/cadastro.

  return (
    <>
      <Routes>
        {/* Telas públicas de autenticação */}
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth-consent" element={<OAuthConsent />} />

        {/* Landing pública */}
        <Route path="/" element={<Home />} />

        {/* Rotas protegidas: exigem sessão ativa (dados individuais do aluno) */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/completar-cadastro" element={<CompleteSignup />} />

          {/* Sem vínculo institucional gravado, nenhuma tela do app abre */}
          <Route element={<RequireProfile />}>
            {/* Aluno */}
            <Route element={<RoleRoute allow={['student']} />}>
              <Route path="/correcao" element={<Correction />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/historico/:id" element={<EssayDetail />} />
              <Route path="/minhas-turmas" element={<StudentClasses />} />
            </Route>

            {/* Professor */}
            <Route element={<RoleRoute allow={['teacher']} />}>
              <Route path="/professor" element={<TeacherDashboard />} />
              <Route path="/professor/aluno/:studentId" element={<StudentPerformance />} />
              <Route path="/professor/redacao/:id" element={<ProfessorEssayDetail />} />
            </Route>

            {/* Diretor */}
            <Route element={<RoleRoute allow={['director']} />}>
              <Route path="/diretor" element={<DirectorDashboard />} />
            </Route>

            {/* Administração */}
            <Route element={<RoleRoute adminOnly />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/escolas/:id" element={<SchoolDetail />} />
            </Route>
          </Route>
        </Route>

        {/* Aliases legados */}
        <Route path="/StudentClasses" element={<Navigate to="/minhas-turmas" replace />} />
        <Route path="/Correction" element={<Navigate to="/correcao" replace />} />
        <Route path="/Historico" element={<Navigate to="/historico" replace />} />
        <Route path="/TeacherDashboard" element={<Navigate to="/professor" replace />} />
        <Route path="/AdminDashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/StudentPerformance" element={<Navigate to="/historico" replace />} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App