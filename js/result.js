const Result = (() => {
  const params = new URLSearchParams(window.location.search);
  const deckId = params.get("deck");
  const area = document.getElementById("resultArea");

  function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  function getStudyData() {
    try {
      const raw = sessionStorage.getItem("braindeck_last_study");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function init() {
    const data = getStudyData();

    if (!data) {
      area.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-folder-open"></i>
          <p>ยังไม่มีผลการทบทวนล่าสุด<br/><span style="font-size:0.85rem;">ไปที่หน้า Study แล้วทบทวนให้เสร็จก่อนนะ</span></p>
          <a href="index.html" class="btn btn-primary"><i class="fa-solid fa-house"></i> Dashboard</a>
        </div>`;
      return;
    }

    const cards = data.cards || [];
    const got = data.gotCount ?? cards.filter((c) => c.status === "got").length;
    const again = data.againCount ?? cards.filter((c) => c.status === "again").length;
    const total = got + again;
    const pct = total > 0 ? Math.round((got / total) * 100) : 0;

    sessionStorage.removeItem("braindeck_last_study");

    const listHtml = cards
      .map((c, i) => {
        const isGot = c.status === "got";
        return `
          <div class="result-card ${isGot ? "got" : "again"} animate-fadeIn">
            <div class="rc-head">
              <span class="rc-q">${i + 1}. ${esc(c.question)}</span>
              <span class="rc-badge ${isGot ? "got" : "again"}">
                <i class="fa-solid ${isGot ? "fa-circle-check" : "fa-circle-xmark"}"></i>
                ${isGot ? "จำได้" : "ยังจำไม่ได้"}
              </span>
            </div>
            <div class="rc-a">
              <i class="fa-solid fa-lightbulb" style="color:var(--warning);margin-right:6px;"></i>
              <strong style="color:var(--text-secondary);">เฉลย:</strong> ${esc(c.answer)}
            </div>
          </div>`;
      })
      .join("");

    area.innerHTML = `
      <div class="animate-bounceIn" style="text-align:center;max-width:720px;margin:0 auto;">
        <div style="font-size:3.4rem;margin-bottom:6px;">${pct >= 71 ? "🏆" : pct >= 41 ? "👍" : "📚"}</div>
        <h1 class="page-title" style="margin-bottom:4px;">สรุปผลการทบทวน</h1>
        <p style="color:var(--text-secondary);">${esc(data.deckName || "Deck")}</p>

        <div class="stats-row" style="margin:22px 0;">
          <div class="stat-item">
            <div class="stat-value">${total}</div>
            <div class="stat-label">รวมทั้งหมด</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color:var(--success);">${got}</div>
            <div class="stat-label">จำได้</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color:var(--danger);">${again}</div>
            <div class="stat-label">ยังจำไม่ได้</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color:var(--accent);">${pct}%</div>
            <div class="stat-label">ความแม่นยำ</div>
          </div>
        </div>

        <div class="progress-bar-container" style="max-width:400px;margin:0 auto 26px;">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>

        <p id="encourageMsg" style="color:var(--text-secondary);margin-bottom:26px;font-size:1.1rem;font-weight:500;">${getMessage(pct)}</p>

        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:40px;">
          ${deckId ? `<button class="btn btn-primary btn-lg" onclick="Result.studyAgain()"><i class="fa-solid fa-rotate"></i> ทบทวนเฉพาะที่ยังจำไม่ได้</button>` : ""}
          <a href="index.html" class="btn btn-outline btn-lg"><i class="fa-solid fa-house"></i> Dashboard</a>
        </div>
      </div>

      <div style="max-width:720px;margin:0 auto;">
        <h2 style="font-size:1.15rem;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
          <i class="fa-solid fa-list-check" style="color:var(--accent);"></i> เฉลยทั้งหมด
        </h2>
        ${listHtml}
      </div>`;
  }

  function studyAgain() {
    if (!deckId) { window.location.href = "index.html"; return; }
    window.location.href = `study.html?deck=${deckId}`;
  }

  function getMessage(pct) {
    if (pct >= 71) return "สุดโหดดดดดดดดดดดดดดดดดดดดดดดดด";
    if (pct >= 41) return "ดีแล้ว! พยายามอีกนิดนะ";
    return "พยายามเข้า";
  }

  init();

  return { studyAgain, init };
})();