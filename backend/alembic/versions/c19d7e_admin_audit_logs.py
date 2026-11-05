"""Add immutable audit records for changes made in the admin workspace.

Revision ID: c19d7e_admin_audit_logs
Revises: a74f_google_identity
"""
from alembic import op
import sqlalchemy as sa


revision = 'c19d7e_admin_audit_logs'
down_revision = 'a74f_google_identity'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'admin_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=False),
        sa.Column('actor_name', sa.String(length=120), nullable=False),
        sa.Column('action', sa.String(length=16), nullable=False),
        sa.Column('resource_type', sa.String(length=32), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=False),
        sa.Column('resource_label', sa.String(length=200), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.CheckConstraint("action IN ('created', 'updated', 'deleted')", name='ck_admin_audit_action'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_admin_audit_logs_actor_id'), 'admin_audit_logs', ['actor_id'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_created_at'), 'admin_audit_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_resource_type'), 'admin_audit_logs', ['resource_type'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_admin_audit_logs_resource_type'), table_name='admin_audit_logs')
    op.drop_index(op.f('ix_admin_audit_logs_created_at'), table_name='admin_audit_logs')
    op.drop_index(op.f('ix_admin_audit_logs_actor_id'), table_name='admin_audit_logs')
    op.drop_table('admin_audit_logs')
