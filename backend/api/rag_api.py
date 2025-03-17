import logging

from flask import Blueprint, g, jsonify, request
from chatbot.backend.config import get_supabase_client
from models.request.rag_request import ChatRequest, ProcessDocumentsRequest
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
        chatbot_id = request.json.get('chatbot_id')
        if not chatbot_id:
            return jsonify(ErrorResponse(
                message="chatbot_id is required"
            ).model_dump()), 400
            
        # Create Supabase client with user token
        supabase = get_supabase_client(g.user_token)
        
        # Get document URLs from documents table for this chatbot
        result = supabase.table('documents') \
            .select('file_url') \
            .eq('chatbot_id', chatbot_id) \
            .execute()
            
        if not result.data:
            return jsonify(ErrorResponse(
                message="No documents found for this chatbot"
            ).model_dump()), 404
            
        # Extract URLs from the result
        urls = [doc['file_url'] for doc in result.data]
        
        # Create request data with the retrieved URLs
        validated_data = ProcessDocumentsRequest(urls=urls)
        response, status_code = rag_service.process_documents_from_urls(validated_data)
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
def chat():
    try:
        validated_data = ChatRequest(**request.json)
        response, status_code = rag_service.chat(validated_data)
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