const API_BASE = "https://deardiaryexe.onrender.com"
const username = localStorage.getItem("username");

//all html elements
const entriesList = document.getElementById("entriesList");
const entryTitle = document.getElementById("title");
const entryText = document.getElementById("textbox");
const submitBtn = document.getElementById("submit");
const responseBox = document.getElementById("response");
const resetBtn = document.getElementById("reset");
const saveBtn = document.getElementById("save");

//load past entries on page load
async function loadEntries() {
  if (!username) {
    alert("No user logged in. Please log in first.");
    window.location.href = "/DearDiaryExe/index.html"; //back to login
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/get_entries`, { //calling to get entries on flask with specific username
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(data.error);
      return;
    }

    //clear list
    entriesList.innerHTML = "";

    //show each past entry
    data.entries.forEach(e => {
      const li = document.createElement("li");
      li.textContent = `${new Date(e.date).toLocaleDateString()} - ${e.title}`;
      entriesList.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading entries:", err);
  }
}

//create new entry and get ai response
submitBtn.addEventListener("click", async () => {
  const text = entryText.value.trim();
  const title = entryTitle.value.trim() || 'Untitled Entry.';
  if (!text) { //prevent empty text submissions
    alert("Please write something before submitting.");
    return;
  }

  const payload = {username, entry: text, title}; 

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      responseBox.value = data.error || "Something went wrong.";
      return;
    }

    //show ai's response
    responseBox.value = data.reply;

    //update past entries
    loadEntries();

  } catch (err) {
    console.error("Error submitting entry:", err);
    responseBox.value = "Network error. Try again later.";
  }
});

//reset entry
resetBtn.addEventListener("click", () => {
  entryTitle.value = "";
  entryText.value = "";
  responseBox.value = "";
});

//save entry & start fresh
saveBtn.addEventListener("click", () => {
  entryTitle.value = "";
  entryText.value = "";
  responseBox.value = "";
  alert("Entry saved.");
});

//load entries when page opens
loadEntries();
