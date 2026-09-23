const Study = (() => {
  const params = new URLSearchParams(window.location.search);
  const deckId = params.get("deck");
  const studyArea = document.getElementById("studyArea");
  const btnArea = document.getElementById("btnArea");
  const btnReview = document.getElementById("btnReviewAgain");
  const btnGotIt = document.getElementById("btnGotIt");
  const btnFinish = document.getElementById("btnFinish");
  const finishArea = document.getElementById("finishArea");
  const finishHint = document.getElementById("finishHint");
  const progressGrid = document.getElementById("progressGrid");
  const progressText = document.getElementById("progressText");
  const gotCountEl = document.getElementById("gotCount");
  const againCountEl = document.getElementById("againCount");
  const deckLabel = document.getElementById("deckLabel");
  const shuffleToggle = document.getElementById("shuffleToggle");

  if (!deckId) { window.location.href = "index.html"; return; }

  btnReview.addEventListener("click", () => answer(false));
  btnGotIt.addEventListener("click", () => answer(true));
  btnFinish.addEventListener("click", () => { if (answered.size === totalCards) finish(); });

  let allCards = [];
  let queue = [];
  let pointer = 0;
  let status = {};
  let answered = new Set();
  let totalCards = 0;
  let isFlipped = false;
  let finished = false;
  let deckName = "";
  let sessionCards = [];

  function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  async function init() {
    try {
      const deck = await SupabaseStorage.getDeck(deckId);
      deckName = deck.deck_name;
      deckLabel.textContent = deck.deck_name;

      const cards = await SupabaseStorage.getCards(deckId);
      if (cards.length === 0) {
        studyArea.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-clone"></i>
            <p>Deck นี้ยังไม่มี Card</p>
            <a href="editor.html?deck=${deckId}" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Add Cards</a>
          </div>`;
        finishArea.style.display = "none";
        return;
      }

      allCards = cards.map((c) => ({ ...c, id: c.deck_id + "-" + c.card_no }));
      shuffleToggle.checked = Settings.get().shuffle;
      shuffleToggle.addEventListener("change", () => {
        Settings.set({ shuffle: shuffleToggle.checked });
        beginSession();
      });
      beginSession();
    } catch (err) {
      studyArea.innerHTML = `<div class="empty-state"><p>เกิดข้อผิดพลาด: ${esc(err.message)}</p></div>`;
    }
  }

  function beginSession() {
    queue = allCards.map((c) => ({ ...c }));
    if (shuffleToggle.checked) shuffleArray(queue);
    sessionCards = queue.map((c) => ({ ...c }));
    pointer = 0;
    status = {};
    answered = new Set();
    totalCards = queue.length;
    isFlipped = false;
    finished = false;
    finishArea.style.display = "block";
    btnFinish.disabled = true;
    finishHint.style.display = "block";
    renderCard();
  }

  function renderCard() {
    if (finished) return;
    if (queue.length === 0) { finish(); return; }

    const card = queue[pointer];
    isFlipped = false;
    btnArea.style.display = "none";

    studyArea.innerHTML = `
      <div class="study-controls">
        <button class="nav-btn" id="btnPrev" title="ย้อนกลับ"><i class="fa-solid fa-arrow-left"></i></button>
        <div style="flex:1;max-width:560px;">
          <div class="study-card-container animate-bounceIn" id="cardFlip" onclick="Study.flip()">
            <div class="study-card" id="studyCard">
              <div class="study-card-front">
                <div class="card-label">คำถาม</div>
                <div class="card-text">${esc(card.question_text)}</div>
                <div style="position:absolute;bottom:16px;left:0;right:0;color:var(--text-muted);font-size:0.8rem;">
                  <i class="fa-solid fa-hand-pointer"></i> คลิกการ์ด หรือกด Space เพื่อดูเฉลย
                </div>
              </div>
              <div class="study-card-back">
                <div class="card-label">เฉลย</div>
                <div class="card-text">${esc(card.answer_text)}</div>
                <div style="position:absolute;bottom:16px;left:0;right:0;color:var(--text-muted);font-size:0.8rem;">
                  <i class="fa-solid fa-hand-pointer"></i> คลิกอีกครั้ง เพื่อกลับหน้าคำถาม
                </div>
              </div>
            </div>
          </div>
          <div class="flip-hint">
            การ์ด ${pointer + 1} / ${queue.length}
            <button type="button" class="flip-btn" id="btnFlip" onclick="Study.flip()" title="พลิกกลับไปกลับมา">
              <i class="fa-solid fa-right-left"></i> พลิกการ์ด
            </button>
          </div>
        </div>
        <button class="nav-btn" id="btnNext" title="ข้าม"><i class="fa-solid fa-arrow-right"></i></button>
      </div>`;

    document.getElementById("btnPrev").addEventListener("click", prev);
    document.getElementById("btnNext").addEventListener("click", next);
    updateProgress();
  }

  function flip() {
    if (queue.length === 0 || finished) return;
    isFlipped = !isFlipped;
    const cardEl = document.getElementById("studyCard");
    if (!cardEl) return;
    cardEl.classList.toggle("flipped", isFlipped);
    btnArea.style.display = isFlipped ? "block" : "none";
  }

  function next() {
    if (queue.length < 2) return;
    pointer = (pointer + 1) % queue.length;
    renderCard();
  }

  function prev() {
    if (queue.length < 2) return;
    pointer = (pointer - 1 + queue.length) % queue.length;
    renderCard();
  }

  function answer(gotIt) {
    if (!isFlipped || queue.length === 0 || finished) return;
    const card = queue[pointer];
    status[card.id] = gotIt ? "got" : "again";
    answered.add(card.id);

    if (gotIt) {
      queue.splice(pointer, 1);
      if (queue.length === 0) {
        progressText.textContent = `${totalCards} / ${totalCards}`;
        renderProgressGrid();
        finish();
        return;
      }
      pointer = pointer % queue.length;
    } else {
      pointer = (pointer + 1) % queue.length;
    }
    updateProgress();
    renderCard();
  }

  function updateProgress() {
    const got = Object.values(status).filter((s) => s === "got").length;
    const again = Object.values(status).filter((s) => s === "again").length;
    gotCountEl.textContent = got;
    againCountEl.textContent = again;

    progressText.textContent = `${answered.size} / ${totalCards}`;
    renderProgressGrid();

    const canFinish = answered.size === totalCards;
    btnFinish.disabled = !canFinish;
    finishHint.style.display = canFinish ? "none" : "block";
  }

  function renderProgressGrid() {
    if (!progressGrid) return;
    const currentId = queue.length > 0 && queue[pointer] ? queue[pointer].id : null;
    let gridHtml = "";
    sessionCards.forEach((c, i) => {
      const st = status[c.id];
      let cls = "sg-cell";
      if (st === "got") cls += " got";
      else if (st === "again") cls += " again";
      if (currentId === c.id) cls += " current";
      gridHtml += `<div class="${cls}" title="การ์ดข้อที่ ${i + 1}${st ? (st === "got" ? " — จำได้" : " — ยังจำไม่ได้") : " — ยังไม่ตอบ"}"></div>`;
    });
    progressGrid.innerHTML = gridHtml;
  }

  async function finish() {
    if (finished) return;
    finished = true;

    const cardsById = {};
    allCards.forEach((c) => { cardsById[c.id] = c; });

    const cardResults = Object.keys(status).map((id) => {
      const c = cardsById[id];
      return { question: c.question_text, answer: c.answer_text, status: status[id] };
    });

    const gotCount = cardResults.filter((r) => r.status === "got").length;
    const againCount = cardResults.filter((r) => r.status === "again").length;

    sessionStorage.setItem("braindeck_last_study", JSON.stringify({
      deckId,
      deckName,
      gotCount,
      againCount,
      cards: cardResults,
    }));

    try {
      await SupabaseStorage.createStudySession(deckId, totalCards, againCount, gotCount);
    } catch {}

    renderComplete(gotCount, againCount);
  }

  function renderComplete(gotCount, againCount) {
    studyArea.innerHTML = "";
    btnArea.style.display = "none";
    finishArea.style.display = "none";
    progressText.textContent = `${totalCards} / ${totalCards} — เสร็จ`;
    renderProgressGrid();

    const pct = totalCards > 0 ? Math.round((gotCount / totalCards) * 100) : 0;
    studyArea.innerHTML = `
      <div class="empty-state animate-bounceIn">
        <i class="fa-solid fa-flag-checkered" style="color:var(--accent);font-size:3.4rem;display:block;margin-bottom:14px;"></i>
        <h2 style="margin:0 0 8px;font-size:1.5rem;">เสร็จสิ้นการทบทวน!</h2>
        <p style="color:var(--text-secondary);font-size:1rem;">${getEncouragement(pct)}</p>
        <div class="stats-row" style="max-width:420px;margin:22px auto;">
          <div class="stat-item">
            <div class="stat-value" style="color:var(--success);">${gotCount}</div>
            <div class="stat-label">จำได้</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color:var(--danger);">${againCount}</div>
            <div class="stat-label">ยังจำไม่ได้</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="result.html?deck=${deckId}" class="btn btn-primary btn-lg"><i class="fa-solid fa-list-check"></i> ดูเฉลยทุกข้อ</a>
          <button class="btn btn-outline btn-lg" onclick="Study.restart()"><i class="fa-solid fa-rotate"></i> ทบทวนใหม่</button>
          <a href="index.html" class="btn btn-outline btn-lg"><i class="fa-solid fa-house"></i> Dashboard</a>
        </div>
      </div>`;
  }

  function restart() {
    if (allCards.length === 0) { location.reload(); return; }
    beginSession();
  }

  function getEncouragement(pct) {
    if (pct >= 71) return "สุดโหดดดดดดดดดดดดดดดดดดดดดดดดด";
    if (pct >= 41) return "ดีแล้ว! พยายามอีกนิดนะ";
    return "พยายามเข้า";
  }

  function handleKey(e) {
    if (!Settings.get().shortcuts) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    switch (e.key) {
      case " ":
        e.preventDefault();
        flip();
        break;
      case "ArrowLeft": prev(); break;
      case "ArrowRight": next(); break;
      case "1": if (isFlipped) answer(true); break;
      case "2": if (isFlipped) answer(false); break;
      case "f": case "F":
        if (answered.size === totalCards && !finished) finish();
        break;
    }
  }
  document.addEventListener("keydown", handleKey);

  init();

  return { flip, next, prev, restart };
})();