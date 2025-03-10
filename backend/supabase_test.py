from supabase import create_client, Client
import os

SUPABASE_URL = "https://lkodywmfigqsukjjcyeo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2R5d21maWdxc3VrampjeWVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTQ0NTkyMCwiZXhwIjoyMDU3MDIxOTIwfQ.VY6YiTs-6fxeH-e5912WCant1VZCuDPRHB2KIuFBnaM"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def sign_up_user(email, password):
    response = supabase.auth.sign_up({
        "email": email,
        "password": password
    })
    print("User signed up:", response)


if __name__ == "__main__":
    test_email = "testuser1000@example.com"
    test_password = "StrongP455word1000"
    
    sign_up_user(test_email, test_password)