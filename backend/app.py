from flask import Flask, jsonify
from flask_cors import CORS


from flask import Flask, jsonify
from exceptions.base_api_exception import BaseAPIException
from api.auth_api import auth_api


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(auth_api, url_prefix='/api/auth')

    @app.route('/')
    def home():
        return jsonify({"message": "Backend is running!"})

    @app.errorhandler(BaseAPIException)
    def handle_custom_error(error: BaseAPIException) -> jsonify:
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
