from fastapi import HTTPException


def scoped_insert(client, table: str, data: dict, organization_id: str):
    payload = {**data, "organization_id": organization_id}
    result = client.table(table).insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail=f"Falha ao criar registro em {table}")
    return result.data[0]


def scoped_list(client, table: str, organization_id: str, order_by: str = "created_at", desc: bool = True):
    query = client.table(table).select("*").eq("organization_id", organization_id)
    query = query.order(order_by, desc=desc)
    result = query.execute()
    return result.data


def scoped_get(client, table: str, record_id: str, organization_id: str):
    result = (
        client.table(table)
        .select("*")
        .eq("id", record_id)
        .eq("organization_id", organization_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return result.data


def scoped_update(client, table: str, record_id: str, organization_id: str, data: dict):
    # garante que o registro existe e pertence à organização antes de atualizar
    scoped_get(client, table, record_id, organization_id)
    clean = {k: v for k, v in data.items() if v is not None}
    result = (
        client.table(table)
        .update(clean)
        .eq("id", record_id)
        .eq("organization_id", organization_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Falha ao atualizar registro")
    return result.data[0]


def scoped_delete(client, table: str, record_id: str, organization_id: str):
    scoped_get(client, table, record_id, organization_id)
    client.table(table).delete().eq("id", record_id).eq("organization_id", organization_id).execute()
    return {"ok": True}
