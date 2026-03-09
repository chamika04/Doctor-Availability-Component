from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
import pandas as pd
import os
from datetime import datetime
import calendar

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173"]}})

# =========================
# MongoDB Atlas Connection
# =========================
MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("DB_NAME", "hospital_db")

client = MongoClient(MONGODB_URL)
db = client[DB_NAME]

# =========================
# HELPER FUNCTIONS
# =========================

def time_to_minutes(tstr):
    h, m = map(int, tstr.split(":"))
    return h * 60 + m

def level_from_percent(p):
    if p >= 70:
        return "High"
    elif p >= 40:
        return "Medium"
    return "Low"

def compute_day_availability_from_db(doctor_id, date_str):
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    day_name = dt.strftime("%A")

    # 1. Check exception
    ex = db.exceptions.find_one({"doctor_id": doctor_id, "date": date_str})
    if ex:
        return {
            "date": date_str,
            "day": day_name,
            "is_available": False,
            "start": None,
            "end": None,
            "availability_percent": 0,
            "level": "Low",
            "reason": "Doctor not available (leave/exception)"
        }

    # 2. Check weekly session
    sess = db.weekly_sessions.find_one({
        "doctor_id": doctor_id,
        "day_of_week": day_name
    })

    if not sess:
        return {
            "date": date_str,
            "day": day_name,
            "is_available": False,
            "start": None,
            "end": None,
            "availability_percent": 0,
            "level": "Low",
            "reason": "No OPD session on this day"
        }

    start = sess["start_time"]
    end = sess["end_time"]
    slot_minutes = int(sess.get("slot_minutes", 15))

    total_slots = max(0, (time_to_minutes(end) - time_to_minutes(start)) // slot_minutes)

    booked_count = db.appointments.count_documents({
        "doctor_id": doctor_id,
        "date": date_str,
        "status": "BOOKED"
    })

    available_slots = max(0, total_slots - booked_count)
    availability_percent = int(round((available_slots / total_slots) * 100)) if total_slots > 0 else 0

    return {
        "date": date_str,
        "day": day_name,
        "is_available": True,
        "start": start,
        "end": end,
        "slot_minutes": slot_minutes,
        "total_slots": total_slots,
        "booked_slots": booked_count,
        "available_slots": available_slots,
        "availability_percent": availability_percent,
        "level": level_from_percent(availability_percent)
    }

# =========================
# BASIC ROUTES
# =========================

@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200


@app.get("/db-check")
def db_check():
    try:
        client.admin.command("ping")
        return jsonify({"db": "connected", "db_name": DB_NAME}), 200
    except Exception as e:
        return jsonify({"db": "error", "message": str(e)}), 500

# =========================
# CSV IMPORT ROUTES
# =========================

@app.post("/api/doctors/import-csv")
def import_doctors_from_csv():
    df = pd.read_csv("doctors.csv")
    rows = df.to_dict(orient="records")
    db.doctors.delete_many({})
    if rows:
        db.doctors.insert_many(rows)
    return jsonify({"message": "Doctors imported", "count": len(rows)}), 201


@app.post("/api/sessions/import-csv")
def import_sessions_from_csv():
    df = pd.read_csv("weekly_sessions.csv")
    rows = df.to_dict(orient="records")
    db.weekly_sessions.delete_many({})
    if rows:
        db.weekly_sessions.insert_many(rows)
    return jsonify({"message": "weekly_sessions imported", "count": len(rows)}), 201


@app.post("/api/appointments/import-csv")
def import_appointments_from_csv():
    df = pd.read_csv("appointments.csv")
    rows = df.to_dict(orient="records")
    db.appointments.delete_many({})
    if rows:
        db.appointments.insert_many(rows)
    return jsonify({"message": "appointments imported", "count": len(rows)}), 201


@app.post("/api/exceptions/import-csv")
def import_exceptions_from_csv():
    df = pd.read_csv("exceptions.csv")
    rows = df.to_dict(orient="records")
    db.exceptions.delete_many({})
    if rows:
        db.exceptions.insert_many(rows)
    return jsonify({"message": "exceptions imported", "count": len(rows)}), 201

# =========================
# AVAILABILITY ROUTES
# =========================

@app.post("/api/doctor/availability-date")
def availability_date():
    body = request.json
    doctor_id = body.get("doctor_id")
    date_str = body.get("date")

    if not doctor_id or not date_str:
        return jsonify({"error": "doctor_id and date required"}), 400

    doc = db.doctors.find_one({"doctor_id": doctor_id}, {"_id": 0})
    if not doc:
        return jsonify({"error": "Doctor not found"}), 404

    availability = compute_day_availability_from_db(doctor_id, date_str)

    return jsonify({
        "doctor": doc,
        "doctor_id": doctor_id,
        "date": date_str,
        "availability": availability
    }), 200


@app.post("/api/doctor/availability-month")
def availability_month():
    body = request.json
    doctor_id = body.get("doctor_id")
    year = int(body.get("year"))
    month = int(body.get("month"))

    doc = db.doctors.find_one({"doctor_id": doctor_id}, {"_id": 0})
    if not doc:
        return jsonify({"error": "Doctor not found"}), 404

    days_in_month = calendar.monthrange(year, month)[1]
    results = []

    for d in range(1, days_in_month + 1):
        date_str = f"{year:04d}-{month:02d}-{d:02d}"
        results.append(compute_day_availability_from_db(doctor_id, date_str))

    return jsonify({
        "doctor": doc,
        "month": f"{year:04d}-{month:02d}",
        "days": results
    }), 200

@app.get("/api/debug/sessions/<doctor_id>")
def debug_sessions(doctor_id):
    sessions = list(db.weekly_sessions.find({"doctor_id": doctor_id}, {"_id": 0}).limit(50))
    return jsonify({"doctor_id": doctor_id, "count": len(sessions), "sessions": sessions}), 200

@app.post("/api/debug/add-session")
def add_session():
    data = request.json
    db.weekly_sessions.insert_one(data)
    return jsonify({"message": "session added"}), 201

@app.post("/api/debug/cleanup-duplicate-sessions")
def cleanup_duplicate_sessions():
    # Keep one record per (doctor_id, day_of_week, start_time, end_time)
    pipeline = [
        {
            "$group": {
                "_id": {
                    "doctor_id": "$doctor_id",
                    "day_of_week": "$day_of_week",
                    "start_time": "$start_time",
                    "end_time": "$end_time"
                },
                "ids": {"$push": "$_id"},
                "count": {"$sum": 1}
            }
        },
        {"$match": {"count": {"$gt": 1}}}
    ]

    duplicates = list(db.weekly_sessions.aggregate(pipeline))
    deleted = 0

    for dup in duplicates:
        ids = dup["ids"]
        # keep first, delete rest
        to_delete = ids[1:]
        if to_delete:
            res = db.weekly_sessions.delete_many({"_id": {"$in": to_delete}})
            deleted += res.deleted_count

    return jsonify({"message": "cleanup done", "deleted": deleted}), 200

@app.post("/api/ui/doctor-availability")
def ui_doctor_availability():
    body = request.json
    doctor_id = body.get("doctor_id")
    date_str = body.get("date")  # YYYY-MM-DD

    if not doctor_id or not date_str:
        return jsonify({"error": "doctor_id and date required"}), 400

    availability = compute_day_availability_from_db(doctor_id, date_str)

    # UI-focused response
    return jsonify({
        "doctor_id": doctor_id,
        "date": date_str,
        "is_available": availability["is_available"],
        "availability_percent": availability["availability_percent"],
        "level": availability["level"],
        "time": f'{availability["start"]} - {availability["end"]}' if availability["start"] else None,
        "reason": availability.get("reason")
    }), 200


@app.get("/api/ui/model-accuracy")
def model_accuracy():
    """
    Returns simple, demo-friendly "accuracy" metrics.
    This calculates accuracy on the OPD status dataset if available in MongoDB.
    If you don't have OPD status collection, we return placeholder until you add it.
    """

    try:
        # If you saved accuracy metrics already, store them in MongoDB:
        # db.model_metrics.insert_one({ "name":"opd_status_model", "mape": 8.7, "r2": 0.91, ... })
        # Then just read the latest:
        latest = db.model_metrics.find_one(
            {"name": "opd_status_model"},
            sort=[("created_at", -1)],
            projection={"_id": 0}
        )

        if latest:
            return jsonify(latest), 200

        # Fallback if not saved yet
        return jsonify({
            "name": "opd_status_model",
            "status": "metrics_not_saved",
            "message": "Run evaluation in Colab and save metrics into MongoDB collection: model_metrics"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

# =========================
# RUN APP
# =========================

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)