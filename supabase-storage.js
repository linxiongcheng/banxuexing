(function () {
  var cfg = window.__SUPABASE_CONFIG__ || {};
  var baseUrl = (cfg.url || '').replace(/\/+$/, '');
  var anonKey = cfg.anonKey || '';
  var table = cfg.table || 'app_storage';
  var namespace = cfg.namespace || 'banxuexing';
  var requestTimeoutMs = Number(cfg.requestTimeoutMs) > 0 ? Number(cfg.requestTimeoutMs) : 8000;

  var cache = new Map();
  var upsertQueue = new Map();
  var deleteQueue = new Set();
  var flushTimer = null;
  var ready = false;

  function markReady() {
    if (ready) return;
    ready = true;
    window.__SUPABASE_STORAGE_READY__ = true;
    document.dispatchEvent(new CustomEvent('supabase-storage-ready'));
  }

  function hasConfig() {
    return Boolean(baseUrl && anonKey);
  }

  function headers(extra) {
    var h = {
      apikey: anonKey,
      Authorization: 'Bearer ' + anonKey
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        h[k] = extra[k];
      });
    }
    return h;
  }

  async function request(url, options) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = null;
    var opts = options || {};
    if (controller) {
      opts = Object.assign({}, opts, { signal: controller.signal });
      timer = setTimeout(function () {
        controller.abort();
      }, requestTimeoutMs);
    }
    try {
      return await fetch(url, opts);
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw new Error('request timeout after ' + requestTimeoutMs + 'ms');
      }
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function asKey(value) {
    return String(value);
  }

  function allKeys() {
    return Array.from(cache.keys());
  }

  function scheduleFlush() {
    if (!hasConfig() || !ready) return;
    if (flushTimer) return;
    flushTimer = setTimeout(function () {
      flushTimer = null;
      flush().catch(function (err) {
        console.error('[supabase-storage] flush failed', err);
      });
    }, 200);
  }

  async function flush() {
    if (!hasConfig() || !ready) return;

    var upserts = Array.from(upsertQueue.entries()).map(function (entry) {
      return {
        namespace: namespace,
        key: entry[0],
        value: entry[1],
        updated_at: new Date().toISOString()
      };
    });
    var deletes = Array.from(deleteQueue.values());

    upsertQueue.clear();
    deleteQueue.clear();

    if (upserts.length > 0) {
      var upsertRes = await request(baseUrl + '/rest/v1/' + table, {
        method: 'POST',
        headers: headers({
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal'
        }),
        body: JSON.stringify(upserts),
        keepalive: true
      });

      if (!upsertRes.ok) {
        throw new Error('upsert failed: ' + upsertRes.status + ' ' + (await upsertRes.text()));
      }
    }

    for (var i = 0; i < deletes.length; i += 1) {
      var key = deletes[i];
      var q =
        '?namespace=eq.' + encodeURIComponent(namespace) +
        '&key=eq.' + encodeURIComponent(key);
      var delRes = await request(baseUrl + '/rest/v1/' + table + q, {
        method: 'DELETE',
        headers: headers({ Prefer: 'return=minimal' }),
        keepalive: true
      });
      if (!delRes.ok) {
        throw new Error('delete failed: ' + delRes.status + ' ' + (await delRes.text()));
      }
    }
  }

  async function preload() {
    if (!hasConfig()) {
      console.error('[supabase-storage] missing config in supabase-config.js');
      alert('Supabase 未配置：请填写 supabase-config.js 中的 url 和 anonKey。');
      markReady();
      return;
    }

    var query =
      '?namespace=eq.' + encodeURIComponent(namespace) +
      '&select=key,value';

    var res = await request(baseUrl + '/rest/v1/' + table + query, {
      method: 'GET',
      headers: headers(),
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('preload failed: ' + res.status + ' ' + (await res.text()));
    }

    var rows = await res.json();
    rows.forEach(function (row) {
      cache.set(String(row.key), row.value == null ? null : String(row.value));
    });
  }

  function patchStorageApi() {
    if (!window.Storage || !Storage.prototype) {
      return;
    }

    Storage.prototype.getItem = function (key) {
      var k = asKey(key);
      return cache.has(k) ? cache.get(k) : null;
    };

    Storage.prototype.setItem = function (key, value) {
      var k = asKey(key);
      var v = String(value);
      cache.set(k, v);
      deleteQueue.delete(k);
      upsertQueue.set(k, v);
      scheduleFlush();
    };

    Storage.prototype.removeItem = function (key) {
      var k = asKey(key);
      cache.delete(k);
      upsertQueue.delete(k);
      deleteQueue.add(k);
      scheduleFlush();
    };

    Storage.prototype.clear = function () {
      allKeys().forEach(function (k) {
        cache.delete(k);
        upsertQueue.delete(k);
        deleteQueue.add(k);
      });
      scheduleFlush();
    };

    Storage.prototype.key = function (index) {
      var keys = allKeys();
      return Number.isInteger(index) && index >= 0 && index < keys.length ? keys[index] : null;
    };

    try {
      Object.defineProperty(Storage.prototype, 'length', {
        configurable: true,
        enumerable: false,
        get: function () {
          return cache.size;
        }
      });
    } catch (e) {
      // ignore for browsers that lock Storage.length
    }
  }

  patchStorageApi();

  preload()
    .catch(function (err) {
      console.error('[supabase-storage] preload error', err);
      alert('Supabase 读取失败，请检查数据库表和 RLS 配置。');
    })
    .finally(function () {
      markReady();
    });

  window.addEventListener('beforeunload', function () {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (ready && hasConfig()) {
      flush().catch(function () {
        // ignore on unload
      });
    }
  });
})();
