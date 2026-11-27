const API = "/api/applications";
const $ = (id) => document.getElementById(id);

let applications = [];   // current list shown in the table
let editingId = null;    // null = adding, otherwise the _id being edited

// ---------- helpers ----------

// Make text safe to put inside HTML
function esc(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Something went wrong");
  }
  return res.status === 204 ? null : res.json();
}

// ---------- loading data ----------

async function loadStats() {
  const s = await request(`${API}/stats`);
  $("statTotal").textContent = s.total;
  $("statApplied").textContent = s.Applied;
  $("statInterview").textContent = s.Interview;
  $("statOffers").textContent = s.Offer;
}

async function loadApplications() {
  const params = new URLSearchParams();
  if ($("search").value.trim()) params.set("search", $("search").value.trim());
  if ($("statusFilter").value) params.set("status", $("statusFilter").value);
  applications = await request(`${API}?${params}`);
  renderTable();
}

async function refresh() {
  try {
    await Promise.all([loadApplications(), loadStats()]);
  } catch (err) {
    alert(err.message);
  }
}

// ---------- rendering ----------

function renderTable() {
  const body = $("tableBody");
  $("emptyMsg").hidden = applications.length > 0;

  body.innerHTML = applications
    .map((a) => {
      const company = /^https?:\/\//i.test(a.link || "")
        ? `<a href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">${esc(a.company)}</a>`
        : esc(a.company);

      return `
        <tr>
          <td>${company}</td>
          <td>${esc(a.role)}</td>
          <td>${formatDate(a.dateApplied)}</td>
          <td><span class="badge ${esc(a.status)}">${esc(a.status)}</span></td>
          <td class="actions">
            <button type="button" class="btn" data-action="edit" data-id="${a._id}">Edit</button>
            <button type="button" class="btn" data-action="delete" data-id="${a._id}">Delete</button>
          </td>
        </tr>`;
    })
    .join("");
}

// ---------- popup form ----------

function openForm(app) {
  editingId = app ? app._id : null;
  $("dialogTitle").textContent = app ? "Edit Application" : "Add Application";
  $("company").value = app ? app.company : "";
  $("role").value = app ? app.role : "";
  $("link").value = app ? app.link || "" : "";
  $("dateApplied").value = app && app.dateApplied
    ? app.dateApplied.slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  $("status").value = app ? app.status : "Applied";
  $("notes").value = app ? app.notes || "" : "";
  $("jobDialog").showModal();
}

$("addBtn").addEventListener("click", () => openForm(null));
$("cancelBtn").addEventListener("click", () => $("jobDialog").close());

$("jobForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    company: $("company").value,
    role: $("role").value,
    link: $("link").value,
    dateApplied: $("dateApplied").value || undefined,
    status: $("status").value,
    notes: $("notes").value,
  };

  try {
    if (editingId) {
      await request(`${API}/${editingId}`, { method: "PUT", body: JSON.stringify(data) });
    } else {
      await request(API, { method: "POST", body: JSON.stringify(data) });
    }
    $("jobDialog").close();
    refresh();
  } catch (err) {
    alert(err.message);
  }
});

// ---------- edit / delete buttons (event delegation) ----------

$("tableBody").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const app = applications.find((a) => a._id === btn.dataset.id);
  if (!app) return;

  if (btn.dataset.action === "edit") {
    openForm(app);
  } else if (btn.dataset.action === "delete") {
    if (!confirm(`Delete ${app.company} - ${app.role}?`)) return;
    try {
      await request(`${API}/${app._id}`, { method: "DELETE" });
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }
});

// ---------- search + filter ----------

let searchTimer;
$("search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadApplications, 300); // wait until typing pauses
});
$("statusFilter").addEventListener("change", loadApplications);

// ---------- start ----------
refresh();
