from flask import Blueprint, jsonify, request
from models.request.rag_request import ProcessDocumentsRequest, ChatRequest
from models.response.response_wrapper import ErrorResponse
from pydantic import ValidationError
from services.facade_impl.rag_service_impl import RAGServiceImpl
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

rag_api = Blueprint("rag_api", __name__)
rag_service = RAGServiceImpl()

@rag_api.route("/process", methods=["POST"])
def process_documents():
    try:
        validated_data = ProcessDocumentsRequest(**request.json)
        response, status_code = rag_service.process_documents_from_urls(validated_data)
        return jsonify(response), status_code
    # TODO: Handle errors in global error handler
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