import os
from supabase import create_client, Client
from dotenv import load_dotenv


load_dotenv()


SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY")


def get_supabase_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
