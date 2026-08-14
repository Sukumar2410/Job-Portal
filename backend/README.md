# Enterprise Job Portal - Backend

Django + DRF backend for the Enterprise Job Portal Application.

## Tech Stack
- Django 5.0 + DRF
- SQLite (built-in)
- JWT Authentication (SimpleJWT)
- drf-spectacular (Swagger docs)

## Setup

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # (Windows: venv\Scripts\activate)

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup .env (copy from example)
# Edit .env with your SECRET_KEY

# 4. Run migrations
python manage.py migrate

# 5. Create superuser
python manage.py createsuperuser

# 6. Seed test data (optional but recommended)
python manage.py seed_data

# 7. Run server
python manage.py runserver