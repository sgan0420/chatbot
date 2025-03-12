from flask import Blueprint, request, jsonify
from services.facade_impl.auth_service_impl import AuthServiceImpl
from models.request.auth_request import SignupRequest, LoginRequest
from pydantic import ValidationError
from models.response.response_wrapper import ErrorResponse


auth_api = Blueprint('auth_api', __name__)
auth_service = AuthServiceImpl()


@auth_api.route('/signup', methods=['POST'])
def signup():
    try:
        validated_data = SignupRequest(**request.json)
        response, status_code = auth_service.signup(validated_data.model_dump())
        return jsonify(response), status_code
    except ValidationError as e:
        error_response = ErrorResponse(
            success=False, message="Validation failed", data=e.errors()
        )
        return jsonify(error_response.model_dump()), 422


@auth_api.route('/login', methods=['POST'])
def login():
    try:
        validated_data = LoginRequest(**request.json)
        response, status_code = auth_service.login(validated_data.model_dump())
        return jsonify(response), status_code
    except ValidationError as e:
        error_response = ErrorResponse(
            success=False, message="Validation failed", data=e.errors()
        )
        return jsonify(error_response.model_dump()), 422
