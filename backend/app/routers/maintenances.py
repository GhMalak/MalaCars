from fastapi import APIRouter, Depends
from app.auth import get_current_user, CurrentUser
from app.supabase_client import get_service_client
from app.schemas import MaintenanceIn
from app.crud_utils import scoped_insert, scoped_list, scoped_get, scoped_update, scoped_delete

router = APIRouter(prefix="/maintenances", tags=["maintenances"])
TABLE = "maintenances"


def _serialize(data: dict) -> dict:
    out = dict(data)
    if out.get("scheduled_date"):
        out["scheduled_date"] = out["scheduled_date"].isoformat()
    if out.get("completed_date"):
        out["completed_date"] = out["completed_date"].isoformat()
    return out


@router.get("")
def list_maintenances(user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_list(client, TABLE, user.organization_id)


@router.post("")
def create_maintenance(payload: MaintenanceIn, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_insert(client, TABLE, _serialize(payload.model_dump()), user.organization_id)


@router.get("/{maintenance_id}")
def get_maintenance(maintenance_id: str, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_get(client, TABLE, maintenance_id, user.organization_id)


@router.put("/{maintenance_id}")
def update_maintenance(maintenance_id: str, payload: MaintenanceIn, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_update(client, TABLE, maintenance_id, user.organization_id, _serialize(payload.model_dump()))


@router.delete("/{maintenance_id}")
def delete_maintenance(maintenance_id: str, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_delete(client, TABLE, maintenance_id, user.organization_id)
