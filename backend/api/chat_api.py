import logging
from flask import Blueprint, jsonify, request, g
from models.request.chat_request import ChatRequest, GetChatHistoryRequest, CreateSessionRequest, PublicChatRequest
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

@chat_api.route("/create-session", methods=["POST"])
@require_auth
def create_session():
    try:
        user_token = g.user_token
        data = CreateSessionRequest(**request.json)
        logging.info("Creating session for chatbot_id: %s", data.chatbot_id)
        chat_service = ChatServiceImpl(user_token)
        response, status_code = chat_service.create_session(data)
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
    
@chat_api.route("/delete-session/<session_id>", methods=["DELETE"])
@require_auth
def delete_session(session_id: str):
    try:
        user_token = g.user_token
        chat_service = ChatServiceImpl(user_token)
        chatbot_id = request.args.get("chatbot_id")
        if not chatbot_id:
            return jsonify(ErrorResponse(message="chatbot_id is required").model_dump()), 400
        # Call the delete_session method from your chat service.
        response, status_code = chat_service.delete_session(chatbot_id, session_id)
        logging.info("Deleting session with ID: %s for chatbot_id: %s", session_id, chatbot_id)
        return jsonify(response), status_code
    except Exception as e:
        error_response = ErrorResponse(
            message=str(e)
        )
        return jsonify(error_response.model_dump()), 500

@chat_api.route("/get-sessions/<chatbot_id>", methods=["GET"])
@require_auth
def get_sessions(chatbot_id: str):
    try:
        logging.info("Getting sessions for chatbot_id: %s", chatbot_id)
        user_token = g.user_token
        chat_service = ChatServiceImpl(user_token)
        response, status_code = chat_service.get_sessions(chatbot_id)
        return jsonify(response), status_code
    except Exception as e:
        error_response = ErrorResponse(
            success=False,
            message=str(e)
        )
        return jsonify(error_response.model_dump()), 500
    
@chat_api.route("", methods=["POST"])
@require_auth
def chat():
    try:
        user_id = g.user_id
        user_token = g.user_token
        data = ChatRequest(**request.json)
        chat_service = ChatServiceImpl(user_token)
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
        query_params = request.args.to_dict()
        data = GetChatHistoryRequest(**query_params)
        chat_service = ChatServiceImpl(user_token)
        response, status_code = chat_service.get_chat_history(user_token, data)
        return jsonify(response), status_code
    except Exception as e:
        error_response = ErrorResponse(
            success=False,
            message=str(e)
        )
        return jsonify(error_response.model_dump()), 500 

@chat_api.route("/public-chat", methods=["POST"])
def public_chat():
    try:
        data = PublicChatRequest(**request.json)  # Validate request
        
        chatbot_id = data.chatbot_id
        session_id = data.session_id
        query = data.query

        logging.error(f"[PUBLIC CHAT] chatbot_id={chatbot_id}, session_id={session_id}, query={query}")

        # Init chat service without user token
        chat_service = ChatServiceImpl()
        
        # Query user_id of the chatbot owner
        chatbot_result = chat_service.supabase.table('chatbots').select('user_id').eq('id', chatbot_id).maybe_single().execute()
        if not chatbot_result.data:
            return jsonify(ErrorResponse(message="Invalid chatbot_id").model_dump()), 404

        owner_user_id = chatbot_result.data['user_id']

        # Auto create session if not provided
        if not session_id:
            create_data = CreateSessionRequest(chatbot_id=chatbot_id)
            create_response, _ = chat_service.create_session(create_data)
            session_id = create_response["session_id"]

        # Perform chat
        response, status_code = chat_service.chat(owner_user_id, None, ChatRequest(
            chatbot_id=chatbot_id,
            session_id=session_id,
            query=query
        ))

        return jsonify(response), status_code

    except ValidationError as e:
        error_response = ErrorResponse(
            success=False,
            message="Validation failed",
            data=e.errors()
        )
        return jsonify(error_response.model_dump()), 422
    except Exception as e:
        logging.error(f"[PUBLIC CHAT ERROR] {str(e)}")
        error_response = ErrorResponse(
            success=False,
            message=str(e)
        )
        return jsonify(error_response.model_dump()), 500
    
@chat_api.route("/public-create-session", methods=["POST"])
def public_create_session():
    try:
        data = CreateSessionRequest(**request.json)
        logging.info("Creating public session for chatbot_id: %s", data.chatbot_id)
        # Initialize ChatServiceImpl without a user token.
        chat_service = ChatServiceImpl()
        response, status_code = chat_service.create_session(data)
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
