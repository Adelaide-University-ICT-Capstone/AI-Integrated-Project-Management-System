#! /usr/bin/env bash

set -e
set -x

# Let the DB start
python app/backend_pre_start.py

# Migrations skipped for deploy: cloud DB schema is already up to date.
# To apply new migrations, uncomment the line below and redeploy once.
# alembic upgrade head

exec fastapi run --workers 4 --host 0.0.0.0 --port "${PORT:-8000}" app/main.py
