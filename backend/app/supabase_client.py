from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY


def get_service_client() -> Client:
    """
    Cliente com a service_role key: usado pelo backend para operar no banco
    depois que já validamos o JWT do usuário e sabemos a organization_id dele.
    A filtragem por organization_id é feita manualmente em cada query,
    como segunda camada de proteção além do RLS.
    """
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
