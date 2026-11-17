from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool, text

from app.db import Base, get_connect_args, get_database_url
import app.models  # noqa: F401 - register tables for autogenerate

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)
url = get_database_url()
target_metadata = Base.metadata


def run_migrations_offline():
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={'paramstyle': 'named'})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    engine = create_engine(url, poolclass=pool.NullPool, connect_args=get_connect_args())
    with engine.connect() as connection:
        if connection.dialect.name == 'mysql':
            version = connection.scalar(text('SELECT VERSION()'))
            if 'tidb' in str(version).lower() and not connection.scalar(
                text('SELECT @@GLOBAL.tidb_enable_check_constraint')
            ):
                raise RuntimeError(
                    'Enable TiDB CHECK constraints before migration: '
                    'SET GLOBAL tidb_enable_check_constraint = ON'
                )
            # Version/settings probes must not leave an implicit transaction
            # around Alembic's migration transaction.
            connection.commit()
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
