from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from datetime import datetime, timedelta, timezone
import os.path
import pickle

# If modifying these SCOPES, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service():
    """Authenticates and returns a Google Calendar service object, or uses credentials from existing token.pickle file""" 
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            credentials_path = os.path.join(script_dir, 'config', 'credentials.json')
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    service = build('calendar', 'v3', credentials=creds)
    return service
    
def create_event(event_params):
    """Creates a Google Calendar event"""
    service = get_calendar_service()

    # Build the start and end datetime strings (assuming UTC here, adjust as needed)
    start_datetime = f"{event_params['date']}T{event_params['start_time']}:00"
    end_datetime = f"{event_params['date']}T{event_params['end_time']}:00"

    event_body = {
        "summary": event_params['title'],
        "start": {"dateTime": start_datetime, "timeZone": "UTC"},
        "end": {"dateTime": end_datetime, "timeZone": "UTC"}
    }

    if 'recurrence' in event_params and event_params['recurrence']:
        # The API expects a list of recurrence rules.
        event_body["recurrence"] = [event_params['recurrence']]

    if 'reminder' in event_params and event_params['reminder']:
        event_body["reminders"] = {
            "useDefault": False,
            "overrides": [{"method": "popup", "minutes": event_params['reminder']}]
        }

    created_event = service.events().insert(calendarId='primary', body=event_body).execute()
    return created_event

def main():
    import GUI
    GUI.main()

if __name__ == '__main__':
    main()