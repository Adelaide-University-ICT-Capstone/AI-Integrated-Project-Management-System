"""sync_project_task_columns

Revision ID: 8a4f0c2d9b6e
Revises: 073b91b53e02
Create Date: 2026-05-31 15:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "8a4f0c2d9b6e"
down_revision = "073b91b53e02"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {column["name"] for column in inspector.get_columns(table_name)}


def _has_foreign_key(
    table_name: str,
    constrained_column: str,
    referred_table: str,
    referred_column: str,
) -> bool:
    inspector = sa.inspect(op.get_bind())
    for foreign_key in inspector.get_foreign_keys(table_name):
        if (
            foreign_key.get("constrained_columns") == [constrained_column]
            and foreign_key.get("referred_table") == referred_table
            and foreign_key.get("referred_columns") == [referred_column]
        ):
            return True
    return False


def upgrade():
    existing_columns = _columns("project_tasks")

    if "assigned_employee_id" not in existing_columns:
        op.add_column(
            "project_tasks",
            sa.Column("assigned_employee_id", sa.Uuid(), nullable=True),
        )

    if "allocated_hours" not in existing_columns:
        op.add_column(
            "project_tasks",
            sa.Column("allocated_hours", sa.Numeric(precision=8, scale=2), nullable=True),
        )

    if "completion_date" not in existing_columns:
        op.add_column(
            "project_tasks",
            sa.Column("completion_date", sa.Date(), nullable=True),
        )

    if "invoice_amount" not in existing_columns:
        op.add_column(
            "project_tasks",
            sa.Column("invoice_amount", sa.Numeric(precision=10, scale=2), nullable=True),
        )

    if "fee_final" not in existing_columns:
        op.add_column(
            "project_tasks",
            sa.Column("fee_final", sa.Numeric(precision=10, scale=2), nullable=True),
        )

    if "is_excluded" not in existing_columns:
        op.add_column(
            "project_tasks",
            sa.Column("is_excluded", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
        op.alter_column("project_tasks", "is_excluded", server_default=None)

    if "paid_date" not in existing_columns:
        op.add_column(
            "project_tasks",
            sa.Column("paid_date", sa.Date(), nullable=True),
        )

    if "updated_at" not in existing_columns:
        op.add_column(
            "project_tasks",
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _has_foreign_key(
        "project_tasks",
        "assigned_employee_id",
        "employees",
        "id",
    ):
        op.create_foreign_key(
            "fk_project_tasks_assigned_employee_id_employees",
            "project_tasks",
            "employees",
            ["assigned_employee_id"],
            ["id"],
        )


def downgrade():
    # The current initial migration already owns these columns. This compatibility
    # migration only repairs databases that applied an older copy of it.
    pass
