from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# ---------------- Vehicles ----------------
class VehicleIn(BaseModel):
    plate: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    mileage_km: int = 0
    status: str = "ativo"
    notes: Optional[str] = None


class VehicleOut(VehicleIn):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime


# ---------------- Drivers ----------------
class DriverIn(BaseModel):
    full_name: str
    cpf: Optional[str] = None
    phone: Optional[str] = None
    cnh_number: Optional[str] = None
    cnh_category: Optional[str] = None
    cnh_expiration: Optional[date] = None
    status: str = "ativo"
    notes: Optional[str] = None


class DriverOut(DriverIn):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime


# ---------------- Contracts ----------------
class ContractIn(BaseModel):
    vehicle_id: str
    driver_id: str
    start_date: date
    end_date: Optional[date] = None
    weekly_value: float = 0
    due_weekday: int = 1
    status: str = "ativo"
    notes: Optional[str] = None


class ContractOut(ContractIn):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime


# ---------------- Financial charges ----------------
class ChargeIn(BaseModel):
    contract_id: str
    reference_date: date
    due_date: date
    amount: float
    status: str = "pendente"
    notes: Optional[str] = None


class ChargeUpdate(BaseModel):
    status: Optional[str] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None


class ChargeOut(ChargeIn):
    id: str
    organization_id: str
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ---------------- Maintenances ----------------
class MaintenanceIn(BaseModel):
    vehicle_id: str
    type: str
    scheduled_date: Optional[date] = None
    completed_date: Optional[date] = None
    mileage_km: Optional[int] = None
    cost: Optional[float] = None
    status: str = "pendente"
    notes: Optional[str] = None


class MaintenanceOut(MaintenanceIn):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime
