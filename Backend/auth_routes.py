from flask import Blueprint, session, redirect, url_for, request, jsonify, render_template_string
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
    if 'google_creds' not in session:
        return None
    
    return Credentials(
        token=session['google_creds']['token'],
        refresh_token=session['google_creds']['refresh_token'],
        token_uri=session['google_creds']['token_uri'],
        client_id=session['google_creds']['client_id'],
        client_secret=session['google_creds']['client_secret'],
        scopes=session['google_creds']['scopes']
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
    creds = flow.credentials
    # session['credentials'] = credentials_to_dict(creds)
    session["google_creds"] = {
        "token": creds.token,   # This is the access token
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes
    }

    # generate your own JWT or send back raw token:
    payload = {"success": True, "token": creds.token}
    # Render a tiny page that messages back and closes the popup
    return render_template_string("""
      <html><body>
      <script>
        // send the token back to opener
        window.opener.postMessage({{payload|tojson}}, window.origin);
        // close this popup
        window.close();
      </script>
      </body></html>
    """, payload=payload)
    # return redirect('http://localhost:5173')
    
@auth_bp.route('/logout')
def logout():
    if 'google_creds' in session:
        del session['google_creds']
    
    return redirect('/')

@auth_bp.route('/status')
def auth_status():
    # may be able to remove jsonify
    if 'google_creds' in session:
        return jsonify({'authenticated': True})
    else:
        return jsonify({'authenticated': False})