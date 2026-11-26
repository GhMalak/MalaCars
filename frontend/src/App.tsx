import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuthCallback from './pages/AuthCallback'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Account from './pages/dashboard/Account'
import Security from './pages/dashboard/Security'
import Overview from './pages/dashboard/Overview'
import Vehicles from './pages/dashboard/Vehicles'
import VehicleDetail from './pages/dashboard/VehicleDetail'
import Drivers from './pages/dashboard/Drivers'
import DriverDetail from './pages/dashboard/DriverDetail'
import Contracts from './pages/dashboard/Contracts'
import ContractDetail from './pages/dashboard/ContractDetail'
import Expenses from './pages/dashboard/Expenses'
import Financial from './pages/dashboard/Financial'
import Maintenances from './pages/dashboard/Maintenances'
import Reminders from './pages/dashboard/Reminders'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="veiculos" element={<Vehicles />} />
          <Route path="veiculos/:id" element={<VehicleDetail />} />
          <Route path="motoristas" element={<Drivers />} />
          <Route path="motoristas/:id" element={<DriverDetail />} />
          <Route path="contratos" element={<Contracts />} />
          <Route path="contratos/:id" element={<ContractDetail />} />
          <Route path="financeiro" element={<Financial />} />
          <Route path="gastos" element={<Expenses />} />
          <Route path="manutencoes" element={<Maintenances />} />
          <Route path="lembretes" element={<Reminders />} />
          <Route path="conta" element={<Account />} />
          <Route path="seguranca" element={<Security />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
