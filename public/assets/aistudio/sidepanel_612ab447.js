const app = document.getElementById("app");
const { STORAGE_DEFAULTS: DEFAULTS, safeWebUrl, REMINDER_MINUTES } = Tabfino;
let state = { ...DEFAULTS };
let activeView = "recent";
// Where the back arrow in Settings returns to.
let viewBeforeSettings = "recent";
let selectedWorkflowId = null;
let searchTerm = "";
let toastTimer;
let stateLoadRevision = 0;
let editingNoteTabId = null;
let selectedFolderId = null;
// The saved tab whose folder picker is open, and the note being edited in a
// folder. Both are view state: nothing is written until you choose.
let pickerUrl = null;
let editingFolderNote = null;
let renamingFolder = false;
// The folder whose delete is waiting to be confirmed. Folders are the only
// memory here that never expires, so a mis-click cannot be waited out — but
// the confirmation belongs in the row you clicked, not in a system dialog
// over the panel.
let confirmDeleteFolderId = null;
// Whether "Waiting on you" is opened. Remembered per browser; collapsed by default.
let attentionExpanded = readPreference("tabfino.attentionExpanded") === "true";

function readPreference(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writePreference(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Storage blocked; the choice lasts until the panel closes. */ }
}

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const timeLabel = time => {
  const timestamp = Number.isFinite(time) ? time : Date.now();
  const elapsed = Math.max(0, Date.now() - timestamp);
  if (elapsed < 60_000) return "just now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(timestamp);
};

async function loadState() {
  const revision = ++stateLoadRevision;
  const persisted = await chrome.storage.local.get(DEFAULTS);
  if (revision !== stateLoadRevision) return;
  state = { ...DEFAULTS, ...persisted };
  state.workflows = Tabfino.sanitizeWorkflows(state.workflows);
  if (!Array.isArray(state.excludedDomains)) state.excludedDomains = [];
  state.tabWatch = Tabfino.sanitizeTabWatch(state.tabWatch);
  state.folders = Tabfino.sanitizeFolders(state.folders);
  render();
}

// Background tab activity re-renders the panel often, so keep whatever the
// user is typing (and their cursor) instead of wiping it on every redraw.
function captureDrafts() {
  const domainInput = document.getElementById("domain-input");
  const noteInput = document.getElementById("tab-note-input");
  const focused = document.activeElement;
  return {
    domain: domainInput?.value,
    note: noteInput ? { key: noteInput.dataset.noteKey, value: noteInput.value } : null,
    focus: focused?.id && app.contains(focused) ? { id: focused.id, start: focused.selectionStart, end: focused.selectionEnd } : null,
    scrollTop: app.querySelector(".content")?.scrollTop || 0,
    view: activeView
  };
}

function restoreDrafts(drafts) {
  // Only within the same view: moving between the list and a workflow should
  // start at the top, but a redraw triggered by background activity should
  // not throw you back there.
  const content = app.querySelector(".content");
  if (content && drafts.scrollTop && drafts.view === activeView) content.scrollTop = drafts.scrollTop;
  const domainInput = document.getElementById("domain-input");
  if (domainInput && drafts.domain) domainInput.value = drafts.domain;
  const noteInput = document.getElementById("tab-note-input");
  if (noteInput && drafts.note && noteInput.dataset.noteKey === drafts.note.key) noteInput.value = drafts.note.value;
  const focusTarget = drafts.focus && document.getElementById(drafts.focus.id);
  if (focusTarget) {
    focusTarget.focus();
    try { if (Number.isInteger(drafts.focus.start)) focusTarget.setSelectionRange(drafts.focus.start, drafts.focus.end); } catch { /* Not a text field. */ }
  }
}


// Small line icons, drawn inline so the panel ships no icon font or sprite.
const ICON = {
  gear: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h8M14.5 6H17M3 14h2.5M9 14h8"/><circle cx="12.75" cy="6" r="1.75"/><circle cx="7.25" cy="14" r="1.75"/></svg>`,
  back: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4.5 6.5 10l5.5 5.5"/></svg>`,
  chevronRight: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 4.5 13.5 10 8 15.5"/></svg>`,
  chevronDown: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 7.5 10 12l4.5-4.5"/></svg>`,
  search: `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.2"/><path d="m13 13 3.5 3.5"/></svg>`,
  bookmark: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 3.5h9v13l-4.5-3.2-4.5 3.2z"/></svg>`,
  folder: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.75 6.25a1.5 1.5 0 0 1 1.5-1.5h3l1.75 2h5.75a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5H4.25a1.5 1.5 0 0 1-1.5-1.5z"/></svg>`,
  trash: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.75 5.75h12.5M8 5.75V4.5h4v1.25M6 5.75l.6 9.1a1.4 1.4 0 0 0 1.4 1.3h4a1.4 1.4 0 0 0 1.4-1.3l.6-9.1M8.6 8.5v5M11.4 8.5v5"/></svg>`
};

// Chrome keeps a favicon cache for pages you have visited, and an extension
// can read it through its own _favicon/ endpoint. That is a local lookup, not
// a network request, and it needs no access to the site itself \u2014 so the icon
// a person already recognises costs nothing the product promises not to spend.
function faviconUrl(pageUrl, size) {
  if (!safeWebUrl(pageUrl) || typeof chrome === "undefined" || !chrome.runtime?.getURL) return "";
  try {
    const endpoint = new URL(chrome.runtime.getURL("/_favicon/"));
    endpoint.searchParams.set("pageUrl", pageUrl);
    endpoint.searchParams.set("size", String(size));
    return endpoint.toString();
  } catch {
    return "";
  }
}

// The letter stays in the markup underneath the icon. Chrome has no favicon
// for a page it has never loaded, and the preview harness has no extension
// runtime at all, so the mark has to identify the site on its own when the
// image does not arrive. Hue and letter both come from the hostname, so the
// fallback is stable rather than random.
function siteMark(pageUrl, hostname, extraClass = "") {
  const host = String(hostname || "").replace(/^www\./, "");
  const letter = (host.match(/[a-z0-9]/i) || ["?"])[0].toUpperCase();
  let hue = 0;
  for (let index = 0; index < host.length; index += 1) hue = (hue * 31 + host.charCodeAt(index)) % 360;
  const icon = faviconUrl(pageUrl, extraClass.includes("is-lg") ? 32 : 16);
  return `<span class="site-mark ${icon ? "has-icon" : ""} ${extraClass}" style="--mark-hue:${hue}" aria-hidden="true"><span class="site-letter">${escapeHtml(letter)}</span>${icon ? `<img class="site-favicon" src="${escapeHtml(icon)}" alt="" />` : ""}</span>`;
}

// The anchor tab is what the workflow is named after, so it is also the tab
// whose mark represents it.
function workflowAnchorTab(workflow) {
  const tabs = workflow?.tabs || [];
  return tabs.find(tab => tab.url === workflow.anchorUrl) || Tabfino.workflowAnchor(tabs, workflow?.activeUrl) || tabs[0] || null;
}

// The facts you want in one line: where the time went, what is still there.
function workflowFacts(workflow) {
  const tabs = workflow?.tabs || [];
  const open = tabs.filter(Tabfino.isOpenTab).length;
  const anchor = workflowAnchorTab(workflow);
  const parts = [];
  if (anchor && (anchor.activeMs || 0) >= 60_000) parts.push(`${durationLabel(anchor.activeMs)} on ${anchor.hostname}`);
  else if (anchor?.hostname) parts.push(anchor.hostname);
  parts.push(`${open} open`);
  if (tabs.length - open > 0) parts.push(`${tabs.length - open} closed`);
  return parts.join(" \u00b7 ");
}

function render() {
  const currentWorkflow = state.workflows.find(item => item.id === selectedWorkflowId);
  const drafts = captureDrafts();
  // A workflow can be deleted while its detail is open; fall back to the list.
  const currentFolder = state.folders.find(item => item.id === selectedFolderId);
  let view = activeView === "related" && !currentWorkflow ? "recent" : activeView;
  // A folder can be deleted from another window while its page is open.
  if (view === "folder" && !currentFolder) view = "recent";
  const body = view === "settings" ? settingsView()
    : view === "folder" ? folderView(currentFolder)
    : view === "related" ? relatedView(currentWorkflow)
    : recentView(currentWorkflow);
  // On the list, the docked button resumes the most recent workflow: that is
  // the one the panel was opened for.
  const actionTarget = view === "related" ? currentWorkflow : view === "folder" ? currentFolder : filteredWorkflows()[0];
  app.innerHTML = state.onboardingComplete
    ? `${topBar(view)}${subHeader(view, view === "folder" ? currentFolder : currentWorkflow)}<main class="content">${body}</main>${actionBar(view, actionTarget)}`
    : `${topBar(view)}${onboardingView()}`;
  bindEvents();
  restoreDrafts(drafts);
  void reportReturnSeen();
  trackScrollEdges();
}

// A panel with fixed furniture top and bottom hides its own overflow: with no
// cue, a list that continues below the action bar looks like it ends there.
function trackScrollEdges() {
  const content = app.querySelector(".content");
  if (!content) return;
  const update = () => {
    app.classList.toggle("is-scrolled", content.scrollTop > 1);
    app.classList.toggle("is-scrollable", content.scrollHeight - content.clientHeight - content.scrollTop > 1);
  };
  content.addEventListener("scroll", update, { passive: true });
  update();
}

// Brand, capture state, and one way into settings. Settings is configuration
// of the tool, not a view of your work, so it belongs in the chrome rather
// than beside "Recent Work" as if the two were peers.
function topBar(view) {
  const gear = state.onboardingComplete && view === "recent"
    ? `<button class="icon-button" type="button" data-view="settings" aria-label="Settings">${ICON.gear}</button>`
    : "";
  return `<header class="topbar">
    <div class="brand-lockup"><img class="brand-mark" src="tabfino-icon.svg" alt="" /><div><p class="brand-name">Tabfino</p><p class="brand-tagline">Pick up where you left off</p></div></div>
    ${state.onboardingComplete ? `<div class="status-pill ${state.trackingEnabled ? "is-on" : ""}" aria-live="polite"><span class="status-dot"></span>${state.trackingEnabled ? "Remembering" : "Paused"}</div>` : ""}
    ${gear}
  </header>`;
}

// Depth is a stack with a way back, not another tab. The list is the one
// top-level place; a workflow and settings are both pushed on top of it.

function subHeader(view, workflow) {
  if (view === "related" && workflow) {
    const anchor = workflowAnchorTab(workflow);
    return `<div class="detail-head">
      <button class="back" type="button" data-action="back" aria-label="Back to recent work">${ICON.back}</button>
      ${siteMark(anchor?.url, anchor?.hostname, "is-lg")}
      <span class="detail-copy"><h1 class="page-title">${escapeHtml(workflow.title || "Workflow")}</h1><span class="detail-facts">${escapeHtml(workflowFacts(workflow))} \u00b7 ${escapeHtml(timeLabel(workflow.lastActive))}</span></span>
    </div>`;
  }
  if (view === "folder" && workflow) {
    const folder = workflow;
    const newest = folder.items[0];
    return `<div class="detail-head">
      <button class="back" type="button" data-action="back" aria-label="Back to recent work">${ICON.back}</button>
      <span class="folder-mark is-lg" aria-hidden="true">${ICON.folder}</span>
      <span class="detail-copy"><h1 class="page-title">${escapeHtml(folder.name)}</h1><span class="detail-facts">${folder.items.length} saved${newest ? ` \u00b7 last added ${escapeHtml(timeLabel(newest.addedAt))}` : ""}</span></span>
    </div>`;
  }
  if (view === "settings") {
    return `<div class="detail-head is-plain"><button class="back" type="button" data-view="${escapeHtml(viewBeforeSettings)}" aria-label="Back">${ICON.back}</button><span class="detail-copy"><h1 class="page-title">Settings</h1></span></div>`;
  }
  return "";
}


// Docked, so the action the panel exists to produce never scrolls away.


function actionBar(view, workflow) {
  if (view === "settings") return "";
  if (view === "folder") {
    if (!workflow) return "";
    // A folder is a reading list, so the primary action is to open it; its
    // name and its existence are edits, which belong on the quieter side.
    if (confirmDeleteFolderId === workflow.id) {
      return `<footer class="actionbar is-confirm">${deleteFolderConfirm(workflow)}</footer>`;
    }
    return `<footer class="actionbar">
      <button class="button" data-action="open-folder" data-id="${escapeHtml(workflow.id)}" ${workflow.items.length ? "" : "disabled"}>Open ${workflow.items.length || "all"} tab${workflow.items.length === 1 ? "" : "s"} <span aria-hidden="true">&rarr;</span></button>
      <button class="button ghost neutral" data-action="rename-folder" data-id="${escapeHtml(workflow.id)}">Rename</button>
      <button class="button ghost" data-action="ask-delete-folder" data-id="${escapeHtml(workflow.id)}">Delete</button>
    </footer>`;
  }
  if (view === "related" && workflow) {
    // Stacked, not side by side: resuming is the whole point of the view and
    // gets the full width. Removing is a different kind of act altogether and
    // reads better underneath than as its equal.
    return `<footer class="actionbar is-stacked">
      <button class="button resume" data-action="continue" data-id="${escapeHtml(workflow.id)}">Continue work <span aria-hidden="true">&rarr;</span></button>
      <button class="button ghost" data-action="delete-workflow" data-id="${escapeHtml(workflow.id)}">Remove</button>
    </footer>`;
  }
  // Saved work stays resumable while capture is paused; only the control that
  // would write something new goes away.
  //
  // With a workflow on screen the bar carries one control and nothing else.
  // Capture has not gone anywhere: it moved under the resume card, beside the
  // window it would actually save, which is what it was always about.
  if (!workflow) {
    return state.trackingEnabled
      ? `<footer class="actionbar"><button class="button secondary" data-action="capture">Save this window now</button></footer>`
      : "";
  }
  return `<footer class="actionbar"><button class="button resume" data-action="continue" data-id="${escapeHtml(workflow.id)}">Continue work <span aria-hidden="true">&rarr;</span></button></footer>`;
}


function searchRow() {
  return `<div class="search-row"><svg class="search-icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.2"/><path d="m13 13 3.5 3.5"/></svg><input class="search" id="search" type="search" value="${escapeHtml(searchTerm)}" placeholder="Find a workflow" aria-label="Find a workflow" /></div>`;
}

function onboardingView() {
  return `<main class="content">
    <section class="card welcome">
      <div class="welcome-illustration" aria-hidden="true">${lockIcon()}</div>
      <h1>Start with trust.</h1>
      <p>Tabfino keeps a small, local memory of your browser work so you can return after a distraction.</p>
      <div class="privacy-note">${lockIcon()}<span>With your permission, it saves tab titles and URLs on this device for 24 hours, then deletes them. You can add optional notes to remind yourself what to do next. It does not read page contents, messages, or keystrokes. Nothing is sent to a server.</span></div>
      <label class="consent"><input id="consent" type="checkbox" /><span>I understand what Tabfino will save and can pause or delete it in Settings.</span></label>
      <button class="button onboarding-start" id="start" disabled>Enable local memory</button>
      <p class="small-help">Chrome will ask for access to your tabs. You can decline or turn it off later.</p>
    </section>
    <p class="small-help onboarding-footnote">Prototype · metadata only · stored using Chrome local extension storage</p>
  </main>`;
}





function recentView(current) {
  // Pausing stops new capture; it does not make what is already saved any
  // less resumable, so the notice sits above the normal view rather than
  // replacing it.
  const paused = state.trackingEnabled ? "" : `<div class="alert">Memory is paused. Turn it on in Settings to save tab context as you work.</div>`;
  if (!state.workflows.length) return `${paused}${returnBanner()}${waitingOnView()}${savedForLaterSection()}${emptyState()}`;
  const matches = filteredWorkflows();
  // While searching, results are a flat list: promoting one of them would be
  // guessing at which match the person meant.
  if (searchTerm.trim()) {
    return `${paused}${returnBanner()}${waitingOnView()}${searchRow()}${matches.length
      ? `<div class="workflow-list">${matches.map(item => workflowCard(item, current?.id)).join("")}</div>`
      : `<p class="small-help" role="status">No workflows match \u201c${escapeHtml(searchTerm.trim())}\u201d.</p>`}`;
  }
  const [hero, ...rest] = matches;
  // When the tab you were pulled away from belongs to the workflow at the top
  // of the list, the banner and the card are the same message in two boxes.
  // The card absorbs it; the banner is left for the case where they differ.
  const returning = Boolean(state.pendingReturn?.notifiedAt && state.pendingReturn.workflowId === hero?.id);
  // A filter above a list you can already see whole is furniture, not help.
  const search = state.workflows.length >= SEARCH_THRESHOLD ? searchRow() : "";
  // The same call the toolbar badge makes, so the panel and the badge can
  // never disagree about whether something is asking for you.
  const flagged = Tabfino.attentionState(state).flagged.length > 0;
  // Something that needs you now outranks something to go back to, so the
  // queue moves above the resume card only when it is actually asking.
  const attention = waitingOnView();
  return `${paused}
    ${returning ? "" : returnBanner()}
    ${flagged ? attention : ""}
    ${resumeCard(hero, current?.id, returning)}
    ${flagged ? "" : attention}
    ${savedForLaterSection()}
    ${rest.length ? `${search}${groupedList(rest, current?.id)}` : ""}`;
}

// The one thing the panel exists for, given the room to say it. Everything
// below is a list; this is an object.

function resumeCard(workflow, selectedId, returning = false) {
  if (!workflow) return "";
  const anchor = workflowAnchorTab(workflow);
  const tabs = (workflow.tabs || []).filter(Tabfino.isOpenTab);
  const shown = tabs.slice(0, 6);
  const overflow = tabs.length - shown.length;
  // Going to the one tab you were in and reopening the whole workspace are
  // different intentions, so the card keeps the first and the docked bar
  // keeps the second.
  // Capture's new home. It is the same action the docked bar used to carry;
  // under the card it reads as "save this window", which is the thing it
  // does, rather than as a second button competing with Continue work.
  const capture = state.trackingEnabled
    ? `<button class="text-button is-quiet" type="button" data-action="capture">Save this window now</button>`
    : "";
  const returnLinks = returning
    ? `<span class="resume-footer-group"><button class="text-button" type="button" data-action="resume-return" data-id="${escapeHtml(workflow.id)}">Go to the tab you left \u2197</button><button class="text-button is-quiet" type="button" data-action="dismiss-return">Dismiss</button></span>`
    : "";
  // Capture rides along even on a welcome-back card. Dropping it there would
  // leave the one state where you most want to save the window as the one
  // state with no way to do it.
  const footer = returnLinks || capture
    ? `<div class="resume-footer">${returnLinks}${capture}</div>`
    : "";
  return `<section class="resume ${selectedId === workflow.id ? "is-selected" : ""} ${returning ? "is-returned" : ""}">
    <p class="section-kicker resume-kicker">${returning ? "Welcome back" : "Pick up where you left off"}</p>
    <div class="card resume-card">
      <button class="resume-body" type="button" data-action="select-workflow" data-id="${escapeHtml(workflow.id)}" aria-label="Open ${escapeHtml(workflow.title || "workflow")}">
        <span class="resume-head">${siteMark(anchor?.url, anchor?.hostname, "is-lg")}<span class="resume-title">${escapeHtml(workflow.title || "Untitled workflow")}</span><span class="resume-open" aria-hidden="true">${ICON.chevronRight}</span></span>
        <span class="resume-facts">${escapeHtml(workflowFacts(workflow))} \u00b7 ${escapeHtml(timeLabel(workflow.lastActive))}</span>
        ${shown.length ? `<span class="resume-marks">${shown.map(tab => siteMark(tab.url, tab.hostname)).join("")}${overflow > 0 ? `<span class="mark-more">+${overflow}</span>` : ""}</span>` : ""}
      </button>
      ${footer}
    </div>
  </section>`;
}

// Grouped by when, because that is how you look for it: you remember roughly
// how long ago you were doing the thing, not what it was called.
function groupedList(workflows, selectedId) {
  const order = ["Last hour", "Earlier today", "Yesterday"];
  const groups = new Map(order.map(label => [label, []]));
  for (const workflow of workflows) groups.get(ageGroup(workflow.lastActive)).push(workflow);
  return order
    .filter(label => groups.get(label).length)
    .map(label => listSection(
      sectionHeader(label, groups.get(label).length),
      `<div class="workflow-list">${groups.get(label).map(item => workflowCard(item, selectedId)).join("")}</div>`
    ))
    .join("");
}

// Nothing is kept beyond 24 hours, so these three buckets cover everything.
function ageGroup(lastActive) {
  const elapsed = Date.now() - (Number.isFinite(lastActive) ? lastActive : Date.now());
  if (elapsed < 3_600_000) return "Last hour";
  return new Date(lastActive).toDateString() === new Date().toDateString() ? "Earlier today" : "Yesterday";
}



function relatedView(current) {
  if (!current) return emptyState("No workflow selected", "Choose a workflow in Recent Work to see its related browser tabs.");
  const allTabs = current.tabs || [];
  const openTabs = allTabs.filter(Tabfino.isOpenTab);
  const closedTabs = allTabs.filter(tab => !Tabfino.isOpenTab(tab));
  const closed = closedTabs.length
    ? listSection(sectionHeader("You closed these", closedTabs.length), `<div class="card saved-tabs-card is-closed-card"><div class="tab-list">${closedTabs.map(tab => savedTab(tab, current.activeUrl, true)).join("")}</div></div>`)
      + `<p class="small-help">Chrome forgets a tab the moment you close it. These stay recoverable.</p>`
    : "";
  return `${threadSections(openTabs, current.activeUrl)}
    ${closed}
    <p class="small-help">Grouped by which tab you opened them from. Browser metadata only \u2014 Tabfino does not read page content, and forgets all of this after 24 hours.</p>`;
}


// Sentence case at reading weight, with the count on the right. Uppercase
// tracked-out kickers shout louder than the rows they are labelling.
function sectionHeader(label, count) {
  return `<p class="section-kicker"><span>${escapeHtml(label)}</span>${Number.isFinite(count) ? `<span class="section-count">${count}</span>` : ""}</p>`;
}

// Header and rows in one element, so the header unpins when its group ends
// instead of piling up with the next one.
function listSection(header, body) {
  return `<section class="list-section">${header}${body}</section>`;
}


// ---- Folders -----------------------------------------------------------
// The other half of the memory, and the half you made. It sits below the
// resume card because the question "what was I just doing" is the one the
// panel opens for; "where did I file that" is the one you come back with.

function savedForLaterSection() {
  const folders = state.folders || [];
  if (!folders.length) {
    // An empty state only earns its space where the feature is reachable.
    return state.workflows.length
      ? ""
      : `<p class="small-help">Nothing saved for later yet. Keep a tab from any workflow and it stays here after the 24-hour memory forgets it.</p>`;
  }
  const rows = [...folders]
    .sort((a, b) => Tabfino.folderLastAdded(b) - Tabfino.folderLastAdded(a))
    .map(folder => folderRow(folder))
    .join("");
  return listSection(
    sectionHeader("Saved for later", Tabfino.folderItemCount(folders)),
    `<div class="card saved-tabs-card"><div class="tab-list">${rows}</div></div>`
  ) + `<p class="small-help">Folders are yours: nothing in them expires.</p>`;
}

function folderRow(folder) {
  const newest = folder.items[0];
  const facts = folder.items.length
    ? `${folder.items.length} tab${folder.items.length === 1 ? "" : "s"} · last added ${timeLabel(Tabfino.folderLastAdded(folder))}`
    : "Empty";
  const confirming = confirmDeleteFolderId === folder.id;
  return `<div class="saved-tab-row">
    <button class="saved-tab is-openable folder-row" type="button" data-action="select-folder" data-id="${escapeHtml(folder.id)}" aria-label="Open folder ${escapeHtml(folder.name)}">
      <span class="folder-mark" aria-hidden="true">${ICON.folder}</span>
      <span class="saved-title">${escapeHtml(folder.name)}</span>
      <span class="saved-host">${escapeHtml(facts)}</span>
      <span class="saved-time folder-marks">${folder.items.slice(0, 3).map(item => siteMark(item.url, item.hostname)).join("")}</span>
    </button>
    <button class="row-action row-delete ${confirming ? "is-open" : ""}" type="button" data-action="ask-delete-folder" data-id="${escapeHtml(folder.id)}" aria-label="Delete folder ${escapeHtml(folder.name)}">${ICON.trash}</button>
    ${confirming ? deleteFolderConfirm(folder) : ""}
  </div>`;
}

// Says what goes and that it is final, in the place the click happened.
function deleteFolderConfirm(folder) {
  const what = folder.items.length
    ? `Delete “${escapeHtml(folder.name)}” and the ${folder.items.length} tab${folder.items.length === 1 ? "" : "s"} in it?`
    : `Delete “${escapeHtml(folder.name)}”?`;
  return `<div class="row-confirm" role="group" aria-label="Confirm deleting ${escapeHtml(folder.name)}">
    <p class="row-confirm-copy">${what} This cannot be undone.</p>
    <div class="row-confirm-actions">
      <button class="button danger is-compact" type="button" data-action="delete-folder" data-id="${escapeHtml(folder.id)}">Delete</button>
      <button class="button ghost neutral is-compact" type="button" data-action="cancel-delete-folder">Keep it</button>
    </div>
  </div>`;
}

function folderView(folder) {
  if (!folder) return emptyState("No folder selected", "Choose a folder in Recent Work to see what you kept.");
  if (renamingFolder) {
    return `<section class="card settings-card"><h2>Rename folder</h2>
      <form class="domain-form" id="folder-rename-form">
        <input class="domain-input" id="folder-rename-input" maxlength="${Tabfino.FOLDER_NAME_MAX}" value="${escapeHtml(folder.name)}" aria-label="Folder name" autocomplete="off" />
        <button class="button domain-add" type="submit">Save</button>
      </form>
      <button class="text-button is-quiet" type="button" data-action="cancel-rename">Cancel</button></section>`;
  }
  if (!folder.items.length) {
    return emptyState("This folder is empty", "Open a workflow and keep a tab from it, or use the in-page button to file the tab you are on.");
  }
  return listSection(
    sectionHeader("Kept here", folder.items.length),
    `<div class="card saved-tabs-card"><div class="tab-list">${folder.items.map(item => folderItemRow(folder, item)).join("")}</div></div>`
  ) + `<p class="small-help">Saved by hand, so these stay until you remove them — the 24-hour sweep leaves folders alone.</p>`;
}

function folderItemRow(folder, item) {
  const title = item.title || item.hostname || "Untitled tab";
  const editing = editingFolderNote === item.url;
  const facts = `${item.hostname || "Website"} · saved ${timeLabel(item.addedAt)}`;
  return `<div class="saved-tab-row">
    <button class="saved-tab is-openable" type="button" data-action="open-saved-tab" data-url="${escapeHtml(item.url)}" aria-label="Open ${escapeHtml(title)} in a new tab">
      ${siteMark(item.url, item.hostname)}
      <span class="saved-title">${escapeHtml(title)}</span>
      <span class="saved-host">${escapeHtml(facts)}</span>
      <span class="saved-time">↗</span>
    </button>
    <button class="row-action" type="button" data-action="remove-folder-item" data-id="${escapeHtml(folder.id)}" data-url="${escapeHtml(item.url)}" aria-label="Remove ${escapeHtml(title)} from ${escapeHtml(folder.name)}">&times;</button>
    ${item.note && !editing ? `<p class="row-note">${escapeHtml(item.note)}</p>` : ""}
    ${editing
      ? `<div class="row-note-editor"><input class="pickup-note" id="folder-note-input" type="text" maxlength="${Tabfino.NOTE_MAX_LENGTH}" value="${escapeHtml(item.note || "")}" placeholder="Applied 10 Nov, no reply yet" aria-label="Note for ${escapeHtml(title)}" /><div class="pickup-note-actions"><button class="pickup-note-cancel" type="button" data-action="cancel-folder-note">Cancel</button><button class="pickup-note-save" type="button" data-action="save-folder-note" data-id="${escapeHtml(folder.id)}" data-url="${escapeHtml(item.url)}">Save note</button></div></div>`
      : `<button class="row-note-button" type="button" data-action="edit-folder-note" data-url="${escapeHtml(item.url)}">${item.note ? "Edit note" : "+ Add note"}</button>`}
  </div>`;
}

// Shown under the row you are filing, rather than as a dialog over the panel:
// at 380px a modal is the whole screen, and you lose sight of what you picked.
function folderPicker(url, title, hostname) {
  const folders = state.folders || [];
  const saved = new Set(folders.filter(folder => folder.items.some(item => item.url === url)).map(folder => folder.id));
  const rows = folders.map(folder => `<button class="picker-folder ${saved.has(folder.id) ? "is-saved" : ""}" type="button" data-action="save-to-folder" data-id="${escapeHtml(folder.id)}" data-url="${escapeHtml(url)}" data-title="${escapeHtml(title)}" data-hostname="${escapeHtml(hostname || "")}">${escapeHtml(folder.name)}<span class="picker-count">${folder.items.length}${saved.has(folder.id) ? " ✓" : ""}</span></button>`).join("");
  return `<div class="folder-picker" role="group" aria-label="Save to a folder">
    ${folders.length ? `<div class="picker-list">${rows}</div>` : `<p class="picker-empty">No folders yet. Name one and this tab goes into it.</p>`}
    <form class="picker-form" id="picker-form" data-url="${escapeHtml(url)}" data-title="${escapeHtml(title)}" data-hostname="${escapeHtml(hostname || "")}">
      <input class="domain-input" id="picker-input" maxlength="${Tabfino.FOLDER_NAME_MAX}" placeholder="New folder" aria-label="New folder name" autocomplete="off" />
      <button class="button domain-add" type="submit">Save</button>
    </form>
  </div>`;
}

function settingsView() {
  const domains = state.excludedDomains || [];
  return `<section class="card settings-card"><div class="setting-row"><div><h2>${state.trackingEnabled ? "Pause memory" : "Resume memory"}</h2><p>${state.trackingEnabled ? "Tabfino is saving tab titles and URLs locally." : "Memory is paused. No new browser activity is saved."}</p></div><button class="switch" role="switch" aria-checked="${state.trackingEnabled}" aria-label="${state.trackingEnabled ? "Pause memory" : "Resume memory"}" data-action="toggle-memory"></button></div></section>
    <section class="list-section">${sectionHeader("Reminders")}
    <section class="card settings-card"><div class="setting-row"><div><h2>When you come back</h2><p>You stepped away and returned. Tabfino shows the tab you were last working in.</p></div><button class="switch" role="switch" aria-checked="${state.idleRemindersEnabled}" aria-label="${state.idleRemindersEnabled ? "Turn off come-back reminders" : "Turn on come-back reminders"}" data-action="toggle-reminders"></button></div><label class="settings-label" for="reminder-minutes">Count me away after</label><select class="search select-control" id="reminder-minutes">${REMINDER_MINUTES.map(minutes => `<option value="${minutes}" ${Number(state.reminderMinutes) === minutes ? "selected" : ""}>${minutes} minutes</option>`).join("")}</select><p class="small-help">Counts time away from your whole computer, not just Chrome.</p><button class="button secondary test-reminder" data-action="test-reminder" ${state.idleRemindersEnabled ? "" : "disabled"}>Send a test reminder</button></section>
    <section class="card settings-card"><div class="setting-row"><div><h2>While you're working</h2><p>You never stopped, but a tab did. Tabfino nudges you about one you left open mid-task \u2014 like an AI answer that finished after you moved on.</p></div><button class="switch" role="switch" aria-checked="${state.tabRemindersEnabled}" aria-label="${state.tabRemindersEnabled ? "Turn off forgotten-tab nudges" : "Turn on forgotten-tab nudges"}" data-action="toggle-tab-reminders"></button></div><label class="settings-label" for="tab-reminder-minutes">Nudge me after a tab sits for</label><select class="search select-control" id="tab-reminder-minutes">${Tabfino.TAB_REMINDER_MINUTES.map(minutes => `<option value="${minutes}" ${Number(state.tabReminderMinutes) === minutes ? "selected" : ""}>${minutes} minutes</option>`).join("")}</select><p class="small-help">Also the delay for \u201cRemind me about this tab\u201d (<kbd>${SHORTCUT_LABEL}</kbd>), which works even with this off.</p></section>
    <section class="card settings-card"><h2>How you're alerted</h2><div class="preference-list">
      <label class="consent"><input id="blink-toolbar-icon" type="checkbox" ${state.blinkToolbarIcon ? "checked" : ""}/><span>Blink the toolbar icon when something needs you.</span></label>
      <label class="consent"><input id="show-tab-title" type="checkbox" ${state.showTabTitleInReturnAlert ? "checked" : ""}/><span>Show tab titles and notes in notifications. Anyone near your screen could see them.</span></label>
    </div></section></section>
    <section class="list-section">${sectionHeader("Saving tabs")}
    <section class="card settings-card"><div class="setting-row"><div><h2>Button on every page</h2><p>A launcher on the right edge of each page. Click it for your folders, a new folder, and a reminder for the tab you are on; drag it to move it.</p></div><button class="switch" role="switch" aria-checked="${state.floatingButtonEnabled}" aria-label="${state.floatingButtonEnabled ? "Turn off the in-page button" : "Turn on the in-page button"}" data-action="toggle-floating-button"></button></div>
    <p class="small-help">This is the one part of Tabfino that runs inside the pages you visit, so Chrome will ask for access to all sites. It reads nothing from the page \u2014 the address and title come from Chrome, the same as everywhere else \u2014 and turning it off removes both the button and the permission.</p></section>
    <section class="card settings-card"><h2>Your folders</h2><p>${state.folders.length ? `${state.folders.length} folder${state.folders.length === 1 ? "" : "s"}, ${Tabfino.folderItemCount(state.folders)} tab${Tabfino.folderItemCount(state.folders) === 1 ? "" : "s"} kept. Nothing in a folder expires.` : "Nothing saved yet. Keep a tab from any workflow and it outlives the 24-hour memory."}</p>${state.folders.length ? `<button class="button danger settings-delete-button" data-action="clear-folders">Delete all folders</button>` : ""}</section></section>
    <section class="list-section">${sectionHeader("Data")}
    <section class="card settings-card"><h2>Private sites</h2><p>Tabs on these domains are excluded from saved workflows and from folders, including their subdomains. Adding one removes what is already saved from it.</p><form class="domain-form" id="domain-form"><input class="domain-input" id="domain-input" placeholder="example.com" aria-label="Website domain" autocomplete="off"/><button class="button domain-add" type="submit">Add</button></form><div class="domain-list">${domains.length ? domains.map(domain => `<div class="domain-item"><span>${escapeHtml(domain)}</span><button class="domain-remove" data-action="remove-domain" data-domain="${escapeHtml(domain)}" aria-label="Remove ${escapeHtml(domain)}">\u00d7</button></div>`).join("") : `<span class="small-help">No excluded sites yet.</span>`}</div></section>
    <section class="card settings-card"><h2>What Tabfino stores</h2><div class="privacy-list"><span>Only the last 24 hours of automatic memory \u2014 older work deletes itself</span><span>Tabs you filed into a folder yourself, kept until you delete them</span><span>Tab titles, URLs, and activity timestamps on this device</span><span>Tabs you closed, so you can get them back</span><span>Optional notes you add to a tab reminder</span><span>Site icons come from Chrome's own cache on this device</span><span>No page text, screenshots, messages, or keystrokes</span><span>No server upload or account sync</span></div></section>
    <section class="card settings-card"><h2>Delete saved activity</h2><p>Tabfino already deletes anything older than 24 hours. This clears the rest now. Folders are not touched \u2014 they have their own control above.</p><button class="button danger settings-delete-button" data-action="clear-data">Delete all saved work</button></section></section>
    <p class="small-help">Tabfino is a prototype. Memory runs only after the tab-access permission and consent are enabled.</p>`;
}

const SHORTCUT_LABEL = /Mac/i.test(navigator.platform) ? "⌥⇧W" : "Alt+Shift+W";

// The pages the in-page button may run on. The same patterns the worker
// registers the script for, so what is asked for and what is checked match.
const PAGE_ORIGINS = ["http://*/*", "https://*/*"];

// Below this many saved workflows the whole list fits on screen.
const SEARCH_THRESHOLD = 5;

function tabReminderMinutes() {
  return Tabfino.TAB_REMINDER_MINUTES.includes(Number(state.tabReminderMinutes)) ? Number(state.tabReminderMinutes) : DEFAULTS.tabReminderMinutes;
}

function attentionReason(record) {
  if (!record.needsAttention) {
    const minutes = Math.max(1, Math.ceil((record.waitingUntil - Date.now()) / 60_000));
    return `Reminder in ${minutes} min`;
  }
  if (record.reason === "changed") return "Changed after you left — may be ready";
  if (record.reason === "forgotten") {
    const worked = Math.max(1, Math.round((record.engagedMs || 0) / 60_000));
    return `You spent ${worked} min here · left ${timeLabel(record.leftAt)}`;
  }
  return "Reminder you set";
}

// Tabs Tabfino is reminding you about (or will), with the reason for each.

function waitingOnView() {
  if (!state.trackingEnabled) return "";
  const records = Tabfino.tabsNeedingAttention(state.tabWatch);
  const flagged = records.filter(record => record.needsAttention).length;
  const summary = records.length
    ? `${records.length} left mid-task${flagged ? `, ${flagged} need${flagged === 1 ? "s" : ""} you now` : ""}`
    : "nothing waiting";
  return `<section class="attention-section ${attentionExpanded ? "is-expanded" : ""}" aria-labelledby="attention-heading">
    <h2 class="attention-title" id="attention-heading"><button class="attention-toggle" type="button" data-action="toggle-attention" aria-expanded="${attentionExpanded}" aria-controls="attention-body">
      <span class="attention-heading-copy"><span class="attention-heading-text">Waiting on you</span><span class="attention-summary">${escapeHtml(summary)}</span></span>
      ${flagged ? `<span class="pickup-count" aria-label="${flagged} need attention">${flagged}</span>` : ""}
      <svg class="attention-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 7.5 10 12l4.5-4.5"/></svg>
    </button></h2>
    <div id="attention-body" class="attention-body" ${attentionExpanded ? "" : "hidden"}>
      ${records.length ? `<div class="pickup-list">${records.map(attentionItem).join("")}</div>` : ""}
      <button class="remind-current" type="button" data-action="remind-current">Remind me about this tab in ${tabReminderMinutes()} min <span class="shortcut-hint">${SHORTCUT_LABEL}</span></button>
    </div>
  </section>`;
}

function attentionItem(record) {
  const title = record.title || record.hostname;
  const editing = editingNoteTabId === record.tabId;
  return `<article class="pickup-item ${record.needsAttention ? "is-flagged" : ""}">
    <button class="pickup-return" type="button" data-action="tab-go" data-tab-id="${record.tabId}" aria-label="Go back to ${escapeHtml(title)}">
      ${siteMark(record.url, record.hostname)}
      <span class="pickup-copy"><span class="pickup-title">${escapeHtml(title)}</span><span class="pickup-meta">${escapeHtml(record.hostname)} · <span class="pickup-reason">${escapeHtml(attentionReason(record))}</span></span></span>
      <span class="pickup-action" aria-hidden="true">↗</span>
    </button>
    ${record.note && !editing ? `<p class="pickup-saved-note">${escapeHtml(record.note)}</p>` : ""}
    ${editing ? tabNoteEditor(record) : attentionItemFooter(record)}
  </article>`;
}

// Note affordance on the left, tab actions on the right, so every row lines up.
function attentionItemFooter(record) {
  return `<div class="pickup-footer">
    <button class="pickup-add-note" type="button" data-action="edit-tab-note" data-tab-id="${record.tabId}">${record.note ? "Edit note" : "+ Add note"}</button>
    <span class="pickup-footer-spacer"></span>
    ${record.needsAttention ? `<button class="pickup-done" type="button" data-action="tab-snooze" data-tab-id="${record.tabId}">Snooze</button>` : ""}
    <button class="pickup-done" type="button" data-action="tab-done" data-tab-id="${record.tabId}">${record.needsAttention ? "Done" : "Cancel"}</button>
  </div>`;
}

// An optional note on a reminder ("check Gemini's answer"), shown in the panel
// and in the notification.
function tabNoteEditor(record) {
  return `<div class="pickup-note-editor"><label class="pickup-note-label" for="tab-note-input"><span>Note (optional)</span><input class="pickup-note" id="tab-note-input" data-note-key="${record.tabId}" type="text" maxlength="${Tabfino.NOTE_MAX_LENGTH}" value="${escapeHtml(record.note || "")}" placeholder="What to do when you come back" aria-label="Optional note for ${escapeHtml(record.title || record.hostname)}" /></label><div class="pickup-note-actions"><button class="pickup-note-cancel" type="button" data-action="cancel-tab-note">Cancel</button><button class="pickup-note-save" type="button" data-action="save-tab-note" data-tab-id="${record.tabId}">Save note</button></div></div>`;
}



function workflowCard(item, selectedId) {
  const anchor = workflowAnchorTab(item);
  const classes = ["workflow-card",
    selectedId === item.id ? "is-selected" : "",
    state.pendingReturn?.workflowId === item.id && state.pendingReturn?.notifiedAt ? "is-returned" : ""].filter(Boolean).join(" ");
  return `<button class="${classes}" data-action="select-workflow" data-id="${escapeHtml(item.id)}" aria-label="Open ${escapeHtml(item.title || "workflow")}">
    ${siteMark(anchor?.url, anchor?.hostname)}
    <span class="workflow-title">${escapeHtml(item.title || "Untitled workflow")}</span>
    <span class="workflow-meta">${escapeHtml(workflowFacts(item))}</span>
    <span class="workflow-time">${escapeHtml(timeLabel(item.lastActive))}</span>
    <span class="workflow-chevron" aria-hidden="true">${ICON.chevronRight}</span>
  </button>`;
}

// Tabs grouped by what they were opened from. With nothing to group — no
// links followed — this is just the flat list, so the structure appears only
// when it means something.

function threadSections(tabs, activeUrl) {
  const { threads, loose } = Tabfino.relatedThreads(tabs);
  const list = items => `<div class="card saved-tabs-card"><div class="tab-list">${items.map(tab => savedTab(tab, activeUrl)).join("")}</div></div>`;
  if (!threads.length) return listSection(sectionHeader("Open tabs", tabs.length), list(tabs));
  const grouped = threads.map(thread => listSection(
    `<p class="section-kicker thread-kicker"><span>Opened from ${escapeHtml(thread.root.title || thread.root.hostname)}</span><span class="section-count">${thread.tabs.length}</span></p>`,
    list(thread.tabs)
  )).join("");
  return grouped + (loose.length ? listSection(sectionHeader("Opened on their own", loose.length), list(loose)) : "");
}

// `showOrigin` is for flat lists, where no heading says what a tab came from.


function savedTab(tab, activeUrl, showOrigin = false) {
  const title = tab.title || tab.hostname || "Untitled tab";
  // Malformed or non-web saved URLs stay visible but not clickable.
  const safeUrl = safeWebUrl(tab.url);
  const element = safeUrl ? "button" : "div";
  const buttonAttributes = safeUrl ? 'type="button" data-action="open-saved-tab" data-url="' + escapeHtml(safeUrl) + '" aria-label="Open ' + escapeHtml(title) + ' in a new tab"' : "";
  const closed = !Tabfino.isOpenTab(tab);
  const className = "saved-tab" + (safeUrl ? " is-openable" : "") + (closed ? " is-closed" : "") + (!closed && tab.url === activeUrl ? " is-last-active" : "");
  // How long you were in this tab, where that is known and worth saying.
  const spent = (tab.activeMs || 0) >= 60_000 ? ` \u00b7 ${durationLabel(tab.activeMs)}` : "";
  // Saying "figma.com \u00b7 from figma.com" tells the reader nothing.
  const originHost = showOrigin && tab.openedFrom ? Tabfino.hostOf(tab.openedFrom) : "";
  const origin = originHost && originHost !== tab.hostname ? ` \u00b7 from ${originHost}` : "";
  const hostLabel = (tab.hostname || "Website") + spent + origin + (closed ? ` \u00b7 closed ${timeLabel(tab.closedAt)}` : "");
  // A reopen is worth a word; opening a tab that is already there is not, so
  // it gets a mark that only resolves on hover.
  const affordance = safeUrl ? (closed ? "Reopen" : "\u2197") : "";
  const row = "<" + element + ' class="' + className + '" ' + buttonAttributes + ">"
    + siteMark(tab.url, tab.hostname)
    + '<span class="saved-title">' + escapeHtml(title) + (!closed && tab.url === activeUrl ? '<span class="live-dot" title="Last active"></span>' : "") + "</span>"
    + '<span class="saved-host">' + escapeHtml(hostLabel) + "</span>"
    + '<span class="saved-time">' + escapeHtml(affordance) + "</span>"
    + "</" + element + ">";
  // Keeping a tab is the point of folders, and the moment you know you want
  // to keep it is usually after you have closed it \u2014 which is the one thing
  // a bookmark cannot do for you, because by then the tab is gone from Chrome
  // and only Tabfino still has it. So the control sits on closed rows too.
  if (!safeUrl) return `<div class="saved-tab-row">${row}</div>`;
  const keeping = pickerUrl === safeUrl;
  const saved = (state.folders || []).some(folder => folder.items.some(item => item.url === safeUrl));
  const keep = `<button class="row-action row-keep ${saved ? "is-saved" : ""} ${keeping ? "is-open" : ""}" type="button" data-action="pick-folder"
    data-url="${escapeHtml(safeUrl)}" data-title="${escapeHtml(title)}" data-hostname="${escapeHtml(tab.hostname || "")}"
    aria-expanded="${keeping}" aria-label="${saved ? "Saved for later" : "Keep"} ${escapeHtml(title)}" title="${saved ? "In a folder" : "Keep for later"}">${ICON.bookmark}</button>`;
  return `<div class="saved-tab-row">${row}${keep}${keeping ? folderPicker(safeUrl, title, tab.hostname) : ""}</div>`;
}



function returnBanner() {
  const pending = state.pendingReturn;
  if (!pending?.notifiedAt) return "";
  const workflow = state.workflows.find(item => item.id === pending.workflowId);
  if (!workflow) return "";
  const tab = workflow.tabs?.find(item => item.url === workflow.activeUrl);
  return `<section class="return-banner" role="status"><div class="return-icon" aria-hidden="true">\u21a9</div><div class="return-copy"><strong>Welcome back</strong><span>Your last tab: ${escapeHtml(tab?.title || workflow.activeTitle || workflow.title)}${tab?.hostname ? ` \u00b7 ${escapeHtml(tab.hostname)}` : ""}</span></div><button class="button return-button" data-action="resume-return" data-id="${escapeHtml(workflow.id)}">Go to tab</button><button class="return-dismiss" data-action="dismiss-return" aria-label="Dismiss return reminder">\u00d7</button></section>`;
}

function emptyState(title = "Your work will appear here", copy = "Once memory is enabled, Tabfino will quietly save tab context so you can resume after an interruption.") {
  return `<section class="card empty"><div class="welcome-illustration" aria-hidden="true">${lockIcon()}</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p>${state.trackingEnabled ? "" : `<button class="button secondary" data-view="settings">Review privacy settings</button>`}</section>`;
}

// Rounded to the minute: this is "roughly how long", not a stopwatch.
function durationLabel(ms) {
  const totalMinutes = Math.round((ms || 0) / 60_000);
  if (totalMinutes < 1) return "under a minute";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function summaryText(workflow) {
  const tabs = workflow.tabs || [];
  const open = tabs.filter(Tabfino.isOpenTab).length;
  const closed = tabs.length - open;
  const anchor = tabs.find(tab => tab.url === workflow.anchorUrl) || Tabfino.workflowAnchor(tabs, workflow.activeUrl);
  const openPart = `${open} tab${open === 1 ? "" : "s"} still open`;
  const closedPart = closed ? `, and ${closed} you have since closed` : "";
  const spentPart = anchor && (anchor.activeMs || 0) > 0
    ? `Most of your time went to ${anchor.hostname} — about ${durationLabel(anchor.activeMs)}. `
    : "";
  return `${spentPart}${openPart}${closedPart}.`;
}

function filteredWorkflows() {
  const term = searchTerm.trim().toLowerCase();
  const items = [...state.workflows].sort((a,b) => (b.lastActive || 0) - (a.lastActive || 0));
  if (!term) return items;
  return items.filter(item => `${item.title} ${(item.tabs || []).map(tab => `${tab.title} ${tab.hostname}`).join(" ")}`.toLowerCase().includes(term));
}

function lockIcon() {
  return `<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="8" width="12" height="9" rx="2"/><path d="M6.5 8V5.8a3.5 3.5 0 0 1 7 0V8"/></svg>`;
}

function bindEvents() {
  app.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
    const next = button.dataset.view;
    if (!next) return;
    // Remember where Settings was opened from so its back arrow returns there.
    if (next === "settings" && activeView !== "settings") viewBeforeSettings = activeView;
    activeView = next;
    render();
  }));
  app.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
    // Chrome API calls can reject (a permission prompt outside a gesture, a
    // closed window); tell the user instead of failing silently.
    handleAction(button).catch(error => {
      console.error("Tabfino action failed.", button.dataset.action, error);
      showToast("Something went wrong. Try again.");
    });
  }));
  app.querySelectorAll(".site-favicon").forEach(image => image.addEventListener("error", () => {
    image.closest(".site-mark")?.classList.remove("has-icon");
    image.remove();
  }, { once: true }));
  const consent = document.getElementById("consent");
  if (consent) consent.addEventListener("change", () => { document.getElementById("start").disabled = !consent.checked; });
  document.getElementById("start")?.addEventListener("click", () => startOnboarding().catch(error => {
    console.error("Tabfino onboarding failed.", error);
    showToast("Could not enable memory. Try again.");
  }));
  document.getElementById("search")?.addEventListener("input", event => { searchTerm = event.target.value; render(); });
  document.getElementById("domain-form")?.addEventListener("submit", addExcludedDomain);
  document.getElementById("picker-form")?.addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    saveToFolder({ folderName: document.getElementById("picker-input").value }, form.dataset)
      .catch(() => showToast("Could not save this tab."));
  });
  document.getElementById("folder-rename-form")?.addEventListener("submit", event => {
    event.preventDefault();
    renameFolder(document.getElementById("folder-rename-input").value).catch(() => showToast("Could not rename this folder."));
  });
  document.getElementById("reminder-minutes")?.addEventListener("change", saveReminderTime);
  document.getElementById("show-tab-title")?.addEventListener("change", saveTabTitlePreference);
  document.getElementById("tab-reminder-minutes")?.addEventListener("change", saveTabReminderTime);
  document.getElementById("blink-toolbar-icon")?.addEventListener("change", event => {
    state.blinkToolbarIcon = event.target.checked;
    chrome.storage.local.set({ blinkToolbarIcon: state.blinkToolbarIcon });
  });
}

async function handleAction(button) {
  const { action, id, domain } = button.dataset;
  if (action === "select-workflow") { selectedWorkflowId = id; activeView = "related"; render(); }
  if (action === "open-saved-tab") await openSavedTab(button.dataset.url);
  if (action === "toggle-attention") {
    attentionExpanded = !attentionExpanded;
    writePreference("tabfino.attentionExpanded", String(attentionExpanded));
    render();
    document.querySelector(".attention-toggle")?.focus();
  }
  if (action === "edit-tab-note") { editingNoteTabId = Number(button.dataset.tabId); render(); document.getElementById("tab-note-input")?.focus(); }
  if (action === "save-tab-note") await saveTabNote(button);
  if (action === "cancel-tab-note") { editingNoteTabId = null; render(); }
  if (action === "back") { selectedWorkflowId = null; activeView = "recent"; render(); }
  if (action === "toggle-memory") await toggleMemory();
  if (action === "toggle-reminders") await toggleReminders();
  if (action === "test-reminder") await testReminder();
  if (action === "resume-return") await goToLastTab(id);
  if (action === "dismiss-return") await dismissReturnHighlight();
  if (action === "capture") await captureNow();
  if (action === "continue") await continueWorkflow(id);
  if (action === "delete-workflow") await deleteWorkflow(id);
  if (action === "clear-data") await clearData();
  if (action === "remove-domain") await removeDomain(domain);
  if (action === "tab-go") await goToWatchedTab(Number(button.dataset.tabId));
  if (action === "tab-snooze") await runTabReminderOp({ kind: "snooze", tabId: Number(button.dataset.tabId) }, "Snoozed for 10 minutes.");
  if (action === "tab-done") await runTabReminderOp({ kind: "done", tabId: Number(button.dataset.tabId) }, "Marked done. No more reminders for this tab.");
  if (action === "remind-current") await remindAboutCurrentTab();
  if (action === "toggle-tab-reminders") await toggleTabReminders();
  if (action === "select-folder") { selectedFolderId = id; activeView = "folder"; renamingFolder = false; confirmDeleteFolderId = null; render(); }
  if (action === "pick-folder") { pickerUrl = pickerUrl === button.dataset.url ? null : button.dataset.url; render(); document.getElementById("picker-input")?.focus(); }
  if (action === "save-to-folder") await saveToFolder({ folderId: id }, button.dataset);
  if (action === "remove-folder-item") await runFolderOp({ kind: "remove-item", folderId: id, url: button.dataset.url }, "Removed from the folder.");
  if (action === "edit-folder-note") { editingFolderNote = button.dataset.url; render(); document.getElementById("folder-note-input")?.focus(); }
  if (action === "cancel-folder-note") { editingFolderNote = null; render(); }
  if (action === "save-folder-note") await saveFolderNote(button);
  if (action === "rename-folder") { renamingFolder = true; render(); document.getElementById("folder-rename-input")?.focus(); }
  if (action === "cancel-rename") { renamingFolder = false; render(); }
  if (action === "ask-delete-folder") { confirmDeleteFolderId = confirmDeleteFolderId === id ? null : id; render(); }
  if (action === "cancel-delete-folder") { confirmDeleteFolderId = null; render(); }
  if (action === "delete-folder") await deleteFolder(id);
  if (action === "open-folder") await openFolder(id);
  if (action === "toggle-floating-button") await toggleFloatingButton();
  if (action === "clear-folders") await clearFolders();
}

async function startOnboarding() {
  const granted = await chrome.permissions.request({ permissions: ["tabs"] });
  if (!granted) { showToast("Tab access was not granted. Tabfino did not capture anything."); return; }
  state.onboardingComplete = true;
  state.trackingEnabled = true;
  await chrome.storage.local.set({ onboardingComplete: true, trackingEnabled: true });
  render();
  await captureNow(true);
}

async function toggleMemory() {
  if (state.trackingEnabled) {
    state.trackingEnabled = false;
    await chrome.storage.local.set({ trackingEnabled: false });
    await clearReturnState();
    showToast("Memory paused. Existing saved workflows remain on this device.");
  } else {
    // Call request() first: an earlier await can drop the user gesture Chrome
    // requires. It resolves true right away if access is already granted.
    const granted = await chrome.permissions.request({ permissions: ["tabs"] }).catch(() => false);
    if (!granted) { showToast("Tab access is needed to save browser context."); return; }
    state.trackingEnabled = true;
    await chrome.storage.local.set({ trackingEnabled: true });
    await captureNow(true);
    showToast("Memory resumed.");
  }
  render();
}

async function toggleReminders() {
  if (state.idleRemindersEnabled) {
    state.idleRemindersEnabled = false;
    await chrome.storage.local.set({ idleRemindersEnabled: false });
    await clearReturnState();
    await chrome.runtime.sendMessage({ type: "CONFIGURE_REMINDERS" }).catch(() => undefined);
    showToast("Turned off. You won't be reminded when you come back.");
  } else {
    const granted = await chrome.permissions.request({ permissions: ["idle", "notifications"] });
    if (!granted) { showToast("Tabfino needs permission to send notifications for this."); return; }
    state.idleRemindersEnabled = true;
    await chrome.storage.local.set({ idleRemindersEnabled: true });
    await chrome.runtime.sendMessage({ type: "CONFIGURE_REMINDERS" }).catch(() => undefined);
    showToast(`On. After ${state.reminderMinutes} minutes away, you'll see where you left off.`);
  }
  render();
}

async function saveReminderTime(event) {
  state.reminderMinutes = Number(event.target.value) || 10;
  await chrome.storage.local.set({ reminderMinutes: state.reminderMinutes });
  if (state.idleRemindersEnabled) await chrome.runtime.sendMessage({ type: "CONFIGURE_REMINDERS" }).catch(() => undefined);
  showToast(`You now count as away after ${state.reminderMinutes} minutes.`);
}

async function saveTabTitlePreference(event) {
  state.showTabTitleInReturnAlert = event.target.checked;
  await chrome.storage.local.set({ showTabTitleInReturnAlert: state.showTabTitleInReturnAlert });
}

async function testReminder() {
  if (window.TABFINO_PREVIEW) { showToast("Preview only: a system notification would appear here."); return; }
  const result = await chrome.runtime.sendMessage({ type: "TEST_REMINDER" }).catch(error => ({ ok: false, error: error?.message }));
  showToast(result?.ok ? "Test reminder sent." : result?.error ? `Could not send reminder: ${result.error}` : "Could not send a reminder. Check Chrome notification settings.");
}

async function captureNow(silent = false) {
  if (!state.trackingEnabled) { if (!silent) showToast("Resume memory in Settings first."); return; }
  const win = await chrome.windows.getLastFocused().catch(() => null);
  const response = await chrome.runtime.sendMessage({ type: "CAPTURE_NOW", windowId: win?.id }).catch(error => ({ ok: false, error: error?.message }));
  await loadState();
  if (!silent) showToast(response?.ok && response.result?.tabCount ? `Saved ${response.result.tabCount} tabs on this device.` : "No eligible browser tabs to save.");
}

async function openSavedTab(url) {
  const safeUrl = safeWebUrl(url);
  if (!safeUrl) { showToast("Only valid web pages can be opened from saved work."); return; }
  try {
    if (window.TABFINO_PREVIEW) {
      const openedWindow = window.open(safeUrl, "_blank", "noopener,noreferrer");
      if (!openedWindow) { showToast("Allow pop-ups to open this saved tab."); return; }
    } else {
      // A tab reopened from the closed list is usually gone, but not always —
      // you may have reopened it yourself since. Focus it rather than opening
      // a second copy.
      if (!await focusOrOpenTab(safeUrl)) { showToast("Could not open this saved tab. Try again."); return; }
      showToast("Opened this saved tab.");
      return;
    }
    showToast("Opened this tab in a new browser tab.");
  } catch {
    showToast("Could not open this saved tab. Try again.");
  }
}

// Switch to an open tab showing this URL, or open it if none is. Returns
// whether a tab ended up active.
//
// This used to pass the saved URL straight to `chrome.tabs.query({ url })`,
// which takes a match pattern rather than a URL — any address with a query
// string was rejected, the error was swallowed, and a duplicate tab opened
// even though the page was already in front of the user. It now shares the
// single restore path, which matches against the tab list itself.
async function focusOrOpenTab(url) {
  const result = await restoreUrls([url], url);
  return result.opened + result.reused > 0;
}

// Two saved URLs can point at the same open tab: Chrome treats a fragment as
// the same document, "/" and "" as the same path, and the scheme and host as
// case-insensitive. The query string is kept, because that usually does
// identify a different page.
function tabMatchKey(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${path}${parsed.search}`;
  } catch {
    return url;
  }
}

// Reopens a set of saved URLs without duplicating what is already open:
// restoring twice in a row now lands you in the same place rather than
// doubling the workspace. `activeUrl` is the one left focused at the end.
//
// Restoration happens in the window you are in, by design. Tabfino does not
// rebuild the original window layout: the window a workflow was captured in
// often no longer exists, and moving your current tabs around to recreate it
// would cost more than the clutter it saves. Reusing open tabs is what keeps
// that honest — a tab already sitting in another window is focused where it
// is instead of being copied into this one.
async function restoreUrls(urls, activeUrl) {
  const unique = [...new Set(urls.filter(Boolean))];
  if (!unique.length) return { opened: 0, reused: 0, failed: 0, total: 0 };
  const target = activeUrl && unique.includes(activeUrl) ? activeUrl : unique[0];

  // Without the tabs permission Chrome withholds `url`, so nothing matches and
  // this falls back to opening everything — the behaviour before the match.
  const canQuery = typeof chrome?.tabs?.query === "function";
  const openTabs = canQuery ? await chrome.tabs.query({}).catch(() => []) : [];
  const byKey = new Map();
  for (const tab of openTabs) {
    if (!Number.isInteger(tab.id) || typeof tab.url !== "string") continue;
    const key = tabMatchKey(tab.url);
    if (!byKey.has(key)) byKey.set(key, tab);
  }
  const currentWindow = typeof chrome?.windows?.getCurrent === "function"
    ? await chrome.windows.getCurrent().catch(() => null)
    : null;

  let opened = 0;
  let reused = 0;
  let failed = 0;
  // The focused one goes last, so opening the rest can't pull focus off it.
  for (const url of [...unique.filter(item => item !== target), target]) {
    const isTarget = url === target;
    const existing = byKey.get(tabMatchKey(url));
    if (existing) {
      // Tabs that are already open are left where they are; only the one being
      // resumed is brought to the front.
      if (!isTarget) { reused += 1; continue; }
      try {
        await chrome.tabs.update(existing.id, { active: true });
        await chrome.windows.update(existing.windowId, { focused: true }).catch(() => undefined);
        reused += 1;
        continue;
      } catch { /* It closed between the query and now; open it below. */ }
    }
    try {
      await chrome.tabs.create({ url, active: isTarget, ...(Number.isInteger(currentWindow?.id) ? { windowId: currentWindow.id } : {}) });
      opened += 1;
    } catch {
      failed += 1;
    }
  }
  return { opened, reused, failed, total: unique.length };
}

function restoreToast(result, noun = "saved tab") {
  const plural = count => `${count} ${noun}${count === 1 ? "" : "s"}`;
  if (result.failed) return `Opened ${result.opened} of ${plural(result.total)}.`;
  if (result.reused && result.opened) return `Reopened ${plural(result.opened)} — ${result.reused} ${result.reused === 1 ? "was" : "were"} already open.`;
  if (result.reused) return result.reused === 1 ? "That tab was already open." : `All ${result.reused} were already open.`;
  return `Reopened ${plural(result.opened)}.`;
}

// The service worker owns `workflows`: it applies every change in the same
// queue as tab captures, so an edit here can't erase a capture (or vice versa).
// The panel redraws from chrome.storage.onChanged once the write lands.
async function runWorkflowOp(op) {
  const response = await chrome.runtime.sendMessage({ type: "WORKFLOW_OP", op })
    .catch(error => ({ ok: false, error: error?.message }));
  if (!response?.ok) {
    showToast(`Could not update saved work${response?.error ? `: ${response.error}` : "."}`);
    return false;
  }
  await loadState();
  return true;
}

// Folders go through the worker like everything else, so a save made here
// and one made from the in-page button cannot overwrite each other.
async function runFolderOp(op, successMessage) {
  const response = await chrome.runtime.sendMessage({ type: "FOLDER_OP", op })
    .catch(error => ({ ok: false, error: error?.message }));
  if (!response?.ok) {
    // These errors are written to be read: "that folder is full", "that site
    // is on your private list". Showing them is the point.
    showToast(response?.error || "Could not update your folders.");
    return null;
  }
  await loadState();
  if (successMessage) showToast(successMessage);
  return response.result;
}

async function saveToFolder(choice, item) {
  const result = await runFolderOp({
    kind: "save-item",
    ...choice,
    item: { url: item.url, title: item.title, hostname: item.hostname }
  });
  if (!result) return;
  // The picker stays open. It now shows a tick beside the folder, which is
  // the confirmation; closing it would pull the rest of the list up under
  // the pointer, and you may well want to file the page in a second folder.
  render();
  showToast(`Saved to ${result.folderName}. It stays until you remove it.`);
}

async function saveFolderNote(button) {
  const note = document.getElementById("folder-note-input")?.value.trim() || "";
  const saved = await runFolderOp({ kind: "set-item-note", folderId: button.dataset.id, url: button.dataset.url, note }, note ? "Note saved on this device." : "Note removed.");
  if (!saved) return;
  editingFolderNote = null;
  render();
}

async function renameFolder(name) {
  if (!await runFolderOp({ kind: "rename-folder", folderId: selectedFolderId, name })) return;
  renamingFolder = false;
  render();
  showToast("Folder renamed.");
}

// Reached only from the inline confirmation, so there is no dialog here: the
// question was already asked in the row, where the person could still see
// which folder they were about to lose.
async function deleteFolder(id) {
  const folder = state.folders.find(item => item.id === id);
  confirmDeleteFolderId = null;
  if (!folder) { render(); return; }
  const name = folder.name;
  if (!await runFolderOp({ kind: "delete-folder", folderId: id })) { render(); return; }
  // Deleting from the list leaves you in the list; only deleting the folder
  // you are standing in sends you back.
  if (selectedFolderId === id) { selectedFolderId = null; activeView = "recent"; }
  render();
  showToast(`“${name}” was deleted from this device.`);
}

async function openFolder(id) {
  const folder = state.folders.find(item => item.id === id);
  const urls = (folder?.items || []).map(item => safeWebUrl(item.url)).filter(Boolean);
  if (!urls.length) return;
  showToast(restoreToast(await restoreUrls(urls, urls[urls.length - 1])));
}

async function clearFolders() {
  const count = Tabfino.folderItemCount(state.folders);
  if (!count && !state.folders.length) { showToast("You have no folders yet."); return; }
  if (!confirm(`Delete every folder and the ${count} tab${count === 1 ? "" : "s"} saved in them? This cannot be undone.`)) return;
  if (!await runFolderOp({ kind: "clear-folders" })) return;
  selectedFolderId = null;
  activeView = "settings";
  render();
  showToast("All folders were deleted.");
}

// The in-page button is the only feature that needs access to the pages you
// visit, so it asks for that access at the moment you turn it on, and the
// worker unregisters the script the moment you turn it off.
async function toggleFloatingButton() {
  if (state.floatingButtonEnabled) {
    state.floatingButtonEnabled = false;
    await chrome.storage.local.set({ floatingButtonEnabled: false });
    const response = await configureFloatingButton();
    // Keeping the permission after turning the feature off would leave access
    // granted for nothing, so it goes back too.
    await chrome.permissions.remove({ permissions: ["scripting"], origins: PAGE_ORIGINS }).catch(() => undefined);
    const cleared = response?.result?.tabs || 0;
    showToast(cleared
      ? `Turned off, and taken off ${cleared} open tab${cleared === 1 ? "" : "s"}.`
      : "Turned off. Tabfino no longer runs on any page.");
  } else {
    // request() first: an earlier await can cost the user gesture Chrome wants.
    const granted = await chrome.permissions.request({ permissions: ["scripting"], origins: PAGE_ORIGINS }).catch(() => false);
    if (!granted) { showToast("The in-page button needs access to the pages you visit."); return; }
    state.floatingButtonEnabled = true;
    await chrome.storage.local.set({ floatingButtonEnabled: true });
    const response = await configureFloatingButton();
    if (!response?.ok) {
      // A switch that silently does nothing is worse than one that says why,
      // so a failure here turns itself back off rather than looking enabled.
      state.floatingButtonEnabled = false;
      await chrome.storage.local.set({ floatingButtonEnabled: false });
      showToast(response?.error || "Could not turn the in-page button on.");
      render();
      return;
    }
    const reached = response.result?.tabs || 0;
    showToast(reached
      ? `On. The button is on ${reached} open tab${reached === 1 ? "" : "s"}, and every page you open from now on.`
      : "On. Open or reload a page to see the button on its right edge.");
  }
  render();
}

function configureFloatingButton() {
  return chrome.runtime.sendMessage({ type: "CONFIGURE_FLOATING_BUTTON" })
    .catch(error => ({ ok: false, error: error?.message }));
}

async function saveTabNote(button) {
  const input = document.getElementById("tab-note-input");
  const note = input?.value.trim() || "";
  const result = await runTabReminderOp({ kind: "set-note", tabId: Number(button.dataset.tabId), note }, note ? "Note saved on this device." : "Note removed.");
  if (!result) return;
  editingNoteTabId = null;
  render();
}

async function continueWorkflow(id) {
  const workflow = state.workflows.find(item => item.id === id);
  if (!workflow) return;
  // Only the tabs that were open: closed ones are reopened one at a time from
  // the Related view, so "Continue Work" restores the workspace rather than
  // every page the workflow ever touched.
  const tabs = (workflow.tabs || []).filter(Tabfino.isOpenTab).map(tab => ({ ...tab, url: safeWebUrl(tab?.url) })).filter(tab => tab.url);
  if (!tabs.length) { showToast("No valid web tabs were saved in this workflow."); return; }
  const lastActive = tabs.find(tab => tab.url === safeWebUrl(workflow.activeUrl)) || tabs[0];
  // Resuming the same workflow twice used to double the workspace; restoreUrls
  // focuses what is already open instead of opening a second copy of it.
  showToast(restoreToast(await restoreUrls(tabs.map(tab => tab.url), lastActive.url)));
}

async function goToLastTab(id) {
  const workflow = state.workflows.find(item => item.id === id);
  if (!workflow) return;
  const targetUrl = safeWebUrl(workflow.activeUrl) || safeWebUrl(workflow.tabs?.[0]?.url);
  if (!targetUrl) return;
  if (!await focusOrOpenTab(targetUrl)) { showToast("Could not reopen this tab. Try again."); return; }
  await dismissReturnHighlight();
  showToast("Returned to the last active tab.");
}

// The service worker recomputes the toolbar badge when this changes.
async function clearReturnState() {
  state.pendingReturn = null;
  await chrome.storage.local.set({ pendingReturn: null, lastReminderWindowId: null });
}

async function runTabReminderOp(op, successMessage) {
  const response = await chrome.runtime.sendMessage({ type: "TAB_REMINDER_OP", op })
    .catch(error => ({ ok: false, error: error?.message }));
  if (!response?.ok) {
    showToast(response?.error || "Could not update this reminder.");
    return null;
  }
  await loadState();
  if (successMessage) showToast(successMessage);
  return response.result;
}

async function remindAboutCurrentTab() {
  // Ask first, while the click still counts as a user gesture. Without
  // notifications the reminder still shows in this panel and on the badge.
  const canNotify = await chrome.permissions.request({ permissions: ["notifications"] }).catch(() => false);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  if (!tab) { showToast("Open the page you want a reminder for, then try again."); return; }
  const result = await runTabReminderOp({ kind: "remind", tabId: tab.id, minutes: tabReminderMinutes() });
  if (result) showToast(`I'll remind you about this tab in ${result.minutes} min${canNotify ? "" : " (in this panel; notifications are off)"}.`);
}

async function goToWatchedTab(tabId) {
  const record = state.tabWatch.tabs[tabId];
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true }).catch(() => undefined);
  } catch {
    // The tab was closed; reopen the page instead.
    const url = safeWebUrl(record?.url);
    if (!url || !await focusOrOpenTab(url)) { showToast("That tab is closed and couldn't be reopened."); return; }
  }
}

async function toggleTabReminders() {
  if (state.tabRemindersEnabled) {
    state.tabRemindersEnabled = false;
    await chrome.storage.local.set({ tabRemindersEnabled: false });
    showToast("Turned off. Reminders you set yourself still work.");
  } else {
    // idle lets Tabfino hold reminders while you're away from the device.
    const granted = await chrome.permissions.request({ permissions: ["notifications", "idle"] }).catch(() => false);
    if (!granted) { showToast("Tabfino needs permission to send notifications for this."); return; }
    state.tabRemindersEnabled = true;
    await chrome.storage.local.set({ tabRemindersEnabled: true });
    showToast(`On. You'll be nudged about tabs left for ${tabReminderMinutes()} minutes.`);
  }
  render();
}

async function saveTabReminderTime(event) {
  const minutes = Number(event.target.value);
  state.tabReminderMinutes = Tabfino.TAB_REMINDER_MINUTES.includes(minutes) ? minutes : DEFAULTS.tabReminderMinutes;
  await chrome.storage.local.set({ tabReminderMinutes: state.tabReminderMinutes });
  showToast(`You'll be nudged after a tab sits for ${state.tabReminderMinutes} minutes.`);
}

// Tells the worker the welcome-back card is on screen, so the toolbar badge
// can stand down. Keyed on `notifiedAt` so this fires once per alert however
// many times the panel redraws, and the DOM is checked rather than the state,
// because the card is only rendered on some views — being in Settings is not
// the same as having seen it.
let reportedReturnSeenAt = null;
async function reportReturnSeen() {
  const pending = state.pendingReturn;
  if (!pending?.notifiedAt || pending.seenAt) return;
  if (reportedReturnSeenAt === pending.notifiedAt) return;
  if (!app.querySelector('[data-action="resume-return"]')) return;
  reportedReturnSeenAt = pending.notifiedAt;
  if (typeof chrome?.runtime?.sendMessage !== "function") return;
  await chrome.runtime.sendMessage({ type: "MARK_RETURN_SEEN", notifiedAt: pending.notifiedAt }).catch(() => undefined);
}

async function dismissReturnHighlight() {
  await clearReturnState();
  render();
}

async function deleteWorkflow(id) {
  if (!await runWorkflowOp({ kind: "delete-workflow", workflowId: id })) return;
  selectedWorkflowId = null; activeView = "recent";
  render(); showToast("Workflow removed from this device.");
}

async function clearData() {
  if (!confirm("Delete every saved workflow from this device? This cannot be undone.")) return;
  await clearReturnState();
  if (!await runWorkflowOp({ kind: "clear-all" })) return;
  selectedWorkflowId = null; activeView = "recent";
  render(); showToast("All saved work was deleted.");
}

async function addExcludedDomain(event) {
  event.preventDefault();
  const input = document.getElementById("domain-input");
  const domain = Tabfino.parseDomainInput(input.value);
  if (!domain) { showToast("Enter a valid domain, such as example.com."); return; }
  // Excluding a site removes what is already saved from it, folders included.
  // Deleting something you filed by hand without saying so would be the kind
  // of quiet surprise this product exists to avoid.
  const keptHere = (state.folders || []).reduce((total, folder) => total + folder.items.filter(item => Tabfino.isExcludedHost(item.hostname, [domain])).length, 0);
  if (!await runWorkflowOp({ kind: "exclude-domain", domain })) return;
  document.getElementById("domain-input").value = "";
  render();
  showToast(keptHere
    ? `${domain} added to private sites. ${keptHere} saved tab${keptHere === 1 ? "" : "s"} removed from your folders.`
    : `${domain} added to private sites.`);
}

async function removeDomain(domain) {
  if (!await runWorkflowOp({ kind: "include-domain", domain })) return;
  showToast(`${domain} removed from private sites.`);
}

function showToast(message) {
  clearTimeout(toastTimer);
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast"; toast.setAttribute("role","status"); toast.textContent = message;
  document.body.append(toast);
  toastTimer = setTimeout(() => toast.remove(), 2600);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.onboardingComplete || changes.workflows || changes.trackingEnabled || changes.idleRemindersEnabled || changes.reminderMinutes || changes.showTabTitleInReturnAlert || changes.excludedDomains || changes.pendingReturn || changes.tabWatch || changes.tabRemindersEnabled || changes.tabReminderMinutes || changes.folders || changes.floatingButtonEnabled)) loadState();
});

loadState();
