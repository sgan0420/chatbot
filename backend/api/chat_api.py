import logging
from flask import Blueprint, jsonify, request, g
from models.request.chat_request import ChatRequest, GetChatHistoryRequest, CreateSessionRequest
from models.response.response_wrapper import ErrorResponse
from pydantic import ValidationError
from services.facade_impl.chat_service_impl import ChatServiceImpl
from utils.auth import require_auth

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

chat_api = Blueprint("chat_api", __name__)
chat_service = ChatServiceImpl()

@chat_api.route("/create-session", methods=["POST"])
@require_auth
def create_session():
    try:
        user_token = g.user_token
        data = CreateSessionRequest(**request.json)
        response, status_code = chat_service.create_session(user_token, data)
        return jsonify(response), status_code
    except ValidationError as e:
        error_response = ErrorResponse(
            success=False,
            message="Validation failed",
            data=e.errors()
        )
        return jsonify(error_response.model_dump()), 422
    except Exception as e:
        error_response = ErrorResponse(
            success=False,
            message=str(e)
        )
        return jsonify(error_response.model_dump()), 500

@chat_api.route("/chat", methods=["POST"])
@require_auth
def chat():
    try:
        user_id = g.user_id
        user_token = g.user_token
        data = ChatRequest(**request.json)
        response, status_code = chat_service.chat(user_id, user_token, data)
        return jsonify(response), status_code
    except ValidationError as e: # this is for the request body validation
        error_response = ErrorResponse(
            success=False,
            message="Validation failed",
            data=e.errors()
        )
        return jsonify(error_response.model_dump()), 422
    except Exception as e:
        error_response = ErrorResponse(
            success=False,
            message=str(e)
        )
        return jsonify(error_response.model_dump()), 500

@chat_api.route("/get-history", methods=["GET"])
@require_auth
def get_chat_history():
    try:
        user_token = g.user_token
        data = GetChatHistoryRequest(**request.json)
        response, status_code = chat_service.get_chat_history(user_token, data)
        return jsonify(response), status_code
    except Exception as e:
        error_response = ErrorResponse(
            success=False,
            message=str(e)
        )
        return jsonify(error_response.model_dump()), 500 