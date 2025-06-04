// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../api/axios'; // Certifique-se de que o caminho está correto

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token')); // Tenta pegar o token do localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(!!token); // É autenticado se houver token
  const [loading, setLoading] = useState(true); // Estado para indicar se o carregamento inicial terminou

  // Função para validar o token e buscar dados do usuário
  const validateToken = useCallback(async () => {
    if (token) {
      // Configura o token no cabeçalho padrão do Axios para todas as requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        // CORRIGIDO: O endpoint /user está dentro do blueprint /auth
        const response = await api.get('/auth/user');
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Erro ao validar token ou buscar dados do usuário:", error.response?.data || error.message);
        // Se o token for inválido/expirado, remove-o
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false); // Carregamento inicial terminou
  }, [token]); // Recria a função se o token mudar

  // Efeito para validar o token ao carregar o componente
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // Função de login
  const login = async (email, password) => {
    setLoading(true);
    try {
      // CORRIGIDO: O endpoint /login está dentro do blueprint /auth
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data; // Desestrutura user data do response

      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData); // Define os dados do usuário
      setIsAuthenticated(true);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`; // Define o token para futuras requisições
      return true; // Login bem-sucedido
    } catch (error) {
      console.error("Erro no login:", error.response?.data || error.message);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('token');
      return false; // Login falhou
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÃO DE REGISTRO: O QUE ESTAVA FALTANDO ---
  const register = async (username, email, password) => {
    setLoading(true); // Opcional: Adicione um estado de carregamento para o registro também
    try {
      // O endpoint de registro no backend é /auth/register
      const response = await api.post('/auth/register', { username, email, password });

      if (response.status === 201) { // 201 Created é o status esperado para registro bem-sucedido
        console.log('Registro bem-sucedido:', response.data);
        // Não logamos o usuário automaticamente após o registro.
        // O Register.jsx já navega para /login em caso de sucesso.
        return true; // Indica sucesso
      } else {
        // Se o status não for 201, mas for um erro de validação (ex: 409 Conflict)
        const errorData = response.data;
        console.error('Erro no registro:', errorData.message || 'Erro desconhecido');
        return false; // Indica falha
      }
    } catch (error) {
      console.error('Erro de rede ou na requisição de registro:', error.response?.data || error.message);
      return false; // Indica falha
    } finally {
      setLoading(false); // Opcional: Finaliza o carregamento
    }
  };
  // --- FIM DA FUNÇÃO DE REGISTRO ---


  // Função de logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common['Authorization']; // Remove o token do Axios
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, register }}> {/* Exponha a função de registro */}
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};