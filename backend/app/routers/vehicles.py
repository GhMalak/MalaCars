from fastapi import APIRouter, Depends
from app.auth import get_current_user, CurrentUser
from app.supabase_client import get_service_client
from app.schemas import VehicleIn
from app.crud_utils import scoped_insert, scoped_list, scoped_get, scoped_update, scoped_delete

router = APIRouter(prefix="/vehicles", tags=["vehicles"])
TABLE = "vehicles"


@router.get("")
def list_vehicles(user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_list(client, TABLE, user.organization_id, order_by="plate", desc=False)


@router.post("")
def create_vehicle(payload: VehicleIn, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_insert(client, TABLE, payload.model_dump(), user.organization_id)


@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: str, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_get(client, TABLE, vehicle_id, user.organization_id)


@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: str, payload: VehicleIn, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_update(client, TABLE, vehicle_id, user.organization_id, payload.model_dump())


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: str, user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    return scoped_delete(client, TABLE, vehicle_id, user.organization_id)
