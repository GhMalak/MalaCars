from datetime import date, timedelta
from fastapi import APIRouter, Depends
from app.auth import get_current_user, CurrentUser
from app.supabase_client import get_service_client

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(user: CurrentUser = Depends(get_current_user)):
    client = get_service_client()
    org = user.organization_id

    vehicles = client.table("vehicles").select("id, status").eq("organization_id", org).execute().data
    drivers = client.table("drivers").select("id, status, cnh_expiration").eq("organization_id", org).execute().data
    contracts = client.table("contracts").select("id, status").eq("organization_id", org).execute().data
    charges = client.table("financial_charges").select("id, status, amount, due_date").eq("organization_id", org).execute().data
    maintenances = (
        client.table("maintenances")
        .select("id, status, scheduled_date")
        .eq("organization_id", org)
        .execute()
        .data
    )

    today = date.today()
    soon = today + timedelta(days=30)

    overdue_charges = [c for c in charges if c["status"] in ("pendente", "atrasado") and c["due_date"] < str(today)]
    upcoming_charges = [c for c in charges if c["status"] == "pendente" and str(today) <= c["due_date"] <= str(soon)]
    upcoming_maintenances = [
        m for m in maintenances
        if m["status"] in ("pendente", "agendada") and m.get("scheduled_date") and str(today) <= m["scheduled_date"] <= str(soon)
    ]
    expiring_cnh = [
        d for d in drivers
        if d.get("cnh_expiration") and str(today) <= d["cnh_expiration"] <= str(soon)
    ]

    return {
        "vehicles_total": len(vehicles),
        "vehicles_active": len([v for v in vehicles if v["status"] == "ativo"]),
        "vehicles_in_maintenance": len([v for v in vehicles if v["status"] == "em_manutencao"]),
        "drivers_total": len(drivers),
        "drivers_active": len([d for d in drivers if d["status"] == "ativo"]),
        "contracts_active": len([c for c in contracts if c["status"] == "ativo"]),
        "charges_overdue_count": len(overdue_charges),
        "charges_overdue_amount": sum(float(c["amount"]) for c in overdue_charges),
        "charges_upcoming_count": len(upcoming_charges),
        "charges_upcoming_amount": sum(float(c["amount"]) for c in upcoming_charges),
        "maintenances_upcoming_count": len(upcoming_maintenances),
        "drivers_cnh_expiring_count": len(expiring_cnh),
        "alerts": {
            "overdue_charges": overdue_charges[:10],
            "upcoming_maintenances": upcoming_maintenances[:10],
            "expiring_cnh": expiring_cnh[:10],
        },
    }
