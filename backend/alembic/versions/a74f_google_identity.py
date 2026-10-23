"""Add the optional Google identity to users without changing existing accounts.

Revision ID: a74f_google_identity
Revises: 3e682c7d514a
"""
from alembic import op
import sqlalchemy as sa

revision = 'a74f_google_identity'
down_revision = '3e682c7d514a'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('google_sub', sa.String(length=255), nullable=True))
    op.create_index('ix_users_google_sub', 'users', ['google_sub'], unique=True)


def downgrade():
    op.drop_index('ix_users_google_sub', table_name='users')
    op.drop_column('users', 'google_sub')
