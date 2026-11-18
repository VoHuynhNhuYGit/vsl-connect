"""Restore checks silently omitted by TiDB when its CHECK feature was disabled."""
from alembic import op
import sqlalchemy as sa

revision = 'f04c_tidb_checks'
down_revision = 'e93b_account_security'
branch_labels = None
depends_on = None

CHECKS = (
    ('users', 'ck_users_role', "role IN ('learner', 'admin')"),
    ('lessons', 'ck_lesson_position', 'position > 0'),
    ('review_schedules', 'ck_review_interval', 'interval_days >= 0'),
    ('lesson_signs', 'ck_lesson_sign_position', 'position > 0'),
    ('quiz_attempts', 'ck_quiz_attempt_score', 'score >= 0 AND score <= 100'),
    ('quiz_questions', 'ck_quiz_question_position', 'position > 0'),
    ('admin_audit_logs', 'ck_admin_audit_action', "action IN ('created', 'updated', 'deleted')"),
)


def upgrade():
    if op.get_context().as_sql or op.get_bind().dialect.name != 'mysql':
        return
    connection = op.get_bind()
    if 'tidb' not in str(connection.scalar(sa.text('SELECT VERSION()'))).lower():
        return
    inspector = sa.inspect(connection)
    for table, name, expression in CHECKS:
        existing = {check['name'] for check in inspector.get_check_constraints(table)}
        if name not in existing:
            op.create_check_constraint(name, table, expression)


def downgrade():
    # These checks belong to earlier revisions; keep their original contract.
    pass
