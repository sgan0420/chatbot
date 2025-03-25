import logging
from flask import Blueprint, jsonify, request, g
from models.request.rag_request import ProcessDocumentsRequest
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
        user_id = g.user_id
        user_token = g.user_token
        data = ProcessDocumentsRequest(**request.json)
        response, status_code = rag_service.process_documents_from_urls(user_id, user_token, data)
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