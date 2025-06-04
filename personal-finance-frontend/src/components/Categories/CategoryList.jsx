// src/components/Categories/CategoryList.jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext'; // Para obter o token

const CategoryList = forwardRef(({ onEditCategory }, ref) => {
  const [categories, setCategories] = useState([]);
  const { user } = useAuth(); // Obtenha o usuário autenticado

  // Função para buscar as categorias do backend
  const fetchCategories = async () => {
    if (!user) {
      setCategories([]); // Limpa as categorias se não houver usuário logado
      return;
    }
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error("Erro ao buscar categorias:", err.response?.data || err.message);
      alert('Falha ao carregar categorias.');
    }
  };

  // Exponha a função fetchCategories para o componente pai via ref
  useImperativeHandle(ref, () => ({
    fetchCategories
  }));

  // Busca as categorias ao montar o componente e quando o usuário muda
  useEffect(() => {
    fetchCategories();
  }, [user]); // Adiciona 'user' como dependência para recarregar ao fazer login/logout

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        await api.delete(`/categories/${categoryId}`);
        alert('Categoria excluída com sucesso!');
        fetchCategories(); // Recarrega a lista após a exclusão
      } catch (err) {
        console.error("Erro ao excluir categoria:", err.response?.data || err.message);
        // Verifica se o erro é devido a transações associadas
        if (err.response && err.response.status === 400) {
          alert('Não foi possível excluir a categoria: existem transações associadas a ela.');
        } else {
          alert('Falha ao excluir categoria.');
        }
      }
    }
  };

  return (
    <div>
      <h2>Minhas Categorias</h2>
      {categories.length === 0 ? (
        <p>Nenhuma categoria encontrada. Adicione uma nova!</p>
      ) : (
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              {category.name} ({category.type})
              <button onClick={() => onEditCategory(category)} style={{ marginLeft: '10px' }}>
                Editar
              </button>
              <button onClick={() => handleDeleteCategory(category.id)} style={{ marginLeft: '10px', backgroundColor: '#dc3545' }}>
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default CategoryList;