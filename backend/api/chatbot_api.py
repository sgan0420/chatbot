from flask import Blueprint, g, jsonify
from services.facade_impl.chatbot_service_impl import ChatbotServiceImpl
from utils.auth import require_auth

chatbot_api = Blueprint("chatbot_api", __name__)


@chatbot_api.route("", methods=["GET"])
@require_auth  # Require user to be authenticated
def get_user_chatbots():
    user_id = g.user_id
    user_token = g.user_token
    chatbot_service = ChatbotServiceImpl(user_token)
    response, status_code = chatbot_service.get_user_chatbots(user_id)
    return jsonify(response), status_code
