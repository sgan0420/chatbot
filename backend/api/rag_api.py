import logging
from flask import Blueprint, jsonify, request, g
from models.request.rag_request import ChatRequest, RAGServiceRequest
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

rag_service_instances = {}

def get_rag_service_instance(chatbot_id: str, chat_id: str):
    """Get or create a RAG service instance based on chatbot and chat IDs"""
    key = (chatbot_id, chat_id)
    if key not in rag_service_instances:
        rag_service_instances[key] = RAGServiceImpl(
            user_id=g.user_id,
            user_token=g.user_token,
            chatbot_id=chatbot_id,
            chat_id=chat_id
        )
    return rag_service_instances[key]

@rag_api.route("/process", methods=["POST"])
@require_auth
def process_documents():
    try:
        # Validate the request data
        rag_request = RAGServiceRequest(**request.json)
        
        # Get or create service instance
        rag_service = get_rag_service_instance(
            chatbot_id=rag_request.chatbot_id,
            chat_id=rag_request.chat_id
        )
        
        response, status_code = rag_service.process_documents_from_urls()
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
        # Validate both request components
        rag_request = RAGServiceRequest(
            chatbot_id=request.json.get("chatbot_id"),
            chat_id=request.json.get("chat_id")
        )
        chat_request = ChatRequest(query=request.json.get("query"))
        
        # Get or create service instance
        rag_service = get_rag_service_instance(
            chatbot_id=rag_request.chatbot_id,
            chat_id=rag_request.chat_id
        )
        
        response, status_code = rag_service.chat(chat_request)
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