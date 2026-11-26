from fastapi import APIRouter, Depends
from app.auth import get_current_user, CurrentUser
from app.supabase_client import get_service_client
from app.schemas import ContractIn
from app.crud_utils import scoped_insert, scoped_list, scoped_get, scoped_update, scoped_delete

router = APIRouter(prefix="/contracts", tags=["contracts"])
TABLE = "contracts"


def _serialize(data: dict) -> dict:
    out = dict(data)
    if out.get("start_date"):
        out["start_date"] = out["start_date"].isoformat()
    if out.get("end_date"):
        out["end_date"] = out["end_date"].isoformat()
    return out


@router.get("")
def list_contracts(user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_list(client, TABLE, user.organization_id)


@router.post("")
def create_contract(payload: ContractIn, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_insert(client, TABLE, _serialize(payload.model_dump()), user.organization_id)


@router.get("/{contract_id}")
def get_contract(contract_id: str, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_get(client, TABLE, contract_id, user.organization_id)


@router.put("/{contract_id}")
def update_contract(contract_id: str, payload: ContractIn, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_update(client, TABLE, contract_id, user.organization_id, _serialize(payload.model_dump()))


@router.delete("/{contract_id}")
def delete_contract(contract_id: str, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_delete(client, TABLE, contract_id, user.organization_id)
