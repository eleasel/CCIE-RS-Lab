// Reads config.js for index.html, check.html and report.html, so the three pages agree on
// exam lookup, schedules and accommodation codes.
(function () {
  "use strict";
  var C = window.EXAM_CONFIG || {};
  var FORM_URL = /^https:\/\/forms\.(office\.com|microsoft\.com|cloud\.microsoft)\//;
  // No look-alikes (0/O, 1/I/L), so codes are easy to read aloud and type.
  var CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

  // "2026-11-03T09:00" is read as the PC's local time. Returns null when missing, NaN date when invalid.
  function parseTime(s) {
    if (s === undefined || s === null || String(s).trim() === "") return null;
    var t = String(s).trim().replace(/^(\d{4}-\d{2}-\d{2}) (\d)/, "$1T$2");
    // A bare date would be read as midnight UTC; make it local midnight like the rest.
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) t += "T00:00";
    return new Date(t);
  }
  function validTime(d) { return d === null || !isNaN(d.getTime()); }

  function normalise(e, i) {
    e = e || {}; // keep the position: check.html pairs these with config.exams by index
    return {
      id: String(e.id || ("exam-" + (i + 1))).trim(),
      title: String(e.title || "Exam"),
      formUrl: String(e.formUrl || ""),
      durationMinutes: Number(e.durationMinutes) > 0 ? Number(e.durationMinutes) : 0,
      opens: parseTime(e.opens),
      closes: parseTime(e.closes),
      maxViolations: Number(e.maxViolations) > 0 ? Number(e.maxViolations) : (Number(C.maxViolations) > 0 ? Number(C.maxViolations) : 3),
      unlockCodeSha256: (String(e.unlockCodeSha256 || "").trim() || String(C.unlockCodeSha256 || "").trim()).toLowerCase()
    };
  }

  // Older config.js files had one exam at the top level (examId, title, formUrl).
  var raw = Array.isArray(C.exams) ? C.exams : (C.formUrl ? [{ id: C.examId, title: C.title, formUrl: C.formUrl }] : []);
  var exams = raw.map(normalise);

  function get(id) {
    for (var i = 0; i < exams.length; i++) if (exams[i].id === id) return exams[i];
    return null;
  }

  // state: "upcoming" (before opens), "open", or "closed" (after closes).
  function status(exam, now) {
    if (exam.opens && now < exam.opens.getTime()) return "upcoming";
    if (exam.closes && now >= exam.closes.getTime()) return "closed";
    return "open";
  }

  function normId(s) { return String(s || "").replace(/\s+/g, "").toUpperCase(); }
  function normCode(s) { return String(s || "").replace(/[\s-]+/g, "").toUpperCase(); }

  async function sha256(text) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  // The key binds the code to one student ID, so a shared code is useless to anyone else.
  function accommodationKey(studentId, code) { return sha256(normId(studentId) + "|" + normCode(code)); }

  function findAccommodation(exam, key) {
    var list = Array.isArray(C.accommodations) ? C.accommodations : [];
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (!a || String(a.key || "").trim().toLowerCase() !== key) continue;
      // A single id written without brackets must not widen the entry to every exam.
      var only = Array.isArray(a.exams) ? a.exams : (a.exams ? [String(a.exams)] : []);
      if (only.length && only.indexOf(exam.id) < 0) continue;
      return { extraMinutes: Math.max(0, Number(a.extraMinutes) || 0), extraViolations: Math.max(0, Number(a.extraViolations) || 0) };
    }
    return null;
  }

  // Rejection sampling keeps every character equally likely (256 isn't a multiple of 31).
  function randomCode(len) {
    var out = "", limit = 256 - (256 % CODE_ALPHABET.length);
    while (out.length < len) {
      crypto.getRandomValues(new Uint8Array(len * 2)).forEach(function (n) {
        if (n < limit && out.length < len) out += CODE_ALPHABET[n % CODE_ALPHABET.length];
      });
    }
    return out;
  }

  window.ExamConfig = {
    config: C, loaded: !!window.EXAM_CONFIG, exams: exams, get: get, status: status, validTime: validTime,
    formUrlOk: function (u) { return FORM_URL.test(u) && !/REPLACE_ME/.test(u); },
    hasAccommodations: function () { return Array.isArray(C.accommodations) && C.accommodations.length > 0; },
    normId: normId, normCode: normCode, sha256: sha256,
    accommodationKey: accommodationKey, findAccommodation: findAccommodation,
    randomCode: randomCode, CODE_ALPHABET: CODE_ALPHABET
  };
})();
