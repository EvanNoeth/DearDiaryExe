from flask import Flask, request, jsonify
from openai import OpenAI
import json
import numpy as np
import os


app = Flask(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MEMORY_FILE = 'memory.json'

def get_embedding(text):
    response = client.embeddings.create(model="text-embedding-3-small", input=text)  # Updated API call
    return response.data[0].embedding

def cosine_similarity(a,  b):
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a)*np.linalg.norm(b))

#load saved journal entries via a json file
def load_memory():
    if not os.path.exists(MEMORY_FILE):
        return [] #basically if this is the first time a user has done an entry we cant reference previous entries and therefore return blank
    try:
        with open(MEMORY_FILE, "r") as f:
            content = f.read()
            return json.loads(content) if content.strip() else []  # Handle empty file
    except json.JSONDecodeError:
        return []  # Return empty list if JSON is invalid

#saves entries to memory file
def save_memory(memory):
    with open(MEMORY_FILE, "w") as f:
        json.dump(memory, f)

#create the api endpoint
@app.route("/analyze", methods=["POST"]) #using post to accept journal entries
def analyze():
    #validate input
    data = request.json #readable journal entry as a dictionary in python
    entry = data.get("entry","").strip() #here we receive specifically the entry itself from the dictionary
    if not entry:
        return jsonify({"error": "Missing entry"}), 400 #the error sent if its empty

    #generate embedding for the new entry
    new_emb = get_embedding(entry) #converts the text to the vector embeddings

    #load memory and find top 3 similar past entries
    memory = load_memory()
    #score each entry by similiarity to the new one
    scored = [
        {**m, "score": cosine_similarity(new_emb, m["embedding"])}
        for m in memory
    ]
    top = sorted(scored, key=lambda x: x["score"], reverse=True)[:3] #:3 mentioned! (means it finds the top 3 matches)

    #build a prompt for gpt to use to respond to the entry
    memory_text = "\n".join(f"- {m['text']}" for m in top)  #format memories as bullet points
    prompt = f"""
    You are a playful little diary. Respond to the user's latest entry with empathy, symbolism, and humor unless its about something really serious.

    Latest entry:
    "{entry}"

    Memories you recall:
    {memory_text}
    """

    #get the response from gpt
    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    reply = response.choices[0].message.content  # Fixed response parsing

    #save the new entry to memory
    memory.append({"text": entry, "embedding": new_emb})
    save_memory(memory)

    #return gpt's response to the client
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True) #debug on while developing, TURN OFF when released