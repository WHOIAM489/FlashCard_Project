const Editor = (() => {
  const params = new URLSearchParams(window.location.search);
  const deckId = params.get("deck");
  const container = document.getElementById("cardContainer");
  const modalRoot = document.getElementById("modalRoot");
  const titleEl = document.getElementById("deckTitle");
  const infoEl = document.getElementById("deckInfo");
  const btnAddCard = document.getElementById("btnAddCard");
  const btnRename = document.getElementById("btnEditDeckName");
  const btnStudyTop = document.getElementById("btnStudyTop");

  if (!deckId) { window.location.href = "index.html"; return; }

  let owned = null;

  btnStudyTop.href = `study.html?deck=${deckId}`;
  btnAddCard.addEventListener("click", () => showCardModal());
  btnRename.addEventListener("click", showRenameModal);

  function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  async function init() {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      const uid = user ? user.id : null;
      const deck = await SupabaseStorage.getDeck(deckId);
      owned = !!uid && deck.user_id === uid;
      titleEl.textContent = deck.deck_name;
      applyOwnershipUI();
      const cards = await SupabaseStorage.getCards(deckId);
      infoEl.textContent = `${cards.length} card${cards.length !== 1 ? "s" : ""}`;
      renderCards(cards);
    } catch (err) {
      titleEl.textContent = "Error";
      container.innerHTML = `<div class="empty-state"><p>ไม่พบ Deck นี้: ${esc(err.message)}</p></div>`;
    }
  }

  function applyOwnershipUI() {
    const banner = document.getElementById("readonlyBanner");
    if (owned) {
      if (banner) banner.remove();
      btnAddCard.style.display = "";
      btnRename.style.display = "";
      return;
    }
    btnAddCard.style.display = "none";
    btnRename.style.display = "none";
    if (banner) return;
    const el = document.createElement("div");
    el.id = "readonlyBanner";
    el.className = "readonly-banner";
    el.innerHTML = `
      <span><i class="fa-solid fa-lock"></i> เด็คส่วนกลาง — อ่านได้อย่างเดียว ถ้าต้องการแก้ไขให้คัดลอกเป็นของตัวเองก่อน</span>
      <button class="btn btn-sm btn-primary" id="btnDuplicateDeck"><i class="fa-solid fa-copy"></i> คัดลอกเป็นของฉัน</button>`;
    infoEl.insertAdjacentElement("afterend", el);
    document.getElementById("btnDuplicateDeck").addEventListener("click", duplicateDeck);
  }

  async function duplicateDeck() {
    try {
      const newId = await SupabaseStorage.duplicateDeck(deckId, null);
      if (newId) window.location.href = `editor.html?deck=${newId}`;
    } catch (err) { alert("คัดลอกไม่สำเร็จ: " + err.message); }
  }

  function renderCards(cards) {
    if (cards.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-clone"></i>
          <p>ยังไม่มี Card — เริ่มเพิ่มคำถาม-คำตอบแรก!</p>
          <button class="btn btn-primary" onclick="Editor.showCardModal()"><i class="fa-solid fa-plus"></i> Add Card</button>
        </div>`;
      return;
    }
    let html = '<div class="card-list">';
    cards.forEach((c) => {
      const actions = owned
        ? `<div class="card-actions">
            <button class="btn btn-sm btn-outline" onclick="Editor.showCardModal(${c.card_no})"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-danger" onclick="Editor.deleteCard(${c.card_no})"><i class="fa-solid fa-trash"></i></button>
          </div>`
        : "";
      html += `
        <div class="card-item animate-fadeIn">
          <span class="card-q"><strong>Q${c.card_no}.</strong> ${esc(c.question_text)}</span>
          <span class="card-a"><i class="fa-solid fa-arrow-right" style="margin-right:4px;color:var(--accent);"></i>${esc(c.answer_text).substring(0, 80)}${c.answer_text.length > 80 ? "..." : ""}</span>
          ${actions}
        </div>`;
    });
    html += "</div>";
    container.innerHTML = html;
  }

  function showCardModal(cardNo) {
    if (owned === false) { alert("เด็คนี้เป็นเด็คส่วนกลาง อ่านได้อย่างเดียว — กรุณาคัดลอกเป็นของตัวเองก่อนแก้ไข"); return; }
    const isEdit = cardNo !== undefined;
    modalRoot.innerHTML = `
      <div class="modal-overlay" onclick="Editor.closeModal(event)">
        <div class="modal animate-slideUp" onclick="event.stopPropagation()">
          <h2><i class="fa-solid fa-clone" style="color:var(--accent);margin-right:8px;"></i>${isEdit ? "Edit" : "Add"} Card</h2>
          <div class="form-group">
            <label>Question</label>
            <textarea class="form-input" id="inputQuestion" rows="3" placeholder="ใส่คำถาม...">${isEdit ? "" : ""}</textarea>
          </div>
          <div class="form-group">
            <label>Answer</label>
            <textarea class="form-input" id="inputAnswer" rows="3" placeholder="ใส่คำตอบ...">${isEdit ? "" : ""}</textarea>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" onclick="Editor.closeModal()">Cancel</button>
            <button class="btn btn-primary" id="btnSaveCard"><i class="fa-solid fa-check"></i> ${isEdit ? "Update" : "Add"}</button>
          </div>
        </div>
      </div>`;

    if (isEdit) {
      SupabaseStorage.getCards(deckId).then((cards) => {
        const c = cards.find((x) => x.card_no === cardNo);
        if (c) {
          document.getElementById("inputQuestion").value = c.question_text;
          document.getElementById("inputAnswer").value = c.answer_text;
        }
      });
    }

    document.getElementById("inputQuestion").focus();
    document.getElementById("btnSaveCard").addEventListener("click", () => saveCard(cardNo));
  }

  async function saveCard(cardNo) {
    if (owned === false) { alert("เด็คนี้เป็นเด็คส่วนกลาง อ่านได้อย่างเดียว — กรุณาคัดลอกเป็นของตัวเองก่อนแก้ไข"); return; }
    const q = document.getElementById("inputQuestion").value.trim();
    const a = document.getElementById("inputAnswer").value.trim();
    if (!q || !a) { alert("กรุณากรอกคำถามและคำตอบ"); return; }
    try {
      if (cardNo !== undefined) {
        await SupabaseStorage.updateCard(deckId, cardNo, q, a);
      } else {
        await SupabaseStorage.createCard(deckId, q, a);
      }
      closeModal();
      init();
    } catch (err) { alert("บันทึกไม่สำเร็จ: " + err.message); }
  }

  async function deleteCard(cardNo) {
    if (owned === false) { alert("เด็คนี้เป็นเด็คส่วนกลาง อ่านได้อย่างเดียว — กรุณาคัดลอกเป็นของตัวเองก่อนแก้ไข"); return; }
    if (!confirm(`ต้องการลบการ์ดข้อ ${cardNo} ออกจริงหรือไม่?`)) return;
    try {
      await SupabaseStorage.deleteCard(deckId, cardNo);
      init();
    } catch (err) { alert("ลบไม่สำเร็จ: " + err.message); }
  }

  function showRenameModal() {
    if (owned === false) { alert("เด็คนี้เป็นเด็คส่วนกลาง อ่านได้อย่างเดียว — กรุณาคัดลอกเป็นของตัวเองก่อนแก้ไข"); return; }
    modalRoot.innerHTML = `
      <div class="modal-overlay" onclick="Editor.closeModal(event)">
        <div class="modal animate-slideUp" onclick="event.stopPropagation()">
          <h2><i class="fa-solid fa-pen" style="color:var(--accent);margin-right:8px;"></i> Rename Deck</h2>
          <div class="form-group">
            <label>Deck Name</label>
            <input class="form-input" id="inputRename" maxlength="100" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" onclick="Editor.closeModal()">Cancel</button>
            <button class="btn btn-primary" id="btnSaveRename"><i class="fa-solid fa-check"></i> Save</button>
          </div>
        </div>
      </div>`;
    const inp = document.getElementById("inputRename");
    inp.value = titleEl.textContent;
    inp.focus();
    inp.select();
    document.getElementById("btnSaveRename").addEventListener("click", saveRename);
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") saveRename(); });
  }

  async function saveRename() {
    const name = document.getElementById("inputRename").value.trim();
    if (!name) { alert("กรุณาใส่ชื่อ Deck"); return; }
    try {
      await SupabaseStorage.updateDeck(deckId, name);
      closeModal();
      init();
    } catch (err) { alert("แก้ไขไม่สำเร็จ: " + err.message); }
  }

  function closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    modalRoot.innerHTML = "";
  }

  init();

  return { showCardModal, deleteCard, closeModal };
})();
