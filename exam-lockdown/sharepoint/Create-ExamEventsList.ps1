#Requires -Version 7.4
<#
.SYNOPSIS
  Creates the "Exam Events" SharePoint list used by the exam lockdown page, with columns,
  severity colours, a proctor view, and teacher-only permissions.

.DESCRIPTION
  Optional: you can build the same list by hand (see docs/LOGGING-SETUP.md, step 1).
  Needs PnP.PowerShell 3.x (Install-Module PnP.PowerShell -Scope CurrentUser) and an Entra ID app
  registered for PnP, which IT may have to approve once:
    Register-PnPEntraIDAppForInteractiveLogin -ApplicationName "PnP.PowerShell" -Tenant <tenant>.onmicrosoft.com

.EXAMPLE
  ./Create-ExamEventsList.ps1 -SiteUrl https://contoso.sharepoint.com/sites/Networking -ClientId <app-guid>
#>
param(
  [Parameter(Mandatory)] [string] $SiteUrl,
  [Parameter(Mandatory)] [string] $ClientId,
  [string] $ListTitle = "Exam Events"
)
$ErrorActionPreference = "Stop"
Import-Module PnP.PowerShell

Connect-PnPOnline -Url $SiteUrl -ClientId $ClientId -Interactive

New-PnPList -Title $ListTitle -Template GenericList -Url "Lists/ExamEvents" -EnableVersioning | Out-Null
Set-PnPField -List $ListTitle -Identity Title -Values @{ Title = "Event" }

# Field XML keeps the internal names short and lets DateTime include the time.
$fields = @(
  '<Field Type="Text" Name="StudentName" StaticName="StudentName" DisplayName="StudentName" MaxLength="100" />'
  '<Field Type="Text" Name="StudentId" StaticName="StudentId" DisplayName="StudentId" MaxLength="50" />'
  '<Field Type="Choice" Name="Severity" StaticName="Severity" DisplayName="Severity" Format="Dropdown"><CHOICES><CHOICE>Violation</CHOICE><CHOICE>Lock</CHOICE><CHOICE>Info</CHOICE></CHOICES></Field>'
  '<Field Type="Note" Name="Detail" StaticName="Detail" DisplayName="Detail" NumLines="3" RichText="FALSE" />'
  '<Field Type="Number" Name="ViolationCount" StaticName="ViolationCount" DisplayName="ViolationCount" Decimals="0" Min="0" />'
  '<Field Type="Number" Name="BlockedCount" StaticName="BlockedCount" DisplayName="BlockedCount" Decimals="0" Min="0" />'
  '<Field Type="DateTime" Name="EventTime" StaticName="EventTime" DisplayName="EventTime" Format="DateTime" />'
  '<Field Type="Text" Name="SessionCode" StaticName="SessionCode" DisplayName="SessionCode" MaxLength="20" />'
  '<Field Type="Text" Name="SessionId" StaticName="SessionId" DisplayName="SessionId" MaxLength="64" />'
  '<Field Type="Text" Name="ExamId" StaticName="ExamId" DisplayName="ExamId" MaxLength="64" />'
  '<Field Type="Text" Name="Environment" StaticName="Environment" DisplayName="Environment" MaxLength="64" />'
)
foreach ($xml in $fields) { Add-PnPFieldFromXml -List $ListTitle -FieldXml $xml | Out-Null }

# Indexes keep the proctor view working once the list grows past 5,000 rows.
foreach ($name in "EventTime", "StudentName", "ExamId") {
  Set-PnPField -List $ListTitle -Identity $name -Values @{ Indexed = $true }
}

$formatter = Get-Content -Raw -Path (Join-Path $PSScriptRoot "severity-format.json")
Set-PnPField -List $ListTitle -Identity Severity -Values @{ CustomFormatter = $formatter }

$columns = "EventTime", "StudentName", "StudentId", "Title", "Severity", "ViolationCount", "BlockedCount", "Detail", "SessionCode", "ExamId"
Set-PnPView -List $ListTitle -Identity "All Items" -Fields $columns | Out-Null
Add-PnPView -List $ListTitle -Title "Proctor - today by student" -Fields $columns -RowLimit 500 -SetAsDefault -Query @'
<Where><Geq><FieldRef Name="EventTime"/><Value Type="DateTime"><Today/></Value></Geq></Where>
<GroupBy Collapse="FALSE" GroupLimit="100"><FieldRef Name="StudentName"/></GroupBy>
<OrderBy><FieldRef Name="EventTime" Ascending="FALSE"/></OrderBy>
'@ | Out-Null

# Students in a class team are site Members with Edit rights. Remove Members and Visitors from this
# list so only owners (teachers) can see or change the log. The flow writes with the teacher's connection.
Set-PnPList -Identity $ListTitle -BreakRoleInheritance -CopyRoleAssignments | Out-Null
foreach ($group in (Get-PnPGroup -AssociatedMemberGroup), (Get-PnPGroup -AssociatedVisitorGroup)) {
  if (-not $group) { continue }
  $roles = (Get-PnPListPermissions -Identity $ListTitle -PrincipalId $group.Id -ErrorAction SilentlyContinue).Name
  foreach ($role in $roles) {
    Set-PnPListPermission -Identity $ListTitle -Group $group.Title -RemoveRole $role
  }
}

Write-Host "Created '$ListTitle' at $SiteUrl. Only site owners can open it." -ForegroundColor Green
