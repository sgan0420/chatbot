from config import get_supabase_client
from exceptions.auth_exception import AuthException
from gotrue.errors import AuthApiError
from models.request.auth_request import LoginRequest, SignupRequest
from models.response.auth_response import LoginResponse, SignupResponse
from models.response.response_wrapper import SuccessResponse
from services.facade.auth_service import AuthService


class AuthServiceImpl(AuthService):
    def __init__(self):
        self.supabase = get_supabase_client()

    def signup(self, data: SignupRequest) -> tuple:
        email = data.get("email")
        password = data.get("password")
        display_name = data.get("display_name")

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

        if response.user is None or response.session is None:
            raise AuthException("Signup failed", 400)

        signup_response = SignupResponse(user=response.user, session=response.session)

        return (
            SuccessResponse[SignupResponse](data=signup_response).model_dump(),
            200,
        )

    def login(self, data: LoginRequest) -> tuple:
        email = data.get("email")
        password = data.get("password")

        try:
            response = self.supabase.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
        except AuthApiError as e:
            raise AuthException(str(e), 400)

        if response.user is None or response.session is None:
            raise AuthException("Login failed", 400)

        login_response = LoginResponse(user=response.user, session=response.session)

        return (
            SuccessResponse[LoginResponse](data=login_response).model_dump(),
            200,
        )
