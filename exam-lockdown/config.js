// Edit this file for each exam. It is public to students, so never put secrets in it.
window.EXAM_CONFIG = {
  title: "Networking Exam",

  // Microsoft Forms: open the form > Share > Embed, and copy the src URL from the iframe code.
  // It looks like https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX&embed=true
  formUrl: "https://forms.office.com/Pages/ResponsePage.aspx?id=REPLACE_ME&embed=true",

  // Violations allowed before the exam is locked and the proctor must unlock it.
  maxViolations: 3,

  // SHA-256 hex of the proctor unlock code. Generate with:
  //   echo -n "yourcode" | sha256sum
  // The default below is the hash of "proctor123". CHANGE IT.
  unlockCodeSha256: "fabefa442bd43d86550ea50319847d6c4e371f7aa9448772a19de203180c595a",

  // Optional: a Power Automate "When an HTTP request is received" URL.
  // Violations are POSTed as JSON, so you can write them to a SharePoint list or Teams chat.
  logEndpoint: "",

  // Checks every 500 ms whether the exam page lost focus (Alt+Tab, other window, Start menu).
  focusPollMs: 500
};
