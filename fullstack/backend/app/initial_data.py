from sqlmodel import Session

from app.core.db import engine, init_db
from app.db.initial_data import ensure_project_status_types, ensure_roles


def main() -> None:
    with Session(engine) as session:
        init_db(session)
        ensure_project_status_types(session)
        ensure_roles(session)


if __name__ == "__main__":
    main()