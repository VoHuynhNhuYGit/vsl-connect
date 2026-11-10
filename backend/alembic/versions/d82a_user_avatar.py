"""Add optional, size-limited avatar thumbnails to existing accounts.

Revision ID: d82a_user_avatar
Revises: c19d7e_admin_audit_logs
"""
from alembic import op
import sqlalchemy as sa

revision = 'd82a_user_avatar'
down_revision = 'c19d7e_admin_audit_logs'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('avatar_image', sa.LargeBinary(length=65535), nullable=True))
    op.add_column('users', sa.Column('avatar_version', sa.String(length=32), nullable=True))


def downgrade():
    op.drop_column('users', 'avatar_version')
    op.drop_column('users', 'avatar_image')
