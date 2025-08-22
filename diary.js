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

  async function loadEntries() {
    if (!username) {
      alert("No user logged in. Please log in first.");
      // send back to login in the same repo path
      const basePath = location.pathname.replace(/diary\.html?$/i, '');
      location.href = `${basePath}index.html`;
      return;
    }

    try {
      console.log("Fetching entries…");
      const res = await fetch(`${API_BASE}/get_entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });

      const data = await res.json();
      console.log("get_entries response:", res.status, data);

      if (!res.ok) {
        entriesList.innerHTML = `<li>${data.error || 'Failed to load entries.'}</li>`;
        return;
      }

      entriesList.innerHTML = "";
      (data.entries || []).forEach(e => {
        const li = document.createElement("li");
        const date = e.date ? new Date(e.date).toLocaleDateString() : '';
        const title = e.title || "Untitled Entry";
        li.textContent = `${date} — ${title}`;
        entriesList.appendChild(li);
      });
    } catch (err) {
      console.error("Error loading entries:", err);
      entriesList.innerHTML = `<li>Network error loading entries.</li>`;
    }
  }

  async function submitEntry() {
    const text = (entryText.value || "").trim();
    const title = (entryTitle.value || "").trim() || "Untitled Entry";

    if (!text) {
      alert("Please write something before submitting.");
      return;
    }

    const payload = { username, entry: text, title };

    try {
      console.log("Submitting entry to /analyze…", payload);
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log("analyze response:", res.status, data);

      if (!res.ok) {
        responseBox.value = data.error || "Something went wrong.";
        return;
      }

      responseBox.value = data.reply || "(Saved. No AI reply.)";
      await loadEntries();
    } catch (err) {
      console.error("Error submitting entry:", err);
      responseBox.value = "Network error. Try again later.";
    }
  }

  // Wire up buttons
  if (submitBtn) submitBtn.addEventListener("click", submitEntry);
  if (resetBtn)  resetBtn.addEventListener("click", () => {
    entryTitle.value = "";
    entryText.value = "";
    responseBox.value = "";
  });
  if (saveBtn)   saveBtn.addEventListener("click", () => {
    entryTitle.value = "";
    entryText.value = "";
    responseBox.value = "";
    alert("Entry saved. Start a new one!");
  });

  // Load on open
  loadEntries();
})();
