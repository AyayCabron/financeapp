"""Aumentar tamanho da senha hash

Revision ID: 6e6c3aae9447
Revises: dab7e983c132
Create Date: 2025-05-23 19:19:34.204144

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6e6c3aae9447'
down_revision: Union[str, None] = 'dab7e983c132'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(length=128),
               type_=sa.String(length=512),
               existing_nullable=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('users', 'hashed_password',
               existing_type=sa.String(length=512),
               type_=sa.VARCHAR(length=128),
               existing_nullable=False)
    # ### end Alembic commands ###
