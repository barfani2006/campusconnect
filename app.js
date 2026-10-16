const state = { category: "All", query: "", saved: new Set(), showAll: false, listings: [] };
const $ = (s) => document.querySelector(s);
const listingGrid = $("#listingGrid");
const money = (value) => Number(value) > 0 ? `₹${Number(value).toLocaleString("en-IN")}` : "FREE";
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));

async function loadListings() {
  listingGrid.innerHTML = '<div class="loading-card">Finding useful campus picks…</div>';
  try {
    const params = new URLSearchParams();
    if (state.category !== "All") params.set("category", state.category);
    if (state.query) params.set("q", state.query);
    const res = await fetch(`/api/listings?${params}`);
    if (!res.ok) throw new Error("API unavailable");
    const data = await res.json();
    state.listings = data.listings || [];
    renderListings();
  } catch {
    listingGrid.innerHTML = '<div class="empty-state">The demo server is not reachable. Start it with <b>npm start</b> and refresh.</div>';
  }
}
function renderListings() {
  const shown = state.showAll ? state.listings : state.listings.slice(0, 6);
  $("#resultCount").textContent = `${state.listings.length} ${state.listings.length === 1 ? "listing" : "listings"} to explore`;
  $("#savedCount").textContent = state.saved.size;
  if (!shown.length) {
    listingGrid.innerHTML = '<div class="empty-state"><strong>No matches just yet.</strong><br><br>Try another search or add a sample listing to the campus board.</div>';
    return;
  }
  listingGrid.innerHTML = shown.map(item => `
    <article class="listing-card">
      <div class="listing-visual"><span class="listing-badge">${esc(item.badge || "Community listing")}</span><span class="listing-emoji">${esc(item.icon || "✳")}</span>
      <button class="save-button ${state.saved.has(item.id) ? "saved" : ""}" data-save="${item.id}" aria-label="${state.saved.has(item.id) ? "Remove saved listing" : "Save listing"}">${state.saved.has(item.id) ? "♥" : "♡"}</button></div>
      <div class="listing-info"><div class="listing-meta"><span>${esc(item.category)}</span><span>Campus pick</span></div>
      <h3>${esc(item.title)}</h3><p>${esc(item.detail)}</p>
      <div class="listing-bottom"><span class="listing-price ${Number(item.price)===0?"free":""}">${money(item.price)}</span><span class="listing-seller"><strong>${esc(item.seller)}</strong>Community listing</span></div></div>
    </article>`).join("");
  listingGrid.querySelectorAll("[data-save]").forEach(btn => btn.addEventListener("click", () => {
    const id = Number(btn.dataset.save);
    state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
    renderListings();
    toast(state.saved.has(id) ? "Saved to your campus list." : "Removed from saved listings.");
  }));
  $("#viewAll").style.display = state.listings.length > 6 ? "inline-flex" : "none";
  $("#viewAll").innerHTML = state.showAll ? 'Show fewer listings <span>↑</span>' : 'Show all listings <span>↓</span>';
}
function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2300);
}
function chooseCategory(category) {
  state.category = category;
  state.showAll = false;
  document.querySelectorAll(".category-card").forEach(btn => btn.classList.toggle("active", btn.dataset.category === category));
  loadListings();
  document.querySelector(".listings-section").scrollIntoView({behavior:"smooth", block:"start"});
}
document.querySelectorAll(".category-card").forEach(btn => btn.addEventListener("click", () => chooseCategory(btn.dataset.category)));
let searchTimer;
$("#searchInput").addEventListener("input", (e) => {
  state.query = e.target.value.trim();
  state.showAll = false;
  clearTimeout(searchTimer); searchTimer = setTimeout(loadListings, 180);
});
$("#clearFilters").addEventListener("click", () => {
  state.category = "All"; state.query = ""; state.showAll = false; $("#searchInput").value = "";
  document.querySelectorAll(".category-card").forEach(btn => btn.classList.toggle("active", btn.dataset.category === "All"));
  loadListings();
});
$("#viewAll").addEventListener("click", () => { state.showAll = !state.showAll; renderListings(); });
$("#savedButton").addEventListener("click", () => {
  if (!state.saved.size) return toast("Save a listing using the heart icon to see it here.");
  state.category = "All"; state.query = ""; $("#searchInput").value = "";
  const saved = state.listings.filter(x => state.saved.has(x.id));
  listingGrid.innerHTML = saved.length ? saved.map(item => `
    <article class="listing-card"><div class="listing-visual"><span class="listing-badge">Saved listing</span><span class="listing-emoji">${esc(item.icon)}</span><button class="save-button saved" data-save="${item.id}">♥</button></div><div class="listing-info"><div class="listing-meta"><span>${esc(item.category)}</span></div><h3>${esc(item.title)}</h3><p>${esc(item.detail)}</p><div class="listing-bottom"><span class="listing-price ${Number(item.price)===0?"free":""}">${money(item.price)}</span><span class="listing-seller"><strong>${esc(item.seller)}</strong>Saved</span></div></div></article>`).join("") : '<div class="empty-state">Saved items are not in the current results. Reset filters to view all items.</div>';
  listingGrid.querySelectorAll("[data-save]").forEach(btn => btn.addEventListener("click", () => {state.saved.delete(Number(btn.dataset.save)); $("#savedCount").textContent=state.saved.size; toast("Removed from saved listings."); $("#savedButton").click();}));
  $("#resultCount").textContent = `Your saved campus list · ${saved.length} items`;
  $(".listings-section").scrollIntoView({behavior:"smooth"});
});
const modal = $("#postModal");
function openModal(category) {
  modal.classList.add("open"); modal.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden";
  if (category) modal.querySelector('[name="category"]').value = category;
  setTimeout(() => modal.querySelector('[name="title"]').focus(), 100);
}
function closeModal() { modal.classList.remove("open"); modal.setAttribute("aria-hidden","true"); document.body.style.overflow=""; }
["openPost","heroPost","supplierPost","footerPost"].forEach(id => $("#"+id).addEventListener("click", () => openModal(id==="supplierPost"?"Food":null)));
$("#closeModal").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
$("#listingForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = new FormData(e.currentTarget);
  const payload = Object.fromEntries(form.entries());
  payload.price = Number(payload.price) || 0;
  $("#formMessage").textContent = "Adding listing…";
  try {
    const res = await fetch("/api/listings", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not add listing.");
    state.category = "All"; state.query = ""; state.showAll = true; $("#searchInput").value = "";
    document.querySelectorAll(".category-card").forEach(btn => btn.classList.toggle("active", btn.dataset.category === "All"));
    e.currentTarget.reset();
    $("#formMessage").textContent = "";
    closeModal(); await loadListings(); toast("Your sample listing has been added.");
    document.querySelector(".listings-section").scrollIntoView({behavior:"smooth"});
  } catch (err) { $("#formMessage").textContent = err.message || "Server not available. Start the app with npm start."; }
});
loadListings();
