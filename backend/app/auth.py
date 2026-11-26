from fastapi import Header, HTTPException, status
from jose import jwt, JWTError
from app.config import SUPABASE_JWT_SECRET
from app.supabase_client import get_service_client


class CurrentUser:
    def __init__(self, user_id: str, organization_id: str, role: str):
        self.user_id = user_id
        self.organization_id = organization_id
        self.role = role


async def get_current_user(authorization: str = Header(default=None)) -> CurrentUser:
    """
    Valida o token JWT enviado pelo frontend (Supabase Auth) e resolve
    a organization_id do usuário a partir da tabela `profiles`.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente")

    token = authorization.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sem usuário")

    client = get_service_client()
    result = client.table("profiles").select("organization_id, role").eq("id", user_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil não encontrado para este usuário")

    return CurrentUser(
        user_id=user_id,
        organization_id=result.data["organization_id"],
        role=result.data["role"],
    )
