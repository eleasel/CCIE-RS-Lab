// Edit this file for each exam. It is public to students, so never put secrets in it.
window.EXAM_CONFIG = {
  title: "Networking Exam",

  // Short ID with no spaces. Lets you filter the log when several exams share one list.
  examId: "networking-exam-1",

  // Microsoft Forms: open the form > Collect responses > Embed, and copy the src URL from the iframe code.
  // It looks like https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX&embed=true
  // (forms.cloud.microsoft URLs work too).
  formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=REPLACE_ME&embed=true",

  // Shows a session code on screen for students to type into a "Session code" question in the form.
  // With "Record name" on, this links each Forms response to the student's violation log.
  showSessionCode: true,

  // Violations allowed before the exam is locked and the proctor must unlock it.
  maxViolations: 3,

  // SHA-256 hex of the proctor unlock code. Generate with:
  //   echo -n "yourcode" | sha256sum
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
