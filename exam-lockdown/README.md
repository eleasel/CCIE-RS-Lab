# Exam Lockdown

A static web page that wraps a Microsoft Forms exam in a monitored full-screen session. Violations are logged to a SharePoint list and lockouts are posted to Teams, all on a standard Microsoft 365 licence.

## What it does
- Requires full screen to start, and records the student's name and ID.
- Flags leaving full screen, switching tabs or windows, losing focus, and reloading or closing the page.
- Blocks copy, cut, paste, right-click, print, F12, Ctrl+Shift+I/J and view-source on the exam page around the form, and reports the count. These blocks don't reach inside the embedded Microsoft Forms frame, which a web page can't control, so students can still copy from and paste into the form itself.
- Locks the exam after `maxViolations`. Each absence counts once, plus once more for every 30 seconds away. The proctor enters an unlock code to resume. Reloading the page doesn't clear violations or a lockout.
- Shows a **session code** for the student to type into the form, which links each Forms response to its violation log.
- Sends every event to a Power Automate flow that writes it to a SharePoint list (the proctor view) and posts a Teams card on lockouts. Sends a heartbeat every 5 minutes, so proctors can see who has dropped out.
- A **Finish exam** button ends the session cleanly after the student submits the form.

## Files
| File | Purpose |
|---|---|
| `index.html` | The exam page students open |
| `config.js` | Per-exam settings: form URL, unlock code, log URL |
| `transport.js` | Sends events to the flow, and queues them while offline |
| `check.html` | Instructor setup check: validates config, makes and tests the unlock-code hash, and sends test events |
| `docs/LOGGING-SETUP.md` | Step-by-step SharePoint list and Power Automate flow |
| `sharepoint/` | Severity colour formatting, and an optional PnP script that creates the list |
| `flow/` | The Teams alert card and an example event payload |

## Setup
1. **Form.** In Microsoft Forms, set the exam to *Only people in my organization can respond* with **Record name** and **One response per person** on. Add a required short-answer question, **Session code**. Under Collect responses > Embed, copy the `src` URL into `formUrl` in `config.js`.
2. **Unlock code.** Open `check.html`, type your code in the **Unlock code** box, and paste the hash it shows into `unlockCodeSha256`. On Linux or macOS, `echo -n "yourcode" | sha256sum` gives the same hash. The default code is `proctor123`, so change it. The hash is visible to students, so use a long random code.
3. **Logging.** Follow [docs/LOGGING-SETUP.md](docs/LOGGING-SETUP.md) to create the list and flow, then paste the flow URL into `logEndpoint`.
4. **Check.** Publish the folder and open `check.html` on a student PC. Fix anything red, then send a test event.

## Hosting
SharePoint modern pages block custom scripts, and `.html` files in a library download instead of opening, so host the folder on any HTTPS site, for example **Azure Static Web Apps**.

Run the exam **in Microsoft Edge, as its own window**, and use Teams only to hand out the link:
- Post the link in the class channel or an assignment, or add a **Website** tab.
- In business tenants, Website tabs already open in the browser. In education tenants they may load inside Teams, where full screen can be blocked. The page detects this and shows an **Open exam in browser** button.
- An org-restricted form needs the student signed in to Microsoft 365 in Edge. It won't load in InPrivate windows or when third-party cookies are blocked.

## Limits
A web page can't control the operating system. It **detects and deters**; it doesn't **prevent**. It can't see a phone or a second computer, and a determined student can open the form URL directly. The session code and Forms' Record name let you spot responses submitted outside the page. Treat the log as a reason to follow up, not as proof. The security notes are in [docs/LOGGING-SETUP.md](docs/LOGGING-SETUP.md#security-and-limits).

## Real device lockdown with your M365 licence
- **Forms' built-in Take a Test option.** In the quiz settings, turn on *Open with Take a Test app* (older wording: *Block Internet access during a quiz*). This locks Windows to the quiz but gives you no violation log, so use it instead of this page when you don't need a log.
- **Take a Test pointed at this page** (Intune, Intune for Education or Set up School PCs). Kiosk mode blocks other apps, the clipboard and screenshots, and this page still logs events. The page detects Take a Test and skips its own full-screen check. This combination hasn't been tested yet, so do a dry run first. Windows 11 SE support ended in October 2026.
- **Intune kiosk profile.** Edge kiosk mode limited to the exam URL, with the Start menu disabled.
- **Conditional Access.** Allow the form only from managed or compliant devices, or from the school network.

## Test locally
Run `python3 -m http.server 8000` in this folder, then open `http://localhost:8000` (or `/check.html`).
