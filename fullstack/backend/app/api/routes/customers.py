from fastapi import APIRouter, Depends
from sqlmodel import col, select

from app.api.deps import SessionDep, get_current_user
from app.models import Customer, CustomerCreate, CustomerPublic, CustomersPublic


router = APIRouter(
    prefix="/customers",
    tags=["customers"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=CustomersPublic)
def list_customers(session: SessionDep) -> CustomersPublic:
    customers = session.exec(
        select(Customer).order_by(col(Customer.created_at).desc())
    ).all()
    data = [CustomerPublic.model_validate(customer) for customer in customers]
    return CustomersPublic(data=data, count=len(data))


@router.post("/", response_model=CustomerPublic)
def create_customer(customer_in: CustomerCreate, session: SessionDep) -> CustomerPublic:
    customer = Customer.model_validate(customer_in)
    session.add(customer)
    session.commit()
    session.refresh(customer)
    return CustomerPublic.model_validate(customer)
