# Exam Lockdown

A static web page that wraps a Microsoft Forms exam in a monitored full-screen session. Host it in Microsoft 365 (Teams tab or SharePoint) and give students the link.

## What it does
- Requires full screen to start, and records the student's name and ID.
- Flags leaving full screen, switching tabs or windows, and losing focus.
- Blocks copy, cut, paste, right-click, print, F12, Ctrl+Shift+I/J and view-source.
- Sends each violation to a Power Automate flow (optional), for example into a SharePoint list.
- Locks the exam after `maxViolations`. The proctor enters an unlock code to resume.

## Limits
A web page cannot control the operating system. It **detects and deters**, it does not **prevent**. A student can still use a second device or a phone, or run another computer. Pair it with the device-level lockdown below for real enforcement.

## Setup
1. **Form**: in Microsoft Forms open the exam, then Share, Embed. Copy the `src` URL into `formUrl` in `config.js`. Under Settings, turn on "One response per person" and "Record name".
2. **Unlock code**: `echo -n "yourcode" | sha256sum`, paste the hash into `unlockCodeSha256`. The default code is `proctor123`; change it. The hash is visible to students, so use a long random code.
3. **Logging (optional)**: in Power Automate create a flow, trigger "When an HTTP request is received", then actions "Create item" (SharePoint list) or "Post message" (Teams). Paste the trigger URL into `logEndpoint`. Fields are: time, exam, type, detail, student.name, student.id, violations.

## Hosting in Microsoft 365
SharePoint modern pages block custom scripts, and `.html` files in a library download instead of rendering. Use one of these:
- **Teams tab (recommended)**: host the folder on Azure Static Web Apps (or any HTTPS site), then in the Teams channel add a **Website** tab pointing to `index.html`. Students open the exam from Teams.
- **Direct link**: share the HTTPS URL in Teams or Outlook.
- **SharePoint**: embed the hosted URL using the Embed web part (allow the domain under Site settings, HTML Field Security).

The page works in Edge or Chrome. Forms must be reachable by the students' accounts (restrict to people in your organisation).

## Real device lockdown with your M365 licence
Use these with the page above.
- **Take a Test** (Windows, via Intune or Set up School PCs): kiosk mode with no other apps, no clipboard and no screenshots. Point it at this page's URL.
- **Intune kiosk profile**: Edge kiosk mode limited to the exam URL, with the Start menu disabled.
- **Conditional Access**: allow the exam site only from managed or compliant devices and from the school network or IP range.
- **Microsoft Teams Education**: Assignments with Forms quizzes, plus Reading Progress and Immersive Reader where appropriate.

## Test locally
`python3 -m http.server 8000` in this folder, then open `http://localhost:8000`.
