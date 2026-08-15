from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

DISASTER_TYPES = [
    {"id": 1, "name": "Flood", "icon": "🌊", "color": "#38bdf8"},
    {"id": 2, "name": "Fire", "icon": "🔥", "color": "#fb7185"},
    {"id": 3, "name": "Landslide", "icon": "⛰️", "color": "#f59e0b"},
    {"id": 4, "name": "Earthquake", "icon": "🌍", "color": "#a78bfa"},
    {"id": 5, "name": "Cyclone", "icon": "🌀", "color": "#60a5fa"},
    {"id": 6, "name": "Accident", "icon": "🚑", "color": "#f97316"},
    {"id": 7, "name": "Other", "icon": "⚠️", "color": "#94a3b8"},
]

DISTRICTS = [
    {"id": 1, "name": "Thiruvananthapuram", "lat": "8.5241", "lng": "76.9366"},
    {"id": 2, "name": "Kollam", "lat": "8.8932", "lng": "76.6141"},
    {"id": 3, "name": "Pathanamthitta", "lat": "9.2648", "lng": "76.7870"},
    {"id": 4, "name": "Alappuzha", "lat": "9.4981", "lng": "76.3388"},
    {"id": 5, "name": "Kottayam", "lat": "9.5916", "lng": "76.5222"},
    {"id": 6, "name": "Idukki", "lat": "9.9189", "lng": "77.1025"},
    {"id": 7, "name": "Ernakulam", "lat": "9.9816", "lng": "76.2999"},
    {"id": 8, "name": "Thrissur", "lat": "10.5276", "lng": "76.2144"},
    {"id": 9, "name": "Palakkad", "lat": "10.7867", "lng": "76.6548"},
    {"id": 10, "name": "Malappuram", "lat": "11.0510", "lng": "76.0711"},
    {"id": 11, "name": "Kozhikode", "lat": "11.2588", "lng": "75.7804"},
    {"id": 12, "name": "Wayanad", "lat": "11.6854", "lng": "76.1320"},
    {"id": 13, "name": "Kannur", "lat": "11.8745", "lng": "75.3704"},
    {"id": 14, "name": "Kasaragod", "lat": "12.4996", "lng": "74.9869"},
]

reports = []


def detect_language(text):
    text = (text or "").lower()

    malayalam = sum(
        0x0D00 <= ord(ch) <= 0x0D7F
        for ch in text
    )

    hindi = sum(
        0x0900 <= ord(ch) <= 0x097F
        for ch in text
    )

    if malayalam > 2:
        return "ml"

    if hindi > 2:
        return "hi"

    return "en"


def make_ai_prediction(report):

    severity = int(
        report.get("severityLevel") or 3
    )

    disaster_id = int(
        report.get("disasterTypeId") or 1
    )

    disaster = next(
        (
            x["name"]
            for x in DISASTER_TYPES
            if x["id"] == disaster_id
        ),
        "Emergency"
    )

    if severity >= 5:

        level = "Critical"

        recommendation = (
            "Immediate emergency response recommended. "
            "Evacuate vulnerable people and contact emergency services."
        )

    elif severity >= 4:

        level = "High"

        recommendation = (
            "Prioritize the affected area, warn nearby residents "
            "and coordinate emergency assistance."
        )

    elif severity >= 3:

        level = "Moderate"

        recommendation = (
            "Monitor the situation, keep emergency contacts available "
            "and avoid unsafe areas."
        )

    else:

        level = "Low"

        recommendation = (
            "Continue monitoring and report any escalation immediately."
        )

    return {
        "riskLevel": level,
        "disasterType": disaster,
        "severity": severity,
        "recommendation": recommendation,
        "summary": (
            f"{disaster} report assessed at "
            f"severity level {severity}."
        )
    }


@app.get("/api/health")
def health():

    return jsonify({
        "status": "ok",
        "service": "Multilingual Disaster Reporting System"
    })


@app.get("/api/disaster-types")
def disaster_types():

    return jsonify(DISASTER_TYPES)


@app.get("/api/districts")
def districts():

    return jsonify(DISTRICTS)


@app.get("/api/stats")
def stats():

    total = len(reports)

    by_type = {}
    by_severity = {}
    by_district = {}

    for report in reports:

        disaster_type = report["disasterType"]

        by_type[disaster_type] = (
            by_type.get(disaster_type, 0) + 1
        )

        severity = str(report["severityLevel"])

        by_severity[severity] = (
            by_severity.get(severity, 0) + 1
        )

        district = (
            report.get("district")
            or "Unknown"
        )

        by_district[district] = (
            by_district.get(district, 0) + 1
        )

    return jsonify({
        "totalReports": total,
        "byType": by_type,
        "bySeverity": by_severity,
        "byDistrict": by_district
    })


@app.post("/api/process-disaster-report")
def process_report():

    data = request.get_json(
        silent=True
    ) or {}

    description = data.get(
        "description",
        ""
    )

    language = detect_language(
        description
    )

    prediction = make_ai_prediction(
        data
    )

    return jsonify({

        "status": "success",

        "dispatch_data": {

            "original_text": description,

            "detected_language": language,

            "english_translation": description,

            "severity": data.get(
                "severityLevel"
            ),

            "coordinates": {

                "lat": data.get("lat"),

                "lng": data.get("lng")
            },

            "disaster_type": data.get(
                "disasterType"
            )
        },

        "aiPrediction": prediction
    })


@app.post("/api/disaster-reports")
def submit_report():

    data = request.get_json(
        silent=True
    ) or {}

    if not data.get(
        "disasterTypeId"
    ):

        return jsonify({
            "message":
            "Please select a disaster type."
        }), 400

    prediction = make_ai_prediction(
        data
    )

    language = detect_language(
        data.get(
            "description",
            ""
        )
    )

    disaster = next(
        (
            x
            for x in DISASTER_TYPES
            if x["id"] ==
            int(data["disasterTypeId"])
        ),
        DISASTER_TYPES[-1]
    )

    report = {

        "id": len(reports) + 1,

        "createdAt":
            datetime.utcnow().isoformat()
            + "Z",

        "disasterType":
            disaster["name"],

        "disasterTypeId":
            int(data["disasterTypeId"]),

        "district":
            data.get("district", ""),

        "detailedLocation":
            data.get(
                "detailedLocation",
                ""
            ),

        "description":
            data.get(
                "description",
                ""
            ),

        "severityLevel":
            int(
                data.get(
                    "severityLevel",
                    3
                )
            ),

        "peopleAffected":
            data.get(
                "peopleAffected"
            ),

        "contactNumber":
            data.get(
                "contactNumber",
                ""
            ),

        "lat":
            data.get("lat"),

        "lng":
            data.get("lng"),

        "detectedLanguage":
            language,

        "hasPhoto":
            bool(
                data.get(
                    "photoUrl"
                )
            ),

        "hasVideo":
            bool(
                data.get(
                    "videoUrl"
                )
            )
    }

    reports.append(report)

    return jsonify({

        "message":
            "Report submitted successfully.",

        "report":
            report,

        "aiPrediction":
            prediction

    }), 201


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
