from flask import Flask, request, jsonify
from flask_cors import CORS
import ai_model
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import os
import secrets
from auth_routes import auth_bp, get_credentials_from_session

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)  # Generate a secure secret key for sessions
CORS(app, supports_credentials=True)  # Enable CORS with credential support

app.register_blueprint(auth_bp, url_prefix='/auth')

@app.route('/api/process-message', methods=['POST'])
def process_message():
    """
    Process user messages and extract calendar event details
    """
    data = request.json
    user_message = data.get('message', '')
    
    response = ai_model.run_conversation(user_message)
    
    return jsonify({"response": response})

@app.route('/api/create-events', methods=['POST'])
def create_events_endpoint():
    """
    Create calendar events with the provided parameters using OAuth credentials from session
    """
    credentials = get_credentials_from_session()
    if not credentials:
        return jsonify({"error": "Not authenticated", "auth_required": True}), 401
    
    data = request.json
    events = data.get('events', [])
    
    if not events:
        return jsonify({"error": "No events provided"}), 400
    
    service = build('calendar', 'v3', credentials=credentials)
    
    results = []
    for event_params in events:
        try:
            # Build the start and end datetime strings
            start_datetime = f"{event_params['date']}T{event_params['start_time']}:00"
            end_datetime = f"{event_params['date']}T{event_params['end_time']}:00"

            event_body = {
                "summary": event_params['title'],
                "start": {"dateTime": start_datetime, "timeZone": "UTC"},
                "end": {"dateTime": end_datetime, "timeZone": "UTC"}
            }

            if 'recurrence' in event_params and event_params['recurrence']:
                # The API expects a list of recurrence rules
                event_body["recurrence"] = [event_params['recurrence']]

            if 'reminder' in event_params and event_params['reminder']:
                event_body["reminders"] = {
                    "useDefault": False,
                    "overrides": [{"method": "popup", "minutes": event_params['reminder']}]
                }

            created_event = service.events().insert(calendarId='primary', body=event_body).execute()
            
            results.append({
                "success": True,
                "id": created_event.get("id", "unknown"),
                "link": created_event.get("htmlLink", "")
            })
        except Exception as e:
            results.append({
                "success": False,
                "error": str(e)
            })
    
    return jsonify({
        "success": all(r["success"] for r in results),
        "results": results
    })

@app.route('/test')
def test():
    return "Flask server is running correctly!"

if __name__ == '__main__':
    app.run(debug=True, port=5000)