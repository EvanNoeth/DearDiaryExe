(() => {
  const isGithubPages = location.hostname.endsWith('github.io');
  const API_BASE = isGithubPages ? 'https://deardiaryexe.onrender.com'
                                 : 'http://127.0.0.1:5000';

  // Grab elements
  const entriesList = document.getElementById("entriesList");
  const entryTitle  = document.getElementById("title");
  const entryText   = document.getElementById("textbox");
  const submitBtn   = document.getElementById("submit");
  const responseBox = document.getElementById("response");
  const resetBtn    = document.getElementById("reset");
  const saveBtn     = document.getElementById("save");

  const username = localStorage.getItem("username");

  console.log("diary.js loaded", { API_BASE, username });

  //load all of the past entries from the backend and show them in sidebar.
  async function loadEntries() {
    if (!username) {
      alert("No user logged in. Please log in first.");
      // send back to login in the same repo path
      const basePath = location.pathname.replace(/diary\.html?$/i, '');
      location.href = `${basePath}index.html`;
      return;
    }

    try {
      //asking the backend for past entries
      //console.log("Fetching entries…");
      const res = await fetch(`${API_BASE}/get_entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }) //json with username
      });

      const data = await res.json();
      //console.log("get_entries response:", res.status, data);

      if (!res.ok) {
        //fail error
        entriesList.innerHTML = `<li>${data.error || 'Failed to load entries.'}</li>`;
        return;
      }
      //clear old list items
      entriesList.innerHTML = "";

      //loop over each entry returned by the backend
      (data.entries || []).forEach(e => {
        const li = document.createElement("li");

        //header, the date and the title
        const header = document.createElement("div");
        header.textContent = `${new Date(e.date).toLocaleDateString()} — ${e.title || "Untitled Entry"}`;
        header.style.cursor = "pointer"; //makes it appear clickable
        header.style.fontWeight = "bold";

        //content (actual entry)
        const content = document.createElement("div");
        content.style.display = "none"; //begins collapsed
        content.style.marginLeft = "10px"; 
        content.style.whiteSpace = "pre-wrap"; // keep newlines
        content.innerHTML = `
          <p><strong>Entry:</strong> ${e.text || ""}</p>
          ${e.reply ? `<p><strong>AI Response:</strong> ${e.reply}</p>` : ""}
        `;

        //toggle expand/collapse on click
        header.addEventListener("click", () => {
          content.style.display = content.style.display === "none" ? "block" : "none";
        });

        li.appendChild(header); //build header then content
        li.appendChild(content);
        entriesList.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading entries:", err);
    entriesList.innerHTML = `<li>Network error loading entries.</li>`;
  }
  }

  //submitting new entry to backend for ai response
  async function submitEntry() {
    const text = (entryText.value || "").trim();
    const title = (entryTitle.value || "").trim() || "Untitled Entry";

    if (!text) {
      alert("Please write something before submitting.");
      return;
    }

    const payload = { username, entry: text, title };

    const loading = document.getElementById("loading");
    submitBtn.disabled = true;
    loading.style.display = "inline-block";

    try { //POST entry to /analyze (backend saves + ai responds)
      //console.log("Submitting entry to /analyze…", payload);
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      //console.log("analyze response:", res.status, data);

      if (!res.ok) {
        responseBox.value = data.error || "Something went wrong.";
        return;
      }

      responseBox.value = data.reply || "(Saved. No AI reply.)"; //puts the ai response in the box
      await loadEntries(); //refreshes the left page so the entry shows up instantly
    } catch (err) {
      //console.error("Error submitting entry:", err);
      responseBox.value = "Network error. Try again later.";
    } finally {
      submitBtn.disabled = false;
      loading.style.display = "none";
    }
  }

  // Wire up buttons
  if (submitBtn) submitBtn.addEventListener("click", submitEntry); //generate response
  if (resetBtn)  resetBtn.addEventListener("click", () => { //reset entry
    entryTitle.value = "";
    entryText.value = "";
    responseBox.value = "";
  });

  if (saveBtn)   saveBtn.addEventListener("click", () => { //save & begin new
    entryTitle.value = "";
    entryText.value = "";
    responseBox.value = "";
    alert("Entry saved. Start a new one!");
  });

  // Load on open
  loadEntries();
})();
