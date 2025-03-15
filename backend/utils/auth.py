from functools import wraps

import jwt
from config import SUPABASE_JWT_SECRET
from exceptions.unauthorized_exception import UnauthorizedException
from flask import g, request


def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)
        if not auth_header:
            raise UnauthorizedException("Authorization header missing", status_code=401)
        if not auth_header.startswith("Bearer "):
            raise UnauthorizedException(
                "Invalid authorization header format", status_code=401
            )
            
        token = auth_header.split(" ")[1]
        
        try:
            decoded_token = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )

            user_id = decoded_token.get("sub")
            if not user_id:
                raise UnauthorizedException(
                    "Invalid token: user_id missing", status_code=401
                )

            # Store BOTH user_id and the entire JWT in flask.g
            g.user_id = user_id
            g.user_token = token

        except jwt.ExpiredSignatureError:
            raise UnauthorizedException(
                "Token expired. Please login again.", status_code=401
            )
        except jwt.InvalidTokenError:
            raise UnauthorizedException("Invalid token.", status_code=401)
        except Exception as e:
            raise UnauthorizedException("Authorization failed.", status_code=401, data={"error": str(e)})

        return f(*args, **kwargs)

    return decorated_function
