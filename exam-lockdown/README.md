# Exam Lockdown

Static web pages that wrap Microsoft Forms exams in a monitored, timed, full-screen session. Violations are logged to a SharePoint list, lockouts are posted to Teams, and an after-exam report shows which students to look into. Everything runs on a standard Microsoft 365 licence.

## What it does
**For students**
- An exam picker (or a direct link per exam). Start is only available while the exam is open.
- Full screen with the form inside, a countdown, and warnings at 10, 5 and 1 minutes. When time runs out, students get a short grace period to click Submit, then the page closes the exam.
- A **session code** on screen to type into the form, and a **Finish exam** button.

**What it detects**
- Leaving full screen, switching windows or tabs, reloading or closing the page.
- The exam area shrinking, which happens when developer tools or a side panel such as Edge's Copilot opens.
- A second monitor (log it, or refuse to start).
- The computer clock being changed. The countdown ignores clock changes.
- Copy, paste, right-click, print and developer-tool keys on the page around the form. These blocks don't reach inside the embedded Microsoft Forms frame, which a web page can't control.

**Enforcement**
- After `maxViolations`, the exam locks until a proctor enters the unlock code. Each absence counts once, plus once more for every 30 seconds away. Reloading doesn't clear violations, a lockout or the countdown.
- **Accommodations:** extra time or extra allowed violations, given to a student with a private code. The settings file holds only hashes, so it doesn't reveal who has an accommodation.

**For the teacher**
- A live SharePoint list of every event, and a Teams card for each lockout.
- **`report.html`** reads the Forms results and the list export and flags responses to check: no or unknown session code, a shared code, a response submitted outside the session, restarting after a lockout, a clock change, and more. The files never leave your computer.

## Files
| File | Purpose |
|---|---|
| `index.html` | The exam page students open |
| `config.js` | Your exams (form, time limit, opening times) and shared settings |
| `exams.js` | Reads `config.js` for the three pages |
| `transport.js` | Sends events to the flow, and queues them while offline |
| `check.html` | Setup check: validates settings, gives per-exam links, makes unlock and accommodation codes, sends test events |
| `report.html` | After-exam report from the Forms results and the event list export |
| `docs/LOGGING-SETUP.md` | Step-by-step SharePoint list and Power Automate flow |
| `sharepoint/`, `flow/` | List formatting, an optional script to create the list, the Teams card, and an example event |

## Setup
1. **Forms.** For each exam form, choose *Only people in my organization can respond*, and turn on **Record name** and **One response per person**. Add a required short-answer question, **Session code**. In Settings, set the same **start and end date** and **time duration** as in `config.js`, so Forms enforces them too. These Forms settings apply to every student, so if anyone gets extra time, set them to the longest time any student gets. The exam page still ends each student's session on time. Under Collect responses > Embed, copy the `src` URL.
2. **Exams.** In `config.js`, add one entry per exam under `exams`: `id`, `title`, `formUrl`, and optionally `durationMinutes`, `opens` and `closes`.
3. **Unlock code.** Open `check.html`, type your code in the **Unlock code** box, and paste the hash into `unlockCodeSha256`. The default code is `proctor123`, so change it. The hash is visible to students, so use a long random code.
4. **Accommodations (optional).** In `check.html`'s **Accommodations** box, enter the student ID and their extra minutes or violations. Paste the line it gives you into `accommodations`, and give the student their code privately. The code only works with that student's ID. Remember to lengthen the Forms time duration and end date to match (step 1).
5. **Logging.** Follow [docs/LOGGING-SETUP.md](docs/LOGGING-SETUP.md) to create the list and flow, then paste the flow URL into `logEndpoint`.
6. **Check.** Publish the folder and open `check.html` on a student PC. Fix anything red, send a test event, and copy each exam's student link.

After the exam, export the Forms results and the event list and open **`report.html`**. The guide's "After the exam" section has the steps.

## Hosting
SharePoint modern pages block custom scripts, and `.html` files in a library download instead of opening, so host the folder on any HTTPS site, for example **Azure Static Web Apps**.

Run the exam **in Microsoft Edge, as its own window**, and use Teams only to hand out the link:
- Post each exam's link (`index.html?exam=<id>`) in the class channel or an assignment, or add a **Website** tab.
- In business tenants, Website tabs already open in the browser. In education tenants they may load inside Teams, where full screen can be blocked. The page detects this and shows an **Open exam in browser** button.
- An org-restricted form needs the student signed in to Microsoft 365 in Edge. It won't load in InPrivate windows or when third-party cookies are blocked.

## Limits
A web page can't control the operating system. It **detects and deters**; it doesn't **prevent**.
- It can't see a phone or a second computer, and a determined student can open the form URL directly. The session code and the report catch responses submitted outside the page.
- Opening times and the countdown use the student PC's clock when the page loads. Set the same dates and time duration in Forms, which enforces them on Microsoft's side.
- Treat the log as a reason to follow up, not as proof. The security notes are in [docs/LOGGING-SETUP.md](docs/LOGGING-SETUP.md#security-and-limits).

## Real device lockdown with your M365 licence
- **Forms' built-in Take a Test option.** In the quiz settings, turn on *Open with Take a Test app* (older wording: *Block Internet access during a quiz*). This locks Windows to the quiz but gives you no violation log, so use it instead of this page when you don't need a log.
- **Take a Test pointed at this page** (Intune, Intune for Education or Set up School PCs). Kiosk mode blocks other apps, the clipboard and screenshots, and this page still logs events. The page detects Take a Test and skips its own full-screen check. This combination hasn't been tested yet, so do a dry run first. Windows 11 SE support ended in October 2026.
- **Intune kiosk profile.** Edge kiosk mode limited to the exam URL, with the Start menu disabled.
- **Conditional Access.** Allow the form only from managed or compliant devices, or from the school network.

## Test locally
Run `python3 -m http.server 8000` in this folder, then open `http://localhost:8000` (or `/check.html` or `/report.html`).
