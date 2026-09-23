const MockAuth = (() => {
  const USERS_KEY = "braindeck_users";
  const SESSION_KEY = "braindeck_session";

  function _getUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function _saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function _hash(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return "h" + Math.abs(hash).toString(36);
  }

  function register(name, username, email, password) {
    const users = _getUsers();

    if (username.length < 3) return { ok: false, message: "Username ต้องมีอย่างน้อย 3 ตัวอักษร" };
    if (password.length < 6) return { ok: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase()))
      return { ok: false, message: "Username นี้ถูกใช้งานแล้ว" };
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
      return { ok: false, message: "Email นี้ถูกใช้งานแล้ว" };

    const user = {
      id: "U" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      username,
      email,
      passwordHash: _hash(password),
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    _saveUsers(users);
    return { ok: true, user };
  }

  function login(usernameOrEmail, password) {
    const users = _getUsers();
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
        u.email.toLowerCase() === usernameOrEmail.toLowerCase()
    );
    if (!user) return { ok: false, message: "ไม่พบผู้ใช้งานนี้" };
    if (user.passwordHash !== _hash(password)) return { ok: false, message: "รหัสผ่านไม่ถูกต้อง" };
    setSession(user);
    return { ok: true, user };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function setSession(user) {
    const session = {
      userId: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  function requireAuth() {
    if (!isLoggedIn()) {
      const current = window.location.pathname.split("/").pop() || "index.html";
      const returnTo = encodeURIComponent(current + window.location.search);
      window.location.href = `login.html?return=${returnTo}`;
      return false;
    }
    return true;
  }

  function initUserBar() {
    const user = getCurrentUser();
    const bar = document.getElementById("userBar");
    if (!bar) return;

    if (user) {
      const initial = user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase();
      bar.innerHTML = `
        <div class="user-chip">
          <div class="user-avatar">${initial}</div>
          <span class="user-name">${user.name || user.username}</span>
          <button class="logout-btn" id="btnLogout" title="ออกจากระบบ">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>`;
      const btn = document.getElementById("btnLogout");
      if (btn) btn.addEventListener("click", () => { MockAuth.logout(); window.location.href = "login.html"; });
    } else {
      bar.innerHTML = `
        <a href="login.html" class="btn btn-sm btn-primary"><i class="fa-solid fa-right-to-bracket"></i> Login</a>`;
    }
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