// Sends exam events to the Power Automate "When a Teams webhook request is received" flow.
// See docs/LOGGING-SETUP.md for the flow and why the body is sent as plain text.
(function () {
  "use strict";
  var QUEUE_KEY = "examLogQueue", MAX_QUEUE = 200, MAX_TRIES = 5;

  function readQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch (e) { return []; }
  }
  function writeQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE))); } catch (e) {}
  }
  function enqueue(item) {
    if (item.tries >= MAX_TRIES) return;
    var q = readQueue(); q.push(item); writeQueue(q);
  }

  // Resolves once the request has left the browser (cors-json mode: once it got a 2xx).
  // Rejects only when the request could not be sent at all.
  function transmit(url, mode, entry) {
    var body = JSON.stringify(entry);
    if (mode === "cors-json") {
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return "HTTP " + r.status; });
    }
    // A string body is sent as text/plain, a "simple" request with no CORS preflight.
    // The response is unreadable, which is fine: the flow's run history is the receipt.
    if (navigator.sendBeacon && navigator.sendBeacon(url, body)) return Promise.resolve("queued by browser");
    // sendBeacon refuses when the browser's 64 KiB keepalive quota is full.
    // A fetch without keepalive does not share that quota.
    return fetch(url, { method: "POST", mode: "no-cors", body: body }).then(function () { return "sent"; });
  }

  // Never throws: a bad URL or a browser error must not stop the page's lock logic.
  function send(url, mode, entry, tries) {
    var item = { url: url, mode: mode, entry: entry, tries: tries || 0 };
    if (!url) return Promise.resolve("no endpoint");
    if (navigator.onLine === false) { enqueue(item); return Promise.resolve("offline, queued"); }
    return Promise.resolve().then(function () { return transmit(url, mode, entry); }).catch(function (err) {
      item.tries++; enqueue(item);
      return "failed, queued (" + err.message + ")";
    });
  }

  function flush(url, mode) {
    if (!url || navigator.onLine === false) return;
    var q = readQueue();
    if (!q.length) return;
    writeQueue([]);
    // Each event goes to the flow it was meant for, even if another exam's page flushes the queue.
    q.forEach(function (item) { send(item.url || url, item.mode || mode, item.entry, item.tries); });
  }

  window.ExamTransport = { send: send, transmit: transmit, flush: flush, pending: function () { return readQueue().length; } };
})();
