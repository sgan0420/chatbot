from flask import Blueprint, g, jsonify, request
from services.facade_impl.chatbot_service_impl import ChatbotServiceImpl
from utils.auth import require_auth
from models.request.chatbot_request import UploadDocumentRequest, DeleteDocumentRequest, CreateChatbotRequest
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

@chatbot_api.route("/create", methods=["POST"])
@require_auth
def create_chatbot():
    try:
        user_id = g.user_id
        user_token = g.user_token
        chatbot_request = CreateChatbotRequest(**request.json)
        chatbot_service = ChatbotServiceImpl(user_token)
        response, status_code = chatbot_service.create_chatbot(user_id, chatbot_request)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify(ErrorResponse(message=str(e)).model_dump()), 500

@chatbot_api.route("/<chatbot_id>", methods=["GET"])
@require_auth
def get_chatbot(chatbot_id: str):
    try:
        user_token = g.user_token
        chatbot_service = ChatbotServiceImpl(user_token)
        response, status_code = chatbot_service.get_chatbot(chatbot_id)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify(ErrorResponse(
            message=str(e)
        ).model_dump()), 500
    
@chatbot_api.route("/<chatbot_id>", methods=["PUT"])
@require_auth
def update_chatbot(chatbot_id: str):
    try:
        data = request.json  # Expecting JSON with updated fields like 'name' and 'description'
        user_token = g.user_token
        chatbot_service = ChatbotServiceImpl(user_token)
        response, status_code = chatbot_service.update_chatbot(chatbot_id, data)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify(ErrorResponse(message=str(e)).model_dump()), 500

@chatbot_api.route("/<chatbot_id>", methods=["DELETE"])
@require_auth
def delete_chatbot(chatbot_id):
    user_id = g.user_id
    user_token = g.user_token
    chatbot_service = ChatbotServiceImpl(user_token)

    response, status_code = chatbot_service.delete_chatbot(user_id, chatbot_id)
    return jsonify(response), status_code

@chatbot_api.route("/upload", methods=["POST"])
@require_auth
def upload_document():
    try:
        user_id = g.user_id
        user_token = g.user_token
        data = UploadDocumentRequest(
            chatbot_id=request.form["chatbot_id"],
            file=request.files['file']
        )
        chatbot_service = ChatbotServiceImpl(user_token)
        response, status_code = chatbot_service.upload_document(user_id, data)
        return jsonify(response), status_code
        
    except Exception as e:
        return jsonify(ErrorResponse(
            message=str(e)
        ).model_dump()), 500
    
@chatbot_api.route("/list/<chatbot_id>", methods=["GET"])
@require_auth
def list_documents(chatbot_id: str):
    try:
        user_token = g.user_token
        chatbot_service = ChatbotServiceImpl(user_token)
        response, status_code = chatbot_service.list_documents(chatbot_id)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify(ErrorResponse(
            message=str(e)
        ).model_dump()), 500

@chatbot_api.route("/delete", methods=["DELETE"])
@require_auth
def delete_document():
    try:
        user_id = g.user_id
        user_token = g.user_token
        data = DeleteDocumentRequest(**request.json)
        chatbot_service = ChatbotServiceImpl(user_token)
        response, status_code = chatbot_service.delete_document(user_id, data)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify(ErrorResponse(
            message=str(e)
        ).model_dump()), 500

