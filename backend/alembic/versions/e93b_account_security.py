"""Add profile details and persistent one-time account verification challenges."""
from alembic import op
import sqlalchemy as sa

revision = 'e93b_account_security'
down_revision = 'd82a_user_avatar'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('gender', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('phone_number', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('google_email', sa.String(320), nullable=True))
    op.add_column('users', sa.Column('password_enabled', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.execute(sa.text('UPDATE users SET google_email = email WHERE google_sub IS NOT NULL'))
    op.create_table('account_verifications',
        sa.Column('token_hash', sa.String(64), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('purpose', sa.String(24), nullable=False),
        sa.Column('recipient_hash', sa.String(64), nullable=False),
        sa.Column('payload', sa.Text(), nullable=False),
        sa.Column('code_hash', sa.String(64), nullable=False),
        sa.Column('second_code_hash', sa.String(64), nullable=True),
        sa.Column('attempts', sa.Integer(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), nullable=False),
        sa.Column('send_count', sa.Integer(), nullable=False),
        sa.Column('consumed', sa.Boolean(), nullable=False))
    op.create_index('ix_account_verifications_user_id', 'account_verifications', ['user_id'])
    op.create_index('ix_account_verifications_recipient_hash', 'account_verifications', ['recipient_hash'])
    op.create_index('ix_account_verifications_created_at', 'account_verifications', ['created_at'])


def downgrade():
    op.drop_table('account_verifications')
    for column in ('password_enabled', 'google_email', 'phone_number', 'gender'):
        op.drop_column('users', column)
