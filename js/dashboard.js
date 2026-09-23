const Dashboard = (() => {
  const container = document.getElementById("deckContainer");
  const modalRoot = document.getElementById("modalRoot");
  const btnCreate = document.getElementById("btnCreateDeck");

  btnCreate.addEventListener("click", showCreateModal);

  async function init() {
    const user = await SupabaseAuth.getCurrentUser();
    const subtitle = document.querySelector(".page-subtitle");
    if (subtitle) {
      const name = user ? (user.name || user.username) : "ผู้ใช้";
      subtitle.innerHTML = `สวัสดี <strong style="color:var(--accent)">${name}</strong> — จัดการกองการ์ดของคุณได้ที่นี่`;
    }
    try {
      const decks = await SupabaseStorage.getAllDecks();
      renderDecks(decks);
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>ไม่สามารถเชื่อมต่อ Supabase ได้ กรุณาตรวจสอบ URL และ Key</p><p style="font-size:0.85rem;color:var(--danger)">${err.message}</p></div>`;
    }
  }

  function renderDecks(decks) {
    if (decks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-layer-group"></i>
          <p>ยังไม่มี Deck — เริ่มสร้างกองการ์ดแรกของคุณ!</p>
          <button class="btn btn-primary" onclick="Dashboard.showCreateModal()">
            <i class="fa-solid fa-plus"></i> Create New Deck
          </button>
        </div>`;
      return;
    }

    let html = '<div class="deck-grid">';
    decks.forEach((d) => {
      const date = new Date(d.created_date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
      html += `
        <div class="deck-card animate-fadeIn">
          <div class="deck-name">${esc(d.deck_name)}</div>
          <div class="deck-meta">
            <span><i class="fa-regular fa-calendar"></i> ${date}</span>
          </div>
          <div class="deck-tags" id="tags-${d.deck_id}"></div>
          <div class="deck-actions">
            <a href="editor.html?deck=${d.deck_id}" class="btn btn-sm btn-outline" title="Edit Deck">
              <i class="fa-solid fa-pen"></i> Edit
            </a>
            <a href="study.html?deck=${d.deck_id}" class="btn btn-sm btn-primary" title="Start Study">
              <i class="fa-solid fa-play"></i> Study
            </a>
            <button class="btn btn-sm btn-danger" onclick="Dashboard.deleteDeck('${d.deck_id}', '${esc(d.deck_name)}')" title="Delete Deck">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>`;
    });
    html += "</div>";
    container.innerHTML = html;

    decks.forEach(async (d) => {
      try {
        const tags = await SupabaseStorage.getDeckTags(d.deck_id);
        const tagEl = document.getElementById(`tags-${d.deck_id}`);
        if (tagEl && tags.length > 0) {
          tagEl.innerHTML = tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("");
        }
      } catch {}
    });
  }

  function showCreateModal() {
    modalRoot.innerHTML = `
      <div class="modal-overlay" onclick="Dashboard.closeModal(event)">
        <div class="modal animate-slideUp" onclick="event.stopPropagation()">
          <h2><i class="fa-solid fa-plus" style="color:var(--accent);margin-right:8px;"></i> Create New Deck</h2>
          <div class="form-group">
            <label>Deck Name</label>
            <input class="form-input" id="inputDeckName" placeholder="เช่น ประวัติศาสตร์สงครามเย็น" maxlength="100" />
          </div>
          <div class="form-group">
            <label>Tags (คั่นด้วย comma)</label>
            <input class="form-input" id="inputTags" placeholder="เช่น History, Cold War" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" onclick="Dashboard.closeModal()">Cancel</button>
            <button class="btn btn-primary" id="btnSaveDeck"><i class="fa-solid fa-check"></i> Create</button>
          </div>
        </div>
      </div>`;
    document.getElementById("inputDeckName").focus();
    document.getElementById("btnSaveDeck").addEventListener("click", saveDeck);
    document.getElementById("inputDeckName").addEventListener("keydown", (e) => { if (e.key === "Enter") saveDeck(); });
  }

  async function saveDeck() {
    const name = document.getElementById("inputDeckName").value.trim();
    const tagsRaw = document.getElementById("inputTags").value.trim();
    if (!name) { alert("กรุณาใส่ชื่อ Deck"); return; }
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
    try {
      await SupabaseStorage.createDeck(name, tags);
      closeModal();
      init();
    } catch (err) { alert("สร้าง Deck ไม่สำเร็จ: " + err.message); }
  }

  async function deleteDeck(deckId, deckName) {
    if (!confirm(`ต้องการลบ "${deckName}" ออกจริงหรือไม่?`)) return;
    try {
      await SupabaseStorage.deleteDeck(deckId);
      init();
    } catch (err) { alert("ลบไม่สำเร็จ: " + err.message); }
  }

  function closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    modalRoot.innerHTML = "";
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  init();

  return { showCreateModal, deleteDeck, closeModal };
})();
