from exceptions.auth_exception import AuthException
from services.facade.auth_service import AuthService
from config import get_supabase_client
from utils.response import success
from models.request.auth_request import SignupRequest, LoginRequest
from gotrue.errors import AuthApiError


class AuthServiceImpl(AuthService):
    def __init__(self):
        self.supabase = get_supabase_client()

    def signup(self, data: SignupRequest) -> tuple:
        email = data.get('email')
        password = data.get('password')
        display_name = data.get('display_name')

        try:
            response = self.supabase.auth.sign_up(
                {
                    "email": email,
                    "password": password,
                    "options": {"data": {"display_name": display_name}},
                }
            )
        except AuthApiError as e:
            raise AuthException(str(e), 400)

        if response.user is None:
            raise AuthException("Signup failed", 400)

        return success(
            {
                "user": response.user.model_dump(),
                "session": response.session.model_dump(),
            }
        )

    def login(self, data: LoginRequest) -> tuple:
        email = data.get('email')
        password = data.get('password')

        try:
            response = self.supabase.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
        except AuthApiError as e:
            raise AuthException(str(e), 400)

        if response.user is None:
            raise AuthException("Login failed", 400)

        return success(
            {
                "user": response.user.model_dump(),
                "session": response.session.model_dump(),
            }
        )
