# personal_finance_api/routes/summary_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, case, extract
from datetime import datetime, timedelta

from database.db import SessionLocal
from database.models import Transacao, Categoria, Conta

# O Blueprint deve ter o url_prefix '/dashboard' para corresponder ao frontend
summary_bp = Blueprint('summary', __name__, url_prefix='/dashboard')

# --- Endpoint para Gastos por Categoria (Gráfico de Pizza) ---
@summary_bp.route('/category-spending', methods=['GET']) # Rota ajustada para '/category-spending'
@jwt_required()
def get_category_spending():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        # Pega parâmetros de data opcionais do frontend
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        query = db.query(
            Categoria.nome,
            func.sum(Transacao.valor)
        ).join(Transacao).filter(
            Transacao.user_id == current_user_id,
            Transacao.tipo == 'expense' # Apenas despesas para este gráfico
        )

        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str)
                query = query.filter(Transacao.data >= start_date)
            except ValueError:
                return jsonify({"message": "Formato de data de início inválido. Use AAAA-MM-DD."}), 400
        
        if end_date_str:
            try:
                # Adiciona um dia e subtrai um microssegundo para incluir o dia inteiro na busca
                end_date = datetime.fromisoformat(end_date_str) + timedelta(days=1) - timedelta(microseconds=1)
                query = query.filter(Transacao.data <= end_date)
            except ValueError:
                return jsonify({"message": "Formato de data de fim inválido. Use AAAA-MM-DD."}), 400

        query = query.group_by(Categoria.nome).order_by(func.sum(Transacao.valor).desc())

        results = query.all()

        spending_data = [
            {"category_name": nome, "total_spent": float(valor)}
            for nome, valor in results
        ]

        if not spending_data:
            return jsonify({"message": "Nenhum gasto por categoria encontrado para o período."}), 404

        return jsonify(spending_data), 200

    except Exception as e:
        db.rollback()
        print(f"Erro ao buscar gastos por categoria: {e}")
        return jsonify({"message": f"Ocorreu um erro ao gerar o relatório de gastos por categoria: {str(e)}"}), 500
    finally:
        db.close()

# --- NOVO ENDPOINT: Entradas por Categoria (Gráfico de Pizza) ---
@summary_bp.route('/category-income', methods=['GET']) # Nova rota para receitas por categoria
@jwt_required()
def get_category_income():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        query = db.query(
            Categoria.nome,
            func.sum(Transacao.valor)
        ).join(Transacao).filter(
            Transacao.user_id == current_user_id,
            Transacao.tipo == 'income' # Apenas receitas para este gráfico
        )

        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str)
                query = query.filter(Transacao.data >= start_date)
            except ValueError:
                return jsonify({"message": "Formato de data de início inválido. Use AAAA-MM-DD."}), 400
        
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str) + timedelta(days=1) - timedelta(microseconds=1)
                query = query.filter(Transacao.data <= end_date)
            except ValueError:
                return jsonify({"message": "Formato de data de fim inválido. Use AAAA-MM-DD."}), 400

        query = query.group_by(Categoria.nome).order_by(func.sum(Transacao.valor).desc())

        results = query.all()

        income_data = [
            {"category_name": nome, "total_income": float(valor)} # 'total_income' em vez de 'total_spent'
            for nome, valor in results
        ]

        if not income_data:
            return jsonify({"message": "Nenhuma entrada por categoria encontrada para o período."}), 404

        return jsonify(income_data), 200

    except Exception as e:
        db.rollback()
        print(f"Erro ao buscar entradas por categoria: {e}")
        return jsonify({"message": f"Ocorreu um erro ao gerar o relatório de entradas por categoria: {str(e)}"}), 500
    finally:
        db.close()

# --- Endpoint para Receita vs. Despesa por Mês (Gráfico de Barras/Linha) ---
@summary_bp.route('/income-vs-expense', methods=['GET'])
@jwt_required()
def get_income_vs_expense():
    user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=6*30) # Últimos 6 meses aproximados

        # Extrai o ano e o mês para agrupar as transações
        # to_char é uma função PostgreSQL específica, para outros bancos seria extract(year FROM Transacao.data), extract(month FROM Transacao.data)
        month_label = func.to_char(Transacao.data, 'YYYY-MM').label('period')

        results = db.query(
            month_label,
            func.sum(case((Transacao.tipo == 'income', Transacao.valor), else_=0)).label('total_income'),
            func.sum(case((Transacao.tipo == 'expense', Transacao.valor), else_=0)).label('total_expense')
        ).filter(
            Transacao.user_id == user_id,
            Transacao.data >= start_date,
            Transacao.data <= end_date
        ).group_by(
            month_label
        ).order_by(
            month_label # Garante a ordem cronológica
        ).all()

        income_expense_data = []
        for period, income, expense in results:
            income_expense_data.append({
                "period": period,
                "income": float(income),
                "expense": float(expense)
            })

        if not income_expense_data:
            return jsonify({"message": "Nenhum dado de receita vs. despesa encontrado para o período."}), 404

        return jsonify(income_expense_data), 200

    except Exception as e:
        db.rollback()
        print(f"Erro ao buscar receita vs. despesa: {e}")
        return jsonify({"message": f"Ocorreu um erro ao gerar o relatório: {str(e)}"}), 500
    finally:
        db.close()


# --- Endpoint para Saldo de Contas ao Longo do Tempo (Gráfico de Linha) ---
@summary_bp.route('/account_balances_over_time', methods=['GET'])
@jwt_required()
def get_saldos_contas_ao_longo_do_tempo(): # Renomeado para get_saldos_contas_ao_longo_do_tempo
    user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        # Para este gráfico, vamos pegar o saldo atual de cada conta.
        # Se você quiser um histórico de saldo, precisaria de um modelo de 'AccountSnapshot'
        # ou calcular com base nas transações passadas até certas datas.
        # Por simplicidade, vamos retornar o saldo atual.

        # Pega todas as contas do usuário
        contas = db.query(Conta).filter_by(user_id=user_id).all()
        
        data = []
        for conta in contas:
            # Para um gráfico de linha "ao longo do tempo", idealmente teríamos múltiplos pontos no tempo.
            # Aqui, para cada conta, estamos apenas retornando o saldo atual.
            # Se você quer um gráfico de linha que mostra a evolução do saldo de uma conta específica,
            # a lógica seria mais complexa (e.g., somar transações anteriores até uma data).
            data.append({
                "account_name": conta.nome, # Alterado "account_name" para "nome_conta", account.name para conta.nome
                "balance": float(conta.saldo), # Alterado "balance" para "saldo", account.balance para conta.saldo
                "date": datetime.now().isoformat() # Representa o saldo atual
            })

        if not data:
            return jsonify({"message": "Nenhuma conta encontrada para o usuário para gerar o gráfico de saldo."}), 404

        return jsonify(data), 200
    except Exception as e:
        db.rollback()
        print(f"Erro ao buscar saldos de contas ao longo do tempo: {e}")
        return jsonify({"message": f"Ocorreu um erro ao buscar saldos de contas: {str(e)}"}), 500
    finally:
        db.close()