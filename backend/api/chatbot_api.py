from flask import Blueprint, g, jsonify, request
from services.facade_impl.chatbot_service_impl import ChatbotServiceImpl
from utils.auth import require_auth
from models.request.chatbot_request import UploadDocumentRequest
from models.response.response_wrapper import ErrorResponse

chatbot_api = Blueprint("chatbot_api", __name__)


@chatbot_api.route("", methods=["GET"])
@require_auth  # Require user to be authenticated
def get_user_chatbots():
    user_id = g.user_id
    user_token = g.user_token
    chatbot_service = ChatbotServiceImpl(user_token)
    response, status_code = chatbot_service.get_user_chatbots(user_id)
    return jsonify(response), status_code

@chatbot_api.route("/upload/<chatbot_id>", methods=["POST"])
@require_auth
def upload_document(chatbot_id: str):
    try:
        data = UploadDocumentRequest(
            chatbot_id=chatbot_id,
            file=request.files['file']
        )
        chatbot_service = ChatbotServiceImpl(g.user_id, g.user_token)
        response, status_code = chatbot_service.upload_document(data)
        return jsonify(response), status_code
        
    except Exception as e:
        return jsonify(ErrorResponse(
            message=str(e)
        ).model_dump()), 500