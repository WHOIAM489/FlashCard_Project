const SettingsPage = (() => {
  async function init() {
    await SupabaseAuth.requireAuth();
    await SupabaseAuth.initUserBar();

    const opts = Settings.get();
    document.getElementById("optShuffle").checked = opts.shuffle;
    document.getElementById("optShortcuts").checked = opts.shortcuts;

    document.getElementById("optShuffle").addEventListener("change", (e) => {
      Settings.set({ shuffle: e.target.checked });
      showToast("บันทึกการตั้งค่าการสุ่มการ์ดแล้ว");
    });

    document.getElementById("optShortcuts").addEventListener("change", (e) => {
      Settings.set({ shortcuts: e.target.checked });
      showToast("บันทึกการตั้งค่าคีย์ลัดแล้ว");
    });

    document.getElementById("btnExport").addEventListener("click", exportData);
    document.getElementById("btnImport").addEventListener("click", importOldData);

    document.getElementById("btnClearAll").addEventListener("click", async () => {
      if (!confirm("ออกจากระบบและล้างเซสชันของเครื่องนี้? ข้อมูลใน Supabase จะยังอยู่")) return;
      await SupabaseAuth.logout();
      localStorage.removeItem("braindeck_settings");
      window.location.href = "login.html";
    });

    document.getElementById("btnLogout").addEventListener("click", async () => {
      await SupabaseAuth.logout();
      window.location.href = "login.html";
    });
  }

  async function exportData() {
    try {
      const backup = {
        exportedAt: new Date().toISOString(),
        source: "BrainDeck",
        localStorage: {},
      };
      ["braindeck_mock", "braindeck_users", "braindeck_session", "braindeck_settings"].forEach((k) => {
        backup.localStorage[k] = localStorage.getItem(k);
      });

      const randomDecks = await SupabaseStorage.getAllDecks();
      backup.supabaseDecks = randomDecks;

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 13);
      a.href = URL.createObjectURL(blob);
      a.download = "braindeck-backup-" + stamp + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("ส่งออกข้อมูลสำรองแล้ว");
    } catch (err) {
      showToast("ส่งออกไม่สำเร็จ: " + err.message);
    }
  }

  async function importOldData() {
    let old;
    try {
      old = JSON.parse(localStorage.getItem("braindeck_mock") || "null");
    } catch {
      old = null;
    }
    if (!old || !Array.isArray(old.decks) || old.decks.length === 0) {
      showToast("ไม่พบข้อมูลเก่าในเครื่อง (braindeck_mock)");
      return;
    }

    if (!confirm(`พบข้อมูลเก่า ${old.decks.length} เด็ค จะนำเข้าเข้ายังบัญชี Supabase นี้ (ข้าม deck ที่มีอยู่แล้ว)`)) return;

    try {
      const existing = await SupabaseStorage.getAllDecks();
      const existingIds = new Set((existing || []).map((d) => d.deck_id));

      let imported = 0;
      for (const deck of old.decks) {
        if (existingIds.has(deck.deck_id)) continue;
        const newId = await SupabaseStorage.createDeck(deck.deck_name, deck.tags || []);
        existingIds.add(newId);
        const cards = deck.cards || [];
        for (const c of cards) {
          await SupabaseStorage.createCard(newId, c.question_text, c.answer_text);
        }
        const sessions = (old.sessions || []).filter((s) => s.deck_id === deck.deck_id);
        for (const s of sessions) {
          try {
            await SupabaseStorage.createStudySession(newId, s.total_cards, s.remaining_cards, s.cards_to_review);
          } catch {}
        }
        imported++;
      }
      showToast(imported > 0 ? `นำเข้าสำเร็จ ${imported} เด็ค` : "ไม่พบ deck ใหม่ (มีอยู่แล้วทั้งหมด)");
    } catch (err) {
      showToast("นำเข้าไม่สำเร็จ: " + err.message);
    }
  }

  function showToast(msg) {
    const toast = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = msg;
    const icon = toast.querySelector("i");
    if (icon) icon.className = "fa-solid fa-circle-check";
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  return { init, showToast, exportData, importOldData };
})();

document.addEventListener("DOMContentLoaded", SettingsPage.init);