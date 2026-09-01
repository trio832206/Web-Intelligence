# Web Intelligence Platform

## Overview
Web Intelligence is a comprehensive platform designed for advanced web data crawling, analysis, and synthesis. It leverages automated crawling engines, natural language processing (NLP), and machine learning capabilities to extract structured insights from unstructured web data. The system features a modern frontend interface and a robust FastAPI backend.

## Features
- Automated Web Crawling: Extract data from designated targets using customizable depth and proxy settings.
- NLP Analytics: Analyze sentiment, identify named entities, and process raw text into structured intelligence.
- Machine Learning Predictions: Interface for viewing predictive models and classification data.
- Data Fusion: Aggregate data from multiple sources and visualize connections between disparate data points.
- Security and Administration: Role-based access control, with dedicated administrator panels to monitor system logs and manage user access. Automatic request inspection to block exploitation attempts such as SQL injection or cross-site scripting.

## Technology Stack
### Frontend
- React with TypeScript
- Vite
- Custom CSS with dynamic theme switching

### Backend
- Python with FastAPI
- SQLite with SQLAlchemy ORM
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python (3.9 or higher)
- Git

### Setup Instructions

1. Clone the repository
git clone https://github.com/trio832206/Web-Intelligence.git
cd Web-Intelligence

2. Backend Setup
Navigate to the backend directory:
cd backend

Create a virtual environment and activate it:
python -m venv venv
venv\Scripts\activate  (Windows)
source venv/bin/activate (Mac/Linux)

Install dependencies:
pip install -r requirements.txt

Set environment variables:
Create a `.env` file in the backend directory and define:
DEFAULT_ADMIN_PASSWORD=your_secure_password
JWT_SECRET_KEY=your_secret_key

3. Frontend Setup
Navigate to the frontend directory:
cd ../frontend

Install dependencies:
npm install

### Running the Application
To start both the frontend development server and the backend API simultaneously, run the following command from the frontend directory:
npm run start:all

- The frontend will be available at http://localhost:5173
- The backend API will be available at http://localhost:8000

## License
This project is proprietary and confidential.