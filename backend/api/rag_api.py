import logging
from flask import Blueprint, jsonify, request, g
from models.request.rag_request import ProcessDocumentsRequest, ChatRequest
from models.response.response_wrapper import ErrorResponse
from pydantic import ValidationError
from services.facade_impl.rag_service_impl import RAGServiceImpl
from utils.auth import require_auth

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

rag_api = Blueprint("rag_api", __name__)
rag_service = RAGServiceImpl()

@rag_api.route("/process", methods=["POST"])
@require_auth
def process_documents():
    try:
        # Validate the request data
        data = ProcessDocumentsRequest(**request.json)
        user_id = g.user_id
        user_token = g.user_token
        response, status_code = rag_service.process_documents_from_urls(user_id, user_token, data)
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


@rag_api.route("/chat", methods=["POST"])
@require_auth
def chat():
    try:
        user_id = g.user_id
        user_token = g.user_token
        data = ChatRequest(**request.json)
        response, status_code = rag_service.chat(user_id, user_token, data)
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


@rag_api.route("/history/<chatbot_id>/<chat_id>", methods=["GET"])
@require_auth
def get_chat_history(chatbot_id: str, chat_id: str):
    try:
        rag_service = get_rag_service_instance(chatbot_id, chat_id)
        response, status_code = rag_service.get_chat_history()
        return jsonify(response), status_code
    except Exception as e:
        error_response = ErrorResponse(
            success=False,
            message=str(e)
        )
        return jsonify(error_response.model_dump()), 500