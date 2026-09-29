import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Load local environment keys safely
load_dotenv()

app = Flask(__name__)
# Enable CORS so your front-end HTML files can communicate with the backend
CORS(app)

# Initialize Supabase Client
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        username = data.get('username')
        gender = data.get('gender')

        # Register user in Supabase Auth with custom metadata
        response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "username": username,
                    "gender": gender
                }
            }
        })
        
        return jsonify({"message": "Registration successful! Please check your email for confirmation.", "user": response.user.id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        # Authenticate user
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        return jsonify({
            "message": "Login successful!", 
            "access_token": response.session.access_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "username": response.user.user_metadata.get('username'),
                "gender": response.user.user_metadata.get('gender')
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/feedback', methods=['POST'])
def save_feedback():
    try:
        # Securely capture auth headers sent from front-end
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized: Missing or invalid token format"}), 401
            
        data = request.json
        username = data.get('username')
        message = data.get('message')

        # Split out the token string cleanly
        token = auth_header.split(" ")[1]
        
        # Decode token implicitly by requesting data from auth profile
        user_response = supabase.auth.get_user(token)
        user_id = user_response.user.id

        # Insert comment securely into your public table
        # Notice we call .execute() at the end to commit changes
        supabase.table('feedback').insert({
            "user_id": user_id,
            "username": username,
            "message": message
        }).execute()

        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(f"FEEDBACK WRITE ERROR TRACEBACK: {str(e)}") # This prints to your cmd terminal
        return jsonify({"error": str(e)}), 400

@app.route('/api/feedback', methods=['GET'])
def get_feedback():
    try:
        # Pull comments ordered by newest first
        response = supabase.table('feedback').select("*").order('created_at', desc=True).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

import requests # Make sure 'import requests' is added at the top of your app.py file


@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No payload data received"}), 400
            
        # Restore the exact single text string parameter that worked natively
        user_message = data.get('message')
        if not user_message:
            return jsonify({"error": "Message text space cannot be blank"}), 400
        
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            return jsonify({"error": "Groq API key configuration missing"}), 500

        current_time_str = datetime.now().strftime("%A, %B %d, %Y")

        url = "https://groq.com"
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        
        # RESTORED: Exactly your working model parameter choice
        payload = {
            "model": "qwen/qwen3.8-27b", 
            "messages": [
                {
                    "role": "system", 
                    "content": f"You are a professional, polite portfolio AI assistant named Qwen. Today's current date is {current_time_str}. Keep responses punchy, concise, and friendly."
                },
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.7
        }

        # Enforce standard POST communications to eliminate the 405 error code
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        try:
            response_data = response.json()
        except Exception:
            return jsonify({
                "error": f"Groq engine returned a non-JSON format structure. Status: {response.status_code}. Content: {response.text[:60]}"
            }), 500

        if response.status_code == 200:
            ai_reply = response_data['choices']['message']['content']
            return jsonify({"reply": ai_reply}), 200
        else:
            error_msg = response_data.get('error', {}).get('message', 'Unknown communication failure')
            return jsonify({"error": f"Groq Error ({response.status_code}): {error_msg}"}), response.status_code

    except Exception as e:
        return jsonify({"error": f"Internal Application Exception Error: {str(e)}"}), 500


if __name__ == '__main__':
    # Render passes an environment variable called 'PORT'. We read it natively.
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)


