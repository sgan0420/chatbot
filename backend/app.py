from api.auth_api import auth_api
from api.chatbot_api import chatbot_api
from api.rag_api import rag_api
from exceptions.database_exception import DatabaseException
from exceptions.base_api_exception import BaseAPIException
from exceptions.unauthorized_exception import UnauthorizedException
from flask import Flask, jsonify
from flask_cors import CORS
from models.response.response_wrapper import ErrorResponse


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(auth_api, url_prefix="/api/auth")
    app.register_blueprint(rag_api, url_prefix="/api/rag")
    app.register_blueprint(chatbot_api, url_prefix="/api/chatbot")

    @app.route("/")
    def home():
        return jsonify({"message": "Backend is running!"})

    @app.errorhandler(BaseAPIException)
    def handle_custom_error(error: BaseAPIException) -> jsonify:
        error_response = ErrorResponse[dict](
            success=False, message=error.message, data=error.data
        )
        return jsonify(error_response.model_dump()), error.status_code

    @app.errorhandler(Exception)
    def handle_generic_error(error: Exception) -> jsonify:
        error_response = ErrorResponse[None](
            success=False, message=str(error), data=None
        )
        return jsonify(error_response.model_dump()), 500

    @app.errorhandler(UnauthorizedException)
    def handle_unauthorized(e: UnauthorizedException) -> jsonify:
        error_response = ErrorResponse[None](
            success=False, message=e.message, data=None
        )
        return jsonify(error_response.model_dump()), e.status_code

    @app.errorhandler(DatabaseException)
    def handle_database_error(e: DatabaseException) -> jsonify:
        error_response = ErrorResponse[dict](
            success=False, message=e.message, data=e.data
        )
        return jsonify(error_response.model_dump()), e.status_code

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
