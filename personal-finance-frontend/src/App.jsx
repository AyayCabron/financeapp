// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Sheets from './components/Sheets/Sheets';
import SmartCalculator from './components/SmartCalculator/SmartCalculator'; 
import Lists from './components/Lists/Lists'; 
import FunctionGuide from './components/FunctionGuide/FunctionGuide';
import FinancialAgenda from './components/Financial/FinancialAgenda';
import Goals from './components/Goals/Goals';
import Achievements from './components/Achievements/Achievements';
import Analyst from './components/Analyst/Analyst';
function App() {
  return (
    <Routes>
      {/* Rotas públicas (acessíveis sem login) */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rotas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sheets" element={<Sheets />} />
        <Route path="/smart-calculator" element={<SmartCalculator />} /> 
        <Route path="/lists" element={<Lists />} />
        <Route path="/guide" element={<FunctionGuide />} />
        <Route path="/financial-agenda" element={<FinancialAgenda />} />
        <Route path="/goals-objectives" element={<Goals />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/analyst" element={<Analyst />} />
      </Route>

      {/* Rota para caminhos não encontrados */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;