const Settings = (() => {
  const KEY = "braindeck_settings";

  const DEFAULTS = {
    shuffle: true,
    shortcuts: true,
  };

  function get() {
    try {
      const raw = localStorage.getItem(KEY);
      const stored = raw ? JSON.parse(raw) : {};
      return { ...DEFAULTS, ...stored };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function set(patch) {
    const current = get();
    const next = { ...current, ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  return { get, set, DEFAULTS };
})();