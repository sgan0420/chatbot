# Chatbot

## Frontend Setup Guide

### Prerequisites

- **Node.js** (Install from [nodejs.org](https://nodejs.org))
- **npm** (Comes with Node.js)

### Installation Steps

#### 1. Run Setup Script

This installs all dependencies and fixes linting issues.

```bash
npm run setup
```

#### 2. Start the Development Server

```bash
npm start
```

This will start the React development server at `http://localhost:3000/`.

### Additional Commands

#### Run Linter and Fix Issues

```bash
npx eslint src --fix
```

#### Format Code Using Prettier

```bash
npm run format
```

---

## Backend Setup Guide

### Prerequisites

- **Python 3.8+** (Install from [python.org](https://www.python.org))
- **pip** (Comes with Python)
- **Virtual Environment** (Recommended)

### Installation Steps

#### 1. Create and Activate Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows, use venv\Scripts\activate
```

#### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 3. Run the Backend Server

```bash
python app.py
```

This will start the Flask backend server at `http://127.0.0.1:5000/`.

### Additional Commands

#### Generate `requirements.txt` (If Needed)

```bash
pip freeze > requirements.txt
```

---

Now both your frontend and backend are set up! 🚀 Happy coding! 🎉
