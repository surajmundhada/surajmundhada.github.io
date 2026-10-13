(() => {
  const profile = 'suraj_mundhada';
  const cacheKey = 'suraj-codolio-stats-v1';
  const refreshAfter = 30 * 60 * 1000;

  function validCount(value) {
    return Number.isSafeInteger(value) && value >= 0 && value <= 1000000;
  }
  function parseProfile(body) {
    if (body?.status?.success !== true || body?.data?.profileName !== profile) {
      throw new Error('Unexpected Codolio profile response');
    }
    const platforms = body.data.platformProfiles?.platformProfiles;
    if (!Array.isArray(platforms) || platforms.length === 0) {
      throw new Error('Missing platform statistics');
    }
    const names = new Set();
    const total = platforms.reduce((sum, platform) => {
      const stats = platform.totalQuestionStats;
      if (typeof platform.platform !== 'string' || names.has(platform.platform) ||
          !stats || stats.error || !validCount(stats.totalQuestionCounts)) {
        throw new Error('Incomplete platform statistics');
      }
      names.add(platform.platform);
      return sum + stats.totalQuestionCounts;
    }, 0);
    if (!validCount(total)) throw new Error('Invalid total');
    return total;
  }
  // Expose only the data parser to the local Node tests.
  if (typeof module !== 'undefined' && module.exports) module.exports = { parseProfile };
  if (typeof document === 'undefined') return;

  const number = document.getElementById('problems-solved');
  if (!number) return;
  let lastAttempt = 0, pending = false;
  function show(count) {
    number.textContent = String(count);
  }
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (validCount(cached?.count) && Number.isFinite(cached.checkedAt) &&
        cached.checkedAt > 0 && cached.checkedAt <= Date.now()) show(cached.count);
  } catch { /* The HTML count remains usable when storage is unavailable. */ }

  async function refresh() {
    if (pending || document.hidden) return;
    pending = true;
    lastAttempt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`https://api.codolio.com/profile?userKey=${encodeURIComponent(profile)}`, {
        signal: controller.signal, credentials: 'omit', cache: 'no-store'
      });
      if (!response.ok) throw new Error('Codolio unavailable');
      const count = parseProfile(await response.json());
      const checkedAt = Date.now();
      show(count);
      try { localStorage.setItem(cacheKey, JSON.stringify({ count, checkedAt })); } catch {}
    } catch { /* Preserve the last successful count; never replace it with zero. */ }
    finally { clearTimeout(timeout); pending = false; }
  }
  refresh();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastAttempt >= refreshAfter) refresh();
  });
})();
