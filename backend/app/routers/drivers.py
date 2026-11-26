from fastapi import APIRouter, Depends
from app.auth import get_current_user, CurrentUser
from app.supabase_client import get_service_client
from app.schemas import DriverIn
from app.crud_utils import scoped_insert, scoped_list, scoped_get, scoped_update, scoped_delete

router = APIRouter(prefix="/drivers", tags=["drivers"])
TABLE = "drivers"


@router.get("")
def list_drivers(user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_list(client, TABLE, user.organization_id, order_by="full_name", desc=False)


@router.post("")
def create_driver(payload: DriverIn, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    data = payload.model_dump()
    if data.get("cnh_expiration"):
        data["cnh_expiration"] = data["cnh_expiration"].isoformat()
    return scoped_insert(client, TABLE, data, user.organization_id)


@router.get("/{driver_id}")
def get_driver(driver_id: str, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_get(client, TABLE, driver_id, user.organization_id)


@router.put("/{driver_id}")
def update_driver(driver_id: str, payload: DriverIn, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    data = payload.model_dump()
    if data.get("cnh_expiration"):
        data["cnh_expiration"] = data["cnh_expiration"].isoformat()
    return scoped_update(client, TABLE, driver_id, user.organization_id, data)


@router.delete("/{driver_id}")
def delete_driver(driver_id: str, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_delete(client, TABLE, driver_id, user.organization_id)
