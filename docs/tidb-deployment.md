# TiDB Cloud connection

Keep secrets in `.env` locally or backend environment variables on the deployment platform.
Use a separate test database before importing existing MySQL data.

Set `TIDB_HOST`, `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DB_NAME`, and the port supplied
by TiDB Cloud (`TIDB_PORT`, default 4000). Credentials are passed through
SQLAlchemy `URL.create`, so special characters in the password do not need URL encoding.

When any TiDB host/user/password field is present, incomplete settings fail instead
of silently connecting to local MySQL. A nonempty `DATABASE_URL` takes precedence;
that explicit URL remains responsible for its own connection/TLS options.

TiDB connections verify both the certificate chain and hostname using the system CA
store. Optional `TIDB_CA_PATH` must point to a PEM CA file available **inside the running
container or deployment runtime**. Never disable certificate or hostname verification.
The application and Alembic share these TLS settings. Connection pools pre-ping and
recycle connections after 300 seconds.

Compose passes TiDB settings to both backend and migrations. Its local MySQL service
and volume remain intact; enabling TiDB does not copy or remove any MySQL data.
Run migration only after checking that the selected test database is correct and
inspecting any existing tables. Do not use `create_all` as a migration replacement.

Vercel receives these variables in its backend environment settings; `.env.example`
contains placeholders only. Setting local `.env` does not configure Vercel automatically.

The initial migration detects TiDB online and omits unsupported literal TEXT defaults
for the three description columns. SQLAlchemy supplies `''` when descriptions are
omitted; direct SQL imports must supply these NOT NULL fields explicitly. Existing
MySQL defaults remain unchanged. Run TiDB migrations online, rather than applying
offline SQL generated for MySQL.

Before running Alembic, enable the instance's CHECK support with
`SET GLOBAL tidb_enable_check_constraint = ON;` using a database administrator.
Alembic refuses to migrate TiDB while it is disabled, since TiDB otherwise silently
ignores CHECK definitions. The compatibility revision restores any missing checks
from an earlier install; it does not remove checks from MySQL.
