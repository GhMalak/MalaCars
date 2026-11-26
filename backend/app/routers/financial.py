from fastapi import APIRouter, Depends
from app.auth import get_current_user, CurrentUser
from app.supabase_client import get_service_client
from app.schemas import ChargeIn, ChargeUpdate
from app.crud_utils import scoped_insert, scoped_list, scoped_get, scoped_update, scoped_delete

router = APIRouter(prefix="/financial-charges", tags=["financial"])
TABLE = "financial_charges"


def _serialize(data: dict) -> dict:
    out = dict(data)
    if out.get("reference_date"):
        out["reference_date"] = out["reference_date"].isoformat()
    if out.get("due_date"):
        out["due_date"] = out["due_date"].isoformat()
    return out


@router.get("")
def list_charges(user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_list(client, TABLE, user.organization_id, order_by="due_date", desc=False)


@router.post("")
def create_charge(payload: ChargeIn, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_insert(client, TABLE, _serialize(payload.model_dump()), user.organization_id)


@router.get("/{charge_id}")
def get_charge(charge_id: str, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_get(client, TABLE, charge_id, user.organization_id)


@router.patch("/{charge_id}")
def update_charge(charge_id: str, payload: ChargeUpdate, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    data = payload.model_dump(exclude_unset=True)
    if data.get("paid_at"):
        data["paid_at"] = data["paid_at"].isoformat()
    return scoped_update(client, TABLE, charge_id, user.organization_id, data)


@router.delete("/{charge_id}")
def delete_charge(charge_id: str, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_delete(client, TABLE, charge_id, user.organization_id)
