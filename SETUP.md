# Local Development Setup Guide

## Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ & npm
- PostgreSQL 14+ (Optional for local dev, SQLite fallback active by default)
- Redis (Optional, synchronous fallback active by default)

## Step-by-Step Setup

### 1. Clone & Navigate
`ash
cd hara-workshop
`

### 2. Backend Setup
`ash
cd backend
python -m venv venv
venv/Scripts/activate # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
`

### 3. Frontend Setup
`ash
cd ../frontend
npm install
npm run dev
`

Frontend runs at http://localhost:5173.
Backend runs at http://localhost:8000.

## Demo Accounts (Created by seed_data)
- Super Admin: admin@haraworkshop.com / Admin@123456
- Manager: manager@haraworkshop.com / Manager@123456
- Sales: sales@haraworkshop.com / Sales@123456
- Production: production@haraworkshop.com / Production@123456
- Accountant: accountant@haraworkshop.com / Accountant@123456
- Customer: customer@haraworkshop.com / Customer@123456
