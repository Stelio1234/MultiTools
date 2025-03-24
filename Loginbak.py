from flask import Flask, request, jsonify
import os
import json
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Define the Accounts directory and the user file
ACCOUNTS_DIR = os.path.join(os.getcwd(), 'Accounts')
USERS_FILE = os.path.join(ACCOUNTS_DIR, 'users.json')

# Ensure Accounts directory exists
if not os.path.exists(ACCOUNTS_DIR):
    os.makedirs(ACCOUNTS_DIR)

# Load users from users.json file
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as file:
            return json.load(file).get('users', [])
    return []

# Save users to users.json file
def save_users(users):
    with open(USERS_FILE, 'w') as file:
        json.dump({"users": users}, file)

# Route to register a new user
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    users = load_users()
    
    # Check if the username already exists
    if any(user['username'] == username for user in users):
        return jsonify({"error": "Username already exists"}), 400
    
    # Hash the password before storing it
    hashed_password = generate_password_hash(password, method='sha256')
    
    # Add the new user to the list
    users.append({"username": username, "password": hashed_password})

    # Save the updated users list to the file
    save_users(users)
    
    return jsonify({"message": "User registered successfully"}), 201

# Route to login a user
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    users = load_users()
    
    # Find the user by username
    user = next((user for user in users if user['username'] == username), None)
    
    if user is None:
        return jsonify({"error": "User not found"}), 404

    # Check the password
    if not check_password_hash(user['password'], password):
        return jsonify({"error": "Incorrect password"}), 400

    return jsonify({"message": "Login successful"}), 200

if __name__ == '__main__':
    app.run(debug=True)
