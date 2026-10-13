const test = require('node:test');
const assert = require('node:assert/strict');
const { parseProfile } = require('../coding-stats.js');
const vm = require('node:vm');
const fs = require('node:fs');

function response(counts) {
  return { status: { success: true }, data: { profileName: 'suraj_mundhada',
    platformProfiles: { platformProfiles: counts.map((count, index) => ({
      platform: `platform-${index}`, totalQuestionStats: { totalQuestionCounts: count, error: null }
    })) } } };
}
test('combines all linked platforms, including zero-count platforms', () => {
  assert.equal(parseProfile(response([226, 36, 8, 18, 0])), 288);
  assert.equal(parseProfile(response([228, 36, 8, 18])), 290);
});
test('rejects incomplete data instead of displaying a misleading partial total', () => {
  for (const count of [undefined, null, '226', -1, 2.5, Infinity]) {
    assert.throws(() => parseProfile(response([count, 36])));
  }
  assert.throws(() => parseProfile(response([])));
  const partial = response([226, 36]);
  partial.data.platformProfiles.platformProfiles[1].totalQuestionStats.error = 'sync failed';
  assert.throws(() => parseProfile(partial));
});
test('rejects the wrong profile, failure responses, and duplicate platform data', () => {
  const wrong = response([226]); wrong.data.profileName = 'someone_else';
  assert.throws(() => parseProfile(wrong));
  const failed = response([226]); failed.status.success = false;
  assert.throws(() => parseProfile(failed));
  const duplicate = response([226, 226]);
  duplicate.data.platformProfiles.platformProfiles[1].platform = 'platform-0';
  assert.throws(() => parseProfile(duplicate));
});

async function runPage(fetch, cache = null) {
  const number = { textContent: '288' };
  let saved = null;
  const context = { document: { hidden: false, addEventListener() {},
    getElementById(id) { return id === 'problems-solved' ? number : null; } },
    localStorage: { getItem() { return JSON.stringify(cache); }, setItem(key, value) { saved = JSON.parse(value); } },
    fetch, AbortController, setTimeout, clearTimeout };
  vm.runInNewContext(fs.readFileSync(require.resolve('../coding-stats.js'), 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));
  return { number, saved };
}
test('failed requests preserve cached counts and do not claim a new sync', async () => {
  const result = await runPage(async () => { throw new Error('Offline'); }, { count: 297, checkedAt: Date.now() - 1000 });
  assert.equal(result.number.textContent, '297');
  assert.equal(result.saved, null);
});
test('successful sync updates the card and persists the latest count', async () => {
  const result = await runPage(async () => ({ ok: true, json: async () => response([230, 36, 8, 18]) }));
  assert.equal(result.number.textContent, '292');
  assert.equal(result.saved.count, 292);
});
test('invalid responses keep the HTML fallback usable', async () => {
  const result = await runPage(async () => ({ ok: true, json: async () => response([null]) }));
  assert.equal(result.number.textContent, '288');
  assert.equal(result.saved, null);
});
