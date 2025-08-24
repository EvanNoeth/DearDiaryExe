#reference readme for proper sourcing
from flask import Flask, request, jsonify
from openai import OpenAI
import json
import numpy as np
import os
from pymongo import MongoClient
import bcrypt
from datetime import datetime, timezone
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

#make past entries clickable (could be via a drop down box with the entry in it)
#Remove the ability to write text in the AI response chatbox.
#Add loading spinner when reponse is generating
#(maybe?) set limit of uses for a user to not use all api keys
#prompt engineer it a lil bit so it doesnt use a zillion 

app = Flask(__name__)
CORS(app)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_embedding(text):
    response = openai_client.embeddings.create(model="text-embedding-3-small", input=text)
    return response.data[0].embedding

def cosine_similarity(a,  b):
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a)*np.linalg.norm(b))

#create the api endpoint
@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    username = data.get("username")
    entry_text = data.get("entry")
    entry_title = data.get("title", "Untitled Entry")

    if not entry_text or not username:
        return jsonify({"error": "Missing entry"}), 400

    user = users.find_one({"username": username})
    if not user:
        return jsonify({"error": "User not found."}), 404
    
    today = datetime.now(timezone.utc).date()
    todays_entries = [
        e for e in user.get("entries", [])
        if e["date"].date() == today
    ]

    if len(todays_entries) >= 3:
            return jsonify({"error": "Daily limit reached (3 per day). Come back tomorrow!"}), 403

    reply = None

    try:

        past_entries = user.get("entries", [])
        context = "\n".join([f"- {e.get('text','')}" for e in past_entries[-5:]])

        #create the actual prompt itself for gpt to understand how to respond to entry
        prompt = f""" 
        You are a sentient diary. The user has written many entries.
        Here are their recent entries:
        {context}

        Now they write a new one: "{entry_text}"

        You are a playful little diary. Respond to the user's latest entry with empathy, symbolism, and humor unless its about something really serious, in which case you will respond with great levels of sympathy.
        Dont type a super long amount, im on a token limit so only do that if its absolutely necessary.
        """

        reply = None
        try:
            response = openai_client.chat.completions.create(
                model="gpt-5",
                messages=[{"role": "user", "content": prompt}],
                temperature=1
            )
            reply = response.choices[0].message.content
        except Exception as e:
            #Log server side return a friendly fallback
            print("OpenAI error:", e)
            reply = "I saved your entry. Im having trouble thinking right now, but Ill reflect with you next time."
            pass
    except Exception as e:
        reply = None
    #save regardless of AI success
    now = datetime.now(timezone.utc)
    users.update_one(
        {"username": username},
        {"$push": {"entries": {
            "title": entry_title,
            "text": entry_text,
            "reply" : reply,
            "date": now
        }}}
    )

    #send back updated entries list (append the new one locally)
    return jsonify({
        "reply": reply,
        "message": "Entry saved successfully"
    }), 200

uri = os.getenv("MONGO_URI") #actual key to connect as user

mongo_client = MongoClient(uri)
db = mongo_client['sentient_journal']
users = db['users']

#signup and login seperate maps.

@app.route("/signup", methods=["POST"])
def signup(): #receive the signup json and seperate the data and encode the password
    data = request.json
    username = data["username"]
    email = data["email"]
    password = data["password"].encode("utf-8")

    if users.find_one({"username": username}): #check the db users for the same username
        return jsonify({"error" : "Username already exists"}), 400
    
    hashed_pw = bcrypt.hashpw(password, bcrypt.gensalt()) #one-way encryption so only hashed pw is stored
    
    users.insert_one({ #insert the information into the user database
        "username" : username,
        "email" : email,
        "password" : hashed_pw,
        "entries" : []
    })

    return jsonify({"message" : "User Created."})

#perform login route
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data["username"]
    password = data["password"].encode("utf-8")

    user = users.find_one({"username" : username})
    if not user:
        return jsonify({"error" : "User not found."}), 400
    
    if bcrypt.checkpw(password, user["password"]):
        return jsonify({"message" : "Login Successful!"})
    else:
        return jsonify({"error" : "Incorrect password."}),400
    
@app.route("/get_entries", methods=["POST"])
def get_entries():
    data = request.json
    username = data.get("username")

    user = users.find_one({"username": username}, {"_id": 0, "entries": 1})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"entries": user["entries"]})



if __name__ == "__main__":
    app.run(debug=True) #debug on while developing, TURN OFF when released