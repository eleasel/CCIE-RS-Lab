# Violation logging with Microsoft 365

This guide sends every exam event from the lockdown page to a **SharePoint list** (the proctor dashboard) and posts a **Teams alert** when a student is locked out. It needs only a standard Microsoft 365 licence: no Power Automate Premium and no Azure.

```
Student PC (index.html)  ──text/plain POST──▶  Power Automate flow  ──▶  SharePoint list "Exam Events"
                                               "When a Teams webhook     (proctor view, newest first)
                                                request is received"  ──▶  Teams channel card (lockouts only)
```

## Before you start

**Why this trigger.** Power Automate's "When an HTTP request is received" trigger is **premium** and fails on a standard M365 licence. "When a Teams webhook request is received" (Microsoft Teams connector) is **standard**, and so are the SharePoint and Teams actions below. Don't add any premium action to this flow, or the whole flow will need Premium.

**Ask your M365 admin** to confirm these four things:

1. Power Automate and the Teams **Workflows** app are allowed for teachers.
2. No connector policy blocks the Teams webhook trigger. If one does, the flow shows *"Admin data policy restricts use of these apis: TeamsWebhookRequestReceived"*.
3. Webhook flows may use **"Who can trigger the flow: Anyone"**. Students aren't signed in to the page, so this setting is required.
4. The school web filter allows `*.api.powerplatform.com`, `forms.office.com` and `forms.cloud.microsoft`.

## Step 1: Create the "Exam Events" list

Put the list where students **can't open it**. In a class team, students are site Members with Edit rights, so a list in the team site needs its own permissions (step 1e).

**Option A: by hand.**

a. In the class team's SharePoint site (or a teacher-only site), choose **+ New > List > Blank list**, name it `Exam Events` and select **Create**.

b. Rename the **Title** column to `Event` (column header > Column settings > Edit).

c. Add these columns with **+ Add column**. Type the names exactly as shown, without spaces.

| Column | Type | Settings |
|---|---|---|
| StudentName | Single line of text | |
| StudentId | Single line of text | |
| Severity | Choice | Choices: `Violation`, `Lock`, `Info` (exact spelling) |
| Detail | Multiple lines of text | Plain text |
| ViolationCount | Number | 0 decimal places |
| BlockedCount | Number | 0 decimal places |
| EventTime | Date and time | **Include time: Yes** |
| SessionCode | Single line of text | |
| SessionId | Single line of text | |
| ExamId | Single line of text | |
| Environment | Single line of text | |

d. **Colour the Severity column.** Open the Severity column header > Column settings > Format this column > Advanced mode. Paste [`sharepoint/severity-format.json`](../sharepoint/severity-format.json) and select **Save**. Lock rows show dark red, Violation red and Info grey.

e. **Lock the list down.** Go to Settings (gear) > List settings > Permissions for this list > **Stop Inheriting Permissions**. Select the *Members* and *Visitors* groups and choose **Remove User Permissions**. Keep *Owners*, which includes the teachers.

f. **Create the proctor view.** Go to Settings > List settings > Indexed columns, and add indexes on `EventTime`, `StudentName` and `ExamId`. Then create a view named `Proctor - today by student` with these settings:
   - **Filter:** EventTime is greater than or equal to `[Today]`
   - **Sort:** EventTime, descending
   - **Group by:** StudentName, expanded, 100 groups per page
   - **Item limit:** 500

**Option B: script.** [`sharepoint/Create-ExamEventsList.ps1`](../sharepoint/Create-ExamEventsList.ps1) does steps a to f. It needs PowerShell 7.4 or later, PnP.PowerShell 3.x, and an Entra ID app registered for PnP. Since September 2024 PnP needs your own app registration, which IT may have to approve.

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
./Create-ExamEventsList.ps1 -SiteUrl https://<tenant>.sharepoint.com/sites/<class> -ClientId <app-guid>
```

## Step 2: Build the flow

1. Go to [make.powerautomate.com](https://make.powerautomate.com) > **+ Create > Automated cloud flow** > **Skip**.
2. **Trigger:** search for "Teams webhook" and add **When a Teams webhook request is received**. Set **Who can trigger the flow?** to **Anyone**.
3. **+ New step > Compose.** Rename the action to `Event` *before* you continue, because the expressions below use that name. For Inputs, open the expression editor (fx) and enter:
   ```
   json(string(triggerBody()))
   ```
   The page sends the event as plain text, so the body arrives as a string. `string()` leaves a string unchanged and `json()` turns it into an object. The same expression also works if you switch the page to `cors-json`.
4. **+ New step > SharePoint > Create item.** Choose your site and **Exam Events**. Fill each field with an expression:

   | Field | Expression |
   |---|---|
   | Event (Title) | `outputs('Event')?['type']` |
   | StudentName | `outputs('Event')?['studentName']` |
   | StudentId | `outputs('Event')?['studentId']` |
   | Severity Value | `outputs('Event')?['severity']` |
   | Detail | `outputs('Event')?['detail']` |
   | ViolationCount | `outputs('Event')?['violations']` |
   | BlockedCount | `outputs('Event')?['blocked']` |
   | EventTime | `utcNow()` |
   | SessionCode | `outputs('Event')?['sessionCode']` |
   | SessionId | `outputs('Event')?['sessionId']` |
   | ExamId | `outputs('Event')?['examId']` |
   | Environment | `outputs('Event')?['env']` |

   EventTime uses the time the flow received the event, not the student PC's clock, which a student could change.
5. **+ New step > Condition:** `outputs('Event')?['severity']` *is equal to* `Lock`.
6. **Under "True": Microsoft Teams > Post card in a chat or channel.**
   - Post as: **Flow bot**
   - Post in: **Channel**
   - Team / Channel: the class team and a staff or proctor channel that students can't read
   - Adaptive Card: paste [`flow/alert-card.json`](../flow/alert-card.json)
7. **Save.** Open the trigger again and copy the **HTTP URL**. It looks like `https://<id>.environment.api.powerplatform.com/powerautomate/automations/direct/...`, may be longer than 255 characters, and must be copied whole. Old `logic.azure.com` URLs stopped working on 30 November 2025.
8. **Add a co-owner** (flow details > Owners > Edit). The flow belongs to you personally. A co-owner keeps it working if you're away or your account changes.

Teams cards go out only for lockouts on purpose. The Flow bot can post roughly **25 cards every 5 minutes**. Violations are in the list, which is the place to watch them.

## Step 3: Connect the page and test

1. In `config.js`, set `logEndpoint` to the URL from step 2.7, and keep `logMode: "beacon"`.
2. Publish the folder, then open **`check.html`** on a student PC. Fix anything red.
3. Select **Send test (beacon)**. Within about a minute you should see a successful run in the flow's **run history** and a row with student name **SETUP CHECK** in the list.
4. If no beacon row appears, select **Send test (cors-json)**. If that row appears, set `logMode: "cors-json"` in `config.js`. If neither appears, see Troubleshooting.
5. Do a full dry run: open `index.html` with a test name, leave full screen three times, and check that the list fills in and the Teams card arrives. Then unlock with your code.

The page can't see whether a send succeeded. Microsoft's endpoint doesn't let the browser read its reply, so the run history is your receipt. Run this test after every change to the flow.

## Request budget

A standard M365 licence allows about **6,000 Power Platform requests per day** across all your flows. Each event uses about **4** requests (trigger, Compose, Create item, Condition), and each lockout uses 5. Most events are heartbeats, the page's "still here" report.

| Students, 2-hour exam | Heartbeat 300 s (default) | Heartbeat 600 s | Heartbeat off |
|---|---|---|---|
| 20 | ~2,300 | ~1,400 | ~400 |
| 40 | ~4,600 | ~2,700 | ~800 |
| 60 | ~7,000 (too many) | ~4,100 | ~1,200 |

These figures assume about five other events per student (start, finish and a few violations). For more than 40 students, or two exams on the same day, set `heartbeatSeconds: 600`. Blocked copy/paste/key presses don't send their own requests; the page counts them and reports the total with the next heartbeat. Over the limit, Power Automate **slows the flow down**, so alerts arrive late. It doesn't drop them.

## During the exam

- Open the **Proctor - today by student** view on your PC. The newest event for each student is at the top of their group.
- **The list doesn't refresh itself.** Press F5 every few minutes.
- If a student's newest row is older than about twice the heartbeat (10 minutes at the default), their page is closed, offline or frozen. Go and check.
- `page_closed`, `resumed` and `page_reloaded` mean the page was reloaded or closed. A reload counts as one violation, and a lockout survives a reload. A student who opens a new tab starts a new session, which shows as a second `started` row for the same name.
- A Teams card means a student is locked out and waiting for your unlock code.

## After the exam

1. Turn the flow **off** until the next exam (flow details > Turn off). Nobody can then add rows using the URL.
2. In Forms, open the responses in Excel. With **Record name** on, each response has the student's real account. Match the response's **Session code** answer to `SessionCode` in the list, and look into:
   - responses with no session code, or a code that isn't in the list
   - responses submitted before that student's `started` row or after their `ended` row
   - students with `page_closed`, `resumed`, lockouts or high `BlockedCount`
3. Power Automate turns off flows that haven't run for 90 days and emails the owner first. Check the flow is on before each exam period.

## Security and limits

- **The flow URL is public.** It's in `config.js`, so a student who reads the page source can post fake rows. Nobody can edit or delete existing rows through it, because only owners can open the list. Treat the log as a reason to follow up, not as proof. Keep the flow off between exams. If the URL is misused, delete the trigger and add it again to get a new URL, then update `config.js`.
- **Names typed into the page aren't verified.** Identity comes from Forms (Record name), joined by the session code.
- **The page detects; it doesn't prevent.** It can't see a phone or a second computer. For real lockdown use Take a Test or Intune (see the README).

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| No run appears in run history | The flow is off. The URL is incomplete or an old `logic.azure.com` one. "Who can trigger" isn't **Anyone**. The school filter blocks `*.api.powerplatform.com`. Or the trigger rejects plain text, so try `cors-json` in `check.html`. |
| Run fails at **Event** (Compose) | The expression isn't exactly `json(string(triggerBody()))`. Open the failed run, look at the trigger's body, and confirm it's the event JSON. |
| Run fails at **Create item** | Severity choices must be exactly `Violation`, `Lock` and `Info`. Check the Number columns exist. |
| Run fails at **Post card** | The ~25 cards per 5 minutes limit was hit, or the channel was deleted. The row was still saved. |
| "Workflow is disabled by your org" | An admin policy blocks the Teams webhook trigger. Ask your admin (see Before you start). |
| The list shows old data | It doesn't refresh itself. Press F5. |
| Rows appear late during a busy exam | The request limit was reached. Raise `heartbeatSeconds`. |
