import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AgentProvider, useAgents } from './context/AgentContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import AgentsPage from './pages/AgentsPage';
import AgentDetailPage from './pages/AgentDetailPage';
import WorkflowsPage from './pages/WorkflowsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import { ToastContainer } from './components/Toast';
import './App.css';

function AppContent() {
  const { toasts, removeToast } = useAgents();
  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
          <Route path="/agents" element={<ErrorBoundary><AgentsPage /></ErrorBoundary>} />
          <Route path="/agents/:agentId" element={<ErrorBoundary><AgentDetailPage /></ErrorBoundary>} />
          <Route path="/workflows" element={<ErrorBoundary><WorkflowsPage /></ErrorBoundary>} />
          <Route path="/integrations" element={<ErrorBoundary><IntegrationsPage /></ErrorBoundary>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AgentProvider>
          <ErrorBoundary>
            <div className="app">
              {/* NVIDIA-inspired floating background particles */}
              <div className="particle-1" /><div className="particle-2" /><div className="particle-3" />
              <div className="particle-4" /><div className="particle-5" /><div className="particle-6" />
              <div className="particle-7" /><div className="particle-8" />
              <AppContent />
            </div>
          </ErrorBoundary>
        </AgentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
