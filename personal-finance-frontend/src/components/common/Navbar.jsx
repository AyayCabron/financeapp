import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false); // Começa fechado

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Botão fixo para abrir o menu */}
      {!menuOpen && (
        <button className="menu-button" onClick={toggleMenu} aria-label="Abrir menu">
          <FiMenu size={24} />
        </button>
      )}

      {/* Sidebar lateral */}
      <aside className={`sidebar ${menuOpen ? 'open' : 'collapsed'}`} aria-label="Menu lateral">
        <div className="sidebar-header">
          <h2 className="sidebar-logo">FinanceApp</h2>
          <button onClick={toggleMenu} className="sidebar-toggle" aria-label="Fechar menu">
            <FiX size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-list">
            <li>
              <Link to="/dashboard" className="sidebar-link">Dashboard</Link>
            </li>
            <li>
              <Link to="/accounts" className="sidebar-link">Contas</Link>
            </li>
            <li>
              <Link to="/transactions" className="sidebar-link">Transações</Link>
            </li>
            <li>
              <Link to="/categories" className="sidebar-link">Categorias</Link>
            </li>
            <li>
              <button onClick={handleLogout} className="sidebar-link logout">Sair</button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Navbar;
