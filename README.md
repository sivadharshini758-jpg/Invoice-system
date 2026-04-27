# InvoiceOS — Django + React + SQLite

No Docker. No PostgreSQL. No complex setup.

## Tech Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Django 4.2 + Django REST Framework | Python, batteries included, great admin panel |
| Database | SQLite | Zero install — it's just a file (db.sqlite3) |
| Auth | JWT via SimpleJWT | Secure token-based login |
| Frontend | React 18 | Same as original, no changes needed |

---

## First Time Setup (Run Once)

### Requirements
- Python 3.10+ → https://python.org (check "Add to PATH" during install)
- Node.js 18+ → https://nodejs.org

### Steps
1. Extract this folder anywhere (e.g. `C:\invoiceos\`)
2. Double-click **`setup.bat`**
3. Wait for it to finish (~2-3 minutes)

That's it. The database file `backend/db.sqlite3` is created automatically.

---

## Start the App (Every Time)

Double-click **`start.bat`**

Two windows open:
- **Backend** runs on http://localhost:8000
- **Frontend** runs on http://localhost:3000

Open your browser → **http://localhost:3000**

**Default Login:**
- Email: `admin@example.com`
- Password: `Admin@123`
- ⚠️ Change this after first login!

---

## Project Structure

```
invoiceos/
├── setup.bat          ← Run once to install
├── start.bat          ← Run every time to start
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3     ← Database (created after setup)
│   ├── invoiceos/     ← Django project settings
│   └── api/           ← All models, views, URLs
└── frontend/
    ├── package.json
    └── src/           ← React source code
```

---

## Deployment Options (When Ready)

### Option A — PythonAnywhere (Free)
1. Upload your project
2. Set up a Django web app
3. SQLite works perfectly there

### Option B — Railway / Render (Free tier)
1. Push to GitHub
2. Connect Railway/Render
3. They auto-detect Django

### Option C — VPS (DigitalOcean / Hostinger)
1. `pip install gunicorn`
2. `gunicorn invoiceos.wsgi:application`
3. Put Nginx in front

---

## Environment Variables (Optional)

Create `backend/.env` to customize:

```
SECRET_KEY=your-long-random-secret
DEBUG=False
COMPANY_NAME=Your Company Name

# Email (for sending invoices)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=you@gmail.com
```

---

## Django Admin Panel
Access at http://localhost:8000/admin
(Use the same admin@example.com credentials)

Useful for directly viewing/editing all database records.
