from flask import Blueprint, session, redirect, url_for, request, jsonify
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
import os

auth_bp = Blueprint('auth', __name__)

# If modifying these SCOPES, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/calendar']

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

CREDENTIALS_PATH = os.path.join(SCRIPT_DIR, 'config', 'credentials.json')

def credentials_to_dict(credentials):
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }

def get_credentials_from_session():
    if 'credentials' not in session:
        return None
    
    return Credentials(
        token=session['credentials']['token'],
        refresh_token=session['credentials']['refresh_token'],
        token_uri=session['credentials']['token_uri'],
        client_id=session['credentials']['client_id'],
        client_secret=session['credentials']['client_secret'],
        scopes=session['credentials']['scopes']
    )

@auth_bp.route('/login')
def login():
    try:
        if not os.path.exists(CREDENTIALS_PATH):
            print(f"Credentials file not found at: {CREDENTIALS_PATH}")
            return "Error: Google OAuth credentials file not found", 500
        
        flow = Flow.from_client_secrets_file(
            CREDENTIALS_PATH,
            scopes=SCOPES,
            redirect_uri=url_for('auth.oauth2callback', _external=True)
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        session['state'] = state
        
        return redirect(authorization_url)
    except Exception as e:
        print(f"Error in login route: {str(e)}")
        return f"Error initiating OAuth flow: {str(e)}", 500

@auth_bp.route('/oauth2callback')
def oauth2callback():
    state = session.get('state', None)
    flow = Flow.from_client_secrets_file(
        CREDENTIALS_PATH,
        scopes=SCOPES,
        state=state,
        redirect_uri=url_for('auth.oauth2callback', _external=True)
    )
    
    flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials
    session['credentials'] = credentials_to_dict(credentials)
    return redirect('http://localhost:5173')
    
@auth_bp.route('/logout')
def logout():
    if 'credentials' in session:
        del session['credentials']
    
    return redirect('/')

@auth_bp.route('/status')
def auth_status():
    # may be able to remove jsonify
    if 'credentials' in session:
        return jsonify({'authenticated': True})
    else:
        return jsonify({'authenticated': False})