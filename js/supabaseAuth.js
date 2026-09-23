const SupabaseAuth = (() => {
  async function getCurrentUser() {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;
      const meta = user.user_metadata || {};
      return {
        id: user.id,
        name: meta.name || "",
        username: meta.username || "",
        email: user.email || "",
      };
    } catch {
      return null;
    }
  }

  async function isLoggedIn() {
    const u = await getCurrentUser();
    return !!u;
  }

  async function register(name, username, email, password) {
    if (username.length < 3) return { ok: false, message: "Username ต้องมีอย่างน้อย 3 ตัวอักษร" };
    if (password.length < 6) return { ok: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || "", username } },
    });
    if (error) return { ok: false, message: _friendly(error) };

    // ถ้าได้ session กลับมา (ตอนปิด "Confirm email" ใน Dashboard แล้ว)
    // -> เข้าสู่ระบบทันที ไม่ต้องกดยืนยันอีเมลอีก
    if (data.session) {
      return {
        ok: true,
        user: { id: data.user.id, name, username, email: data.user.email || email },
      };
    }

    // กรณีสมัครผ่านแต่ยังไม่มี session: ลองเข้าสู่ระบบให้เลย (รอ "Confirm email" เป็น off)
    const s2 = await supabase.auth.signInWithPassword({ email, password });
    if (s2.error) return { ok: false, message: _friendly(s2.error) };
    return {
      ok: true,
      user: { id: s2.data.user.id, name, username, email: (s2.data.user || {}).email || email },
    };
  }

  async function login(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) return { ok: false, message: "กรุณากรอก Username/Email และรหัสผ่าน" };

    const identifier = String(usernameOrEmail).trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });
    if (error) return { ok: false, message: _friendly(error) };

    const user = await getCurrentUser();
    return { ok: true, user: user || { id: data.user.id, email: data.user.email || identifier } };
  }

  async function logout() {
    try { await supabase.auth.signOut(); } catch {}
  }

  async function setSession() {
    return null;
  }

  async function requireAuth() {
    const u = await getCurrentUser();
    if (!u) {
      const current = window.location.pathname.split("/").pop() || "index.html";
      const returnTo = encodeURIComponent(current + window.location.search);
      window.location.href = `login.html?return=${returnTo}`;
      return false;
    }
    return true;
  }

  async function initUserBar() {
    const user = await getCurrentUser();
    const bar = document.getElementById("userBar");
    if (!bar) return;

    if (user) {
      const initial = (user.name || user.username || user.email || "?").charAt(0).toUpperCase();
      bar.innerHTML = `
        <div class="user-chip">
          <div class="user-avatar">${initial}</div>
          <span class="user-name">${user.name || user.username || user.email}</span>
          <button class="logout-btn" id="btnLogout" title="ออกจากระบบ">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>`;
      const btn = document.getElementById("btnLogout");
      if (btn) btn.addEventListener("click", async () => { await SupabaseAuth.logout(); window.location.href = "login.html"; });
    } else {
      bar.innerHTML = `
        <a href="login.html" class="btn btn-sm btn-primary"><i class="fa-solid fa-right-to-bracket"></i> Login</a>`;
    }
  }

  function _friendly(error) {
    const msg = (error && error.message) || "เกิดข้อผิดพลาด กรุณาลองใหม่";
    if (/invalid login credentials/i.test(msg)) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    if (/already registered/i.test(msg) || /already been registered/i.test(msg)) return "Email นี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ";
    if (/email not confirmed/i.test(msg) || /email not verified/i.test(msg)) return "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง";
    if (/rate limit/i.test(msg)) return "ลองใหม่ภายหลัง (ระบบจำกัดความถี่)";
    if (/valid email/i.test(msg)) return "รูปแบบอีเมลไม่ถูกต้อง";
    return msg;
  }

  return {
    register,
    login,
    logout,
    setSession,
    getCurrentUser,
    isLoggedIn,
    requireAuth,
    initUserBar,
  };
})();