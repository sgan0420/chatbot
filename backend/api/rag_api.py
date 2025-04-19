import logging
import uuid
from flask import Blueprint, jsonify, request, g
from models.request.rag_request import ProcessDocumentsRequest
from models.response.response_wrapper import ErrorResponse, SuccessResponse
from pydantic import ValidationError
from services.facade_impl.rag_service_impl import RAGServiceImpl
from utils.auth import require_auth
from utils.background_task_manager import BackgroundTaskManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

rag_api = Blueprint("rag_api", __name__)


def process_documents_task(user_id: str, user_token: str, data: ProcessDocumentsRequest) -> dict:
    """Background task for processing documents"""
    rag_service = RAGServiceImpl()
    response, status_code = rag_service.process_documents_from_urls(user_id, user_token, data)
    return {'response': response, 'status_code': status_code}

def process_complete_callback(task_id: str, result: dict):
    """Callback function when processing is complete"""
    # notification logic ...  send a WebSocket message
    logging.info(f"~~~~~~~~~ Task {task_id} completed with result: {result} ~~~~~~~~~")


@rag_api.route("/process", methods=["POST"])
@require_auth
def process_documents():
    try:
        user_id = g.user_id
        user_token = g.user_token
        data = ProcessDocumentsRequest(**request.json)
        
        task_manager = BackgroundTaskManager()
        
        # Generate a unique task ID
        task_id = str(uuid.uuid4())
        
        # Start background processing
        task_manager.run_task(
            task_id=task_id,
            target=process_documents_task,
            args=(user_id, user_token, data),
            callback=process_complete_callback
        )
        
        # Return immediate response
        return jsonify(SuccessResponse(
            message="Document processing started",
            data={"task_id": task_id}
        ).model_dump()), 202  # 202 Accepted

    except ValidationError as e:
        error_response = ErrorResponse(
            message="Validation failed",
            data=e.errors()
        )
        return jsonify(error_response.model_dump()), 422
    except Exception as e:
        error_response = ErrorResponse(
            message=str(e)
        )
        return jsonify(error_response.model_dump()), 500

@rag_api.route("/status/<task_id>", methods=["GET"])
@require_auth
def get_task_status(task_id: str):
    """Get the status of a document processing task"""
    try:
        task_manager = BackgroundTaskManager()
        status = task_manager.get_task_status(task_id)
        return jsonify(SuccessResponse(
            message="Task status retrieved",
            data=status
        ).model_dump()), 200
    except Exception as e:
        error_response = ErrorResponse(
            message=str(e)
        )
        return jsonify(error_response.model_dump()), 500