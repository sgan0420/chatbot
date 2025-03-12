from flask import Flask, jsonify
from flask_cors import CORS


from flask import Flask, jsonify
from exceptions.base_api_exception import BaseAPIException
from api.auth_api import auth_api
from models.response.response_wrapper import ErrorResponse


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(auth_api, url_prefix='/api/auth')

    @app.route('/')
    def home():
        return jsonify({"message": "Backend is running!"})

    @app.errorhandler(BaseAPIException)
    def handle_custom_error(error: BaseAPIException) -> jsonify:
        error_response = ErrorResponse(
            success=False, message=error.message, data=error.data
        )
        return jsonify(error_response.model_dump()), error.status_code

    # @app.errorhandler(Exception)
    # def handle_generic_error(error: Exception) -> jsonify:
    #     error_response = ErrorResponse[None](
    #         success=False, message="An unexpected error occurred.", data=None
    #     )
    #     return jsonify(error_response.model_dump()), 500

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
