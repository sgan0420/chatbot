import os
import logging

from dotenv import load_dotenv
from supabase import Client, ClientOptions, create_client

load_dotenv()


SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY")
SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY")


def get_supabase_client(user_token=None) -> Client:
    if user_token:
        logging.info("Creating Supabase client with user token", user_token)
        return create_client(
            SUPABASE_URL,
            SUPABASE_SECRET_KEY,
            options=ClientOptions(headers={"Authorization": f"Bearer {user_token}"}),
        )
    else:
        logging.info("Creating Supabase client without user token")
        return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
