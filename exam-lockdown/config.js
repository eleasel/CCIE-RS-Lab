// Edit this file for your exams. It is public to students, so never put secrets in it.
// After editing, open check.html to check it.
window.EXAM_CONFIG = {
  // ---- Exams ----
  // One entry per exam. Give students the link index.html?exam=<id>, or the plain index.html
  // link to let them pick from a list.
  exams: [
    {
      // Short ID with no spaces. Used in the exam link and in the log.
      id: "networking-exam-1",
      title: "Networking Exam",

      // Microsoft Forms: open the form > Collect responses > Embed, and copy the src URL from the iframe code.
      // It looks like https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX&embed=true
      // (forms.cloud.microsoft URLs work too).
      formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=REPLACE_ME&embed=true",

      // Time limit from when the student clicks Start. Leave out (or 0) for no time limit.
      // Set the same limit in Forms (Settings > Set time duration) so Forms submits on time too.
      durationMinutes: 90,

      // When students may start, in the PC's local time ("YYYY-MM-DDTHH:MM"). Leave out for no limit.
      // Nobody can work past "closes" (plus their extra time). Set the same dates in Forms settings.
      opens: "2026-11-03T09:00",
      closes: "2026-11-03T12:00"

      // Optional per-exam overrides of the shared settings below:
      // maxViolations: 5,
      // unlockCodeSha256: "...",
    }
  ],

  // ---- Extra time and allowances ----
  // Make entries with the Accommodations box in check.html and give each student their code privately.
  // Entries hold only a hash of the student ID and code, so this file doesn't reveal who has an accommodation.
  accommodations: [
    // { key: "<from check.html>", extraMinutes: 30, extraViolations: 2, exams: ["networking-exam-1"] },
  ],

  // ---- Shared settings ----

  // Minutes before the end when students get a warning.
  warnMinutes: [10, 5, 1],

  // Minutes after the time limit to finish submitting before the page closes the exam.
  graceMinutes: 2,

  // A second monitor: "log" records it, "block" stops students starting (and counts a violation if
  // one is plugged in mid-exam), "allow" ignores it. Use "log" if lab PCs have two screens.
  multipleScreens: "log",

  // Shows a session code on screen for students to type into a "Session code" question in the form.
  // With "Record name" on, this links each Forms response to the student's violation log.
  showSessionCode: true,

  // Violations allowed before the exam is locked and the proctor must unlock it.
  maxViolations: 3,

  // SHA-256 hex of the proctor unlock code. Make it with the Unlock code box in check.html
  // (or on Linux/macOS: echo -n "yourcode" | sha256sum).
  // The default below is the hash of "proctor123". CHANGE IT.
  unlockCodeSha256: "fabefa442bd43d86550ea50319847d6c4e371f7aa9448772a19de203180c595a",

  // URL of the "When a Teams webhook request is received" trigger in your Power Automate flow.
  // Leave empty to keep logs only in the student's browser. See docs/LOGGING-SETUP.md.
  logEndpoint: "",

  // "beacon" sends plain text and needs no CORS support from Microsoft (recommended).
  // "cors-json" sends application/json; use it only if check.html shows "beacon" events never arrive.
  logMode: "beacon",

  // Seconds between "still here" reports. Each one costs about 4 Power Platform requests,
  // and a standard M365 licence allows about 6,000 a day. 300 suits a class of up to ~40.
  // Set 0 to turn heartbeats off.
  heartbeatSeconds: 300,

  // Checks every 500 ms whether the exam page lost focus (Alt+Tab, other window, Start menu).
  focusPollMs: 500
};
