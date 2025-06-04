// src/components/Transactions/TransactionList.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const TransactionList = forwardRef(({ onEditTransaction }, ref) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Formata data ISO para dd/mm/yyyy
  const formatDateBR = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const fetchTransactions = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (err) {
      console.error("Erro ao buscar transações:", err.response?.data || err.message);
      setError("Falha ao carregar transações. Verifique sua conexão ou tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchTransactions
  }));

  useEffect(() => {
    fetchTransactions();
  }, [isAuthenticated]);

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      try {
        await api.delete(`/transactions/${transactionId}`);
        alert('Transação excluída com sucesso!');
        fetchTransactions();
      } catch (err) {
        console.error("Erro ao excluir transação:", err.response?.data || err.message);
        alert('Falha ao excluir transação. Tente novamente.');
      }
    }
  };

  if (loading) {
    return <p>Carregando transações...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', maxWidth: '720px', margin: 'auto' }}>
      <h2 style={{ borderBottom: '2px solid #2980b9', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#2c3e50' }}>Minhas Transações</h2>
      {transactions.length === 0 ? (
        <p>Você ainda não tem transações registradas.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f7f6' }}>
              <th style={thStyle}>Data</th>
              <th style={thStyle}>Descrição</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Valor (R$)</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={tdStyle}>{formatDateBR(transaction.date)}</td>
                <td style={tdStyle}>{transaction.description}</td>
                <td style={tdStyle}>{transaction.type}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{transaction.amount.toFixed(2)}</td>
                <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => onEditTransaction(transaction)}
                    style={btnEditStyle}
                    aria-label={`Editar transação ${transaction.description}`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    style={btnDeleteStyle}
                    aria-label={`Excluir transação ${transaction.description}`}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});

const thStyle = {
  textAlign: 'left',
  padding: '0.75rem 1rem',
  color: '#4a4a58',
  fontWeight: '600',
  fontSize: '0.95rem',
};

const tdStyle = {
  padding: '0.75rem 1rem',
  color: '#2c3e50',
  fontSize: '0.9rem',
};

const btnEditStyle = {
  backgroundColor: '#2980b9',
  color: '#fff',
  border: 'none',
  padding: '0.35rem 0.75rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '0.85rem',
  transition: 'background-color 0.3s ease',
};

const btnDeleteStyle = {
  backgroundColor: '#c0392b',
  color: '#fff',
  border: 'none',
  padding: '0.35rem 0.75rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '0.85rem',
  transition: 'background-color 0.3s ease',
};

export default TransactionList;
