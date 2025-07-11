"""Adicionar novas tabelas de finanças

Revision ID: 3c0c7b0ebe85
Revises: 6e6c3aae9447
Create Date: 2025-05-25 23:26:19.171325

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3c0c7b0ebe85'
down_revision: Union[str, None] = '6e6c3aae9447'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_index(op.f('ix_contas_a_pagar_id'), 'contas_a_pagar', ['id'], unique=False)
    op.create_index(op.f('ix_estoque_pessoal_id'), 'estoque_pessoal', ['id'], unique=False)
    op.alter_column('itens_da_lista', 'data_compra',
               existing_type=postgresql.TIMESTAMP(),
               type_=sa.DateTime(timezone=True),
               existing_nullable=True)
    op.create_index(op.f('ix_itens_da_lista_id'), 'itens_da_lista', ['id'], unique=False)
    op.alter_column('listas_de_compras', 'criado_em',
               existing_type=postgresql.TIMESTAMP(),
               type_=sa.DateTime(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.create_index(op.f('ix_listas_de_compras_id'), 'listas_de_compras', ['id'], unique=False)
    op.create_index(op.f('ix_metas_financeiras_id'), 'metas_financeiras', ['id'], unique=False)
    op.alter_column('transacoes', 'descricao',
               existing_type=sa.TEXT(),
               nullable=False)
    op.add_column('users', sa.Column('dashboard_layout_order', sa.Text(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('users', 'dashboard_layout_order')
    op.alter_column('transacoes', 'descricao',
               existing_type=sa.TEXT(),
               nullable=True)
    op.drop_index(op.f('ix_metas_financeiras_id'), table_name='metas_financeiras')
    op.drop_index(op.f('ix_listas_de_compras_id'), table_name='listas_de_compras')
    op.alter_column('listas_de_compras', 'criado_em',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.drop_index(op.f('ix_itens_da_lista_id'), table_name='itens_da_lista')
    op.alter_column('itens_da_lista', 'data_compra',
               existing_type=sa.DateTime(timezone=True),
               type_=postgresql.TIMESTAMP(),
               existing_nullable=True)
    op.drop_index(op.f('ix_estoque_pessoal_id'), table_name='estoque_pessoal')
    op.drop_index(op.f('ix_contas_a_pagar_id'), table_name='contas_a_pagar')
    # ### end Alembic commands ###
