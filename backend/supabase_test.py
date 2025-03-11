from supabase import create_client, Client
import os

# Initialise Supabase
SUPABASE_URL = "https://lkodywmfigqsukjjcyeo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2R5d21maWdxc3VrampjeWVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTQ0NTkyMCwiZXhwIjoyMDU3MDIxOTIwfQ.VY6YiTs-6fxeH-e5912WCant1VZCuDPRHB2KIuFBnaM"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def sign_up_user(email, password):
    response = supabase.auth.sign_up({
        "email": email,
        "password": password
    })
    print("User signed up:", response)



def create_chatbot_directory(chatbot_id, file_name):
    bucket_name = "DOCUMENTS"
    folder_path = f"{chatbot_id}/" 
    file_path = f"{folder_path}{file_name}"

    # This line will create a placeholder txt file in the directory
    with open(file_name, "w") as file:
        file.write("This is a placeholder file.")

    try:
        supabase.storage.from_(bucket_name).upload(f"{folder_path}{file_name}", file_name)
    except:
        supabase.storage.from_(bucket_name).update(f"{folder_path}{file_name}", file_name)
    
    return file_path



def get_signed_url(file_path, expiry=3600):
    signed_link = supabase.storage.from_("DOCUMENTS").create_signed_url(file_path, expiry)
    return signed_link['signedURL']



if __name__ == "__main__":
    # test_email = "testuser1000@example.com"
    # test_password = "StrongP455word1000"
    
    # sign_up_user(test_email, test_password)


    new_chatbot_id = "chatbot_003"
    file_path = create_chatbot_directory(new_chatbot_id, "placeholder.txt")

    print(get_signed_url(file_path))



