/*
  12-Step Companion
  Pause • Think • Choose — V1.0
  CBT-informed recovery skills patch

  Install:
  Add this script AFTER the existing Daily Check-In script in index.html:
  <script src="pause-think-choose-v1.js"></script>

  This patch is designed for the current V4.3 Beta structure.
  It stores PTC sessions locally in data.pauseThinkChoose and does not
  require a backend.
*/
(function () {
  "use strict";

  const STORAGE_VERSION = "1.0";
  const DISTORTIONS = [
    ["All-or-nothing thinking", "Seeing things as completely good or completely bad."],
    ["Overgeneralizing", "Turning one difficult event into a rule about everything."],
    ["Catastrophizing", "Assuming the worst possible outcome is inevitable."],
    ["Mind reading", "Assuming you know what another person is thinking."],
    ["Fortune telling", "Treating a feared future outcome as if it is certain."],
    ["Emotional reasoning", "Treating a feeling as proof that a thought is true."],
    ["Should statements", "Using rigid rules about what you or others must do."],
    ["Labeling", "Turning one behavior or mistake into a judgment about yourself."],
    ["Mental filter", "Focusing on one negative part while overlooking the rest."],
    ["Personalization", "Taking excessive responsibility for things outside your control."]
  ];

  const HEALTHY_ACTIONS = {
    connection: [
      ["Contact my sponsor", "Reach out to your sponsor or another trusted recovery support."],
      ["Talk to someone", "Choose a safe person and let them know you're having a hard moment."]
    ],
    recovery: [
      ["Find a meeting", "Connect with a recovery meeting instead of facing the moment alone."],
      ["Work a Step", "Spend a few minutes on the Step work that fits what you're facing."]
    ],
    reset: [
      ["Change my environment", "Step away from the situation or place that is increasing the urge."],
      ["Take a walk", "Move your body and give yourself a short reset."]
    ],
    calm: [
      ["Slow breathing", "Take several slow breaths and focus on the present moment."],
      ["Ground myself", "Notice what you can see, hear, feel, and control right now."]
    ],
    growth: [
      ["Practice instead of judge", "Choose one small skill you can practice today."],
      ["Ask for help learning", "Identify one person, resource, or action that can help you improve."]
    ]
  };

  function getData() {
    if (!window.data) return null;
    data.pauseThinkChoose = data.pauseThinkChoose || {
      version: STORAGE_VERSION,
      sessions: [],
      actionHistory: []
    };
    data.pauseThinkChoose.sessions = Array.isArray(data.pauseThinkChoose.sessions)
      ? data.pauseThinkChoose.sessions : [];
    data.pauseThinkChoose.actionHistory = Array.isArray(data.pauseThinkChoose.actionHistory)
      ? data.pauseThinkChoose.actionHistory : [];
    return data.pauseThinkChoose;
  }

  function saveData() {
    if (typeof window.save === "function") {
      window.save();
    } else if (window.data) {
      localStorage.setItem("tsc-v43", JSON.stringify(window.data));
    }
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function addStyles() {
    if (document.getElementById("ptcStyles")) return;
    const style = document.createElement("style");
    style.id = "ptcStyles";
    style.textContent = `
      .ptc-card{margin-top:14px;background:var(--card);border:1px solid var(--border);border-radius:18px;padding:16px}
      .ptc-title{font-size:1.35rem;font-weight:800;margin:0 0 5px}
      .ptc-step{display:flex;gap:10px;align-items:flex-start;margin-top:12px}
      .ptc-number{width:34px;height:34px;min-width:34px;border-radius:10px;background:#17365f;display:grid;place-items:center;font-weight:800}
      .ptc-step-body{flex:1}
      .ptc-step-body strong{display:block;margin-bottom:3px}
      .ptc-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:10px}
      .ptc-choice{min-height:48px;text-align:left}
      .ptc-choice.selected{outline:2px solid var(--accent);background:#17365f}
      .ptc-actions{display:grid;gap:9px;margin-top:10px}
      .ptc-action{text-align:left}
      .ptc-help{font-size:.8rem;color:var(--muted);line-height:1.5}
      .ptc-divider{height:1px;background:var(--border);margin:16px 0}
      .ptc-result{margin-top:12px;padding:14px;border:1px solid var(--border);border-radius:14px;background:#102c4e}
      .ptc-chip{display:inline-block;margin:3px 4px 3px 0;padding:5px 9px;border-radius:999px;background:#17365f;color:#cce3ff;font-size:.72rem}
      .ptc-pattern{margin-top:12px;padding:12px;border-left:3px solid var(--accent);background:rgba(78,154,247,.08);border-radius:0 12px 12px 0}
      @media(max-width:500px){.ptc-choice-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function currentContext() {
    const mood = document.getElementById("v43Mood")?.value || "";
    const mind = document.getElementById("v43Mind")?.value || "";
    const trigger = document.getElementById("v43Trigger")?.value || "";
    const triggerType = document.getElementById("v43TriggerType")?.value || "";
    const intensity = Number(document.getElementById("v43Intensity")?.value || 0);
    return { mood, mind, trigger, triggerType, intensity };
  }

  function existingCheckinRecord() {
    const d = window.data && Array.isArray(data.checkins) ? data.checkins : [];
    if (!d.length) return null;
    return d[0];
  }

  function createCard() {
    const card = document.createElement("div");
    card.className = "ptc-card";
    card.id = "ptcCard";
    card.innerHTML = `
      <div class="ptc-title">Pause • Think • Choose</div>
      <p class="sub">A simple way to slow down, understand what is happening, and choose your next healthy action.</p>

      <div class="ptc-step">
        <div class="ptc-number">1</div>
        <div class="ptc-step-body">
          <strong>PAUSE</strong>
          <div class="ptc-help">What is happening right now? Name the moment without judging yourself.</div>
          <div class="field">
            <label>What am I experiencing?</label>
            <textarea id="ptcPause" placeholder="Example: I'm overwhelmed after an argument and my urge is getting stronger."></textarea>
          </div>
        </div>
      </div>

      <div class="ptc-step">
        <div class="ptc-number">2</div>
        <div class="ptc-step-body">
          <strong>THINK</strong>
          <div class="ptc-help">What thought is connected to this feeling?</div>
          <div class="field">
            <label>What am I telling myself?</label>
            <textarea id="ptcThought" placeholder="Example: I can't handle this. I'm never going to get better."></textarea>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:12px;background:var(--card2)">
        <strong>Try a thought reframe</strong>
        <p class="sub">You do not have to pretend everything is okay. The goal is to make the thought more accurate and useful.</p>
        <div class="ptc-choice-grid">
          <button class="btn ptc-choice" id="ptcRightNowBtn" onclick="window.ptcUseRightNow()">RIGHT NOW</button>
          <button class="btn ptc-choice" id="ptcYetBtn" onclick="window.ptcUseYet()">YET</button>
        </div>
        <div class="field">
          <label>Balanced thought</label>
          <textarea id="ptcBalanced" placeholder="Write a more balanced thought here."></textarea>
        </div>
      </div>

      <div class="ptc-step">
        <div class="ptc-number">3</div>
        <div class="ptc-step-body">
          <strong>CHOOSE</strong>
          <div class="ptc-help">What is one healthy thing you can do next?</div>
          <div id="ptcActions" class="ptc-actions"></div>
        </div>
      </div>

      <div class="ptc-result" id="ptcResult" style="display:none"></div>
      <button class="btn primary" style="margin-top:12px" onclick="window.ptcComplete()">Complete Pause • Think • Choose</button>
    `;
    return card;
  }

  function renderActions() {
    const holder = document.getElementById("ptcActions");
    if (!holder) return;
    const ctx = currentContext();

    let groups = ["connection", "recovery", "reset", "calm", "growth"];
    if (ctx.triggerType === "Loneliness" || ctx.mind === "Lonely") {
      groups = ["connection", "recovery", "reset", "calm"];
    } else if (ctx.triggerType === "Cravings" || ctx.triggerType === "Being around alcohol/drugs" || ctx.intensity >= 7) {
      groups = ["connection", "recovery", "reset", "calm"];
    } else if (ctx.mind === "Anxious" || ctx.mind === "Overwhelmed" || ctx.mind === "Restless") {
      groups = ["calm", "reset", "connection", "recovery"];
    } else if (ctx.mind === "Discouraged" || ctx.mood === "Low") {
      groups = ["growth", "connection", "reset", "recovery"];
    }

    const unique = [];
    groups.forEach(function (group) {
      (HEALTHY_ACTIONS[group] || []).forEach(function (item) {
        if (!unique.some(x => x[0] === item[0])) unique.push(item);
      });
    });

    holder.innerHTML = unique.slice(0, 6).map(function (item, index) {
      return `<button class="btn ptc-action" data-ptc-action="${esc(item[0])}" onclick="window.ptcSelectAction(this)">
        <strong>${esc(item[0])}</strong><br><span class="ptc-help">${esc(item[1])}</span>
      </button>`;
    }).join("");
  }

  function mount() {
    if (!window.data) return;
    addStyles();
    getData();

    const section = document.getElementById("checkin");
    if (!section) return;

    if (!document.getElementById("ptcCard")) {
      const card = createCard();
      section.appendChild(card);
    }
    renderActions();
  }

  function readFields() {
    return {
      pause: document.getElementById("ptcPause")?.value.trim() || "",
      thought: document.getElementById("ptcThought")?.value.trim() || "",
      balancedThought: document.getElementById("ptcBalanced")?.value.trim() || "",
      reframe: document.querySelector(".ptc-choice.selected")?.dataset?.reframe || "",
      action: document.querySelector(".ptc-action.selected")?.dataset?.ptcAction || ""
    };
  }

  function setBalanced(text, type) {
    const input = document.getElementById("ptcBalanced");
    if (!input) return;
    input.value = text;
    document.querySelectorAll(".ptc-choice").forEach(function (b) { b.classList.remove("selected"); });
    const btn = type === "yet" ? document.getElementById("ptcYetBtn") : document.getElementById("ptcRightNowBtn");
    if (btn) {
      btn.classList.add("selected");
      btn.dataset.reframe = type;
    }
  }

  window.ptcUseRightNow = function () {
    const thought = document.getElementById("ptcThought")?.value.trim() || "";
    if (!thought) {
      if (typeof window.toast === "function") window.toast("Write the thought first.");
      return;
    }
    let text = thought;
    if (/^i('|’)m\s+/i.test(thought)) {
      text = thought.replace(/^i('|’)m\s+/i, "I'm having a hard time with ") + " right now.";
    } else {
      text = "I'm having the thought: " + thought.replace(/[.!?]*$/, "") +
        " right now. This is a moment I'm experiencing, not a permanent prediction.";
    }
    setBalanced(text, "right_now");
  };

  window.ptcUseYet = function () {
    const thought = document.getElementById("ptcThought")?.value.trim() || "";
    if (!thought) {
      if (typeof window.toast === "function") window.toast("Write the thought first.");
      return;
    }

    let text = thought.replace(/[.!?]*$/, "");
    if (/\b(can't|cannot)\b/i.test(text)) {
      text = text.replace(/\b(can't|cannot)\b/i, "can't yet");
    } else if (/\b(not good at|don't know how to|haven't learned)\b/i.test(text)) {
      text = text + " yet";
    } else if (/\b(always|never)\b/i.test(text)) {
      text = "This is something I'm struggling with right now, and I can learn a different way to respond.";
    } else {
      text = text + " yet — I can keep learning, growing, and practicing.";
    }
    setBalanced(text, "yet");
  };

  window.ptcSelectAction = function (button) {
    document.querySelectorAll(".ptc-action").forEach(function (b) { b.classList.remove("selected"); });
    button.classList.add("selected");
  };

  window.ptcComplete = function () {
    const fields = readFields();
    if (!fields.thought) {
      if (typeof window.toast === "function") window.toast("Identify the thought first.");
      return;
    }
    if (!fields.balancedThought) {
      if (typeof window.toast === "function") window.toast("Add a balanced thought.");
      return;
    }
    if (!fields.action) {
      if (typeof window.toast === "function") window.toast("Choose one healthy action.");
      return;
    }

    const ctx = currentContext();
    const session = {
      id: "ptc-" + Date.now(),
      date: new Date().toISOString(),
      version: STORAGE_VERSION,
      context: ctx,
      pause: fields.pause,
      thought: fields.thought,
      balancedThought: fields.balancedThought,
      reframe: fields.reframe,
      action: fields.action,
      completed: true
    };

    const ptc = getData();
    if (!ptc) return;
    ptc.sessions.unshift(session);
    ptc.actionHistory.unshift({
      date: session.date,
      action: fields.action,
      triggerType: ctx.triggerType,
      mood: ctx.mood,
      intensity: ctx.intensity
    });
    ptc.sessions = ptc.sessions.slice(0, 100);
    ptc.actionHistory = ptc.actionHistory.slice(0, 200);

    const latestCheckin = existingCheckinRecord();
    if (latestCheckin) {
      latestCheckin.pauseThinkChoose = {
        sessionId: session.id,
        thought: fields.thought,
        balancedThought: fields.balancedThought,
        reframe: fields.reframe,
        action: fields.action
      };
    }

    saveData();

    const result = document.getElementById("ptcResult");
    if (result) {
      result.style.display = "block";
      result.innerHTML = `
        <strong>Good work.</strong>
        <p class="sub">You paused instead of reacting, examined the thought, and chose a healthy next action.</p>
        <div class="ptc-pattern"><strong>Your next step:</strong><br>${esc(fields.action)}</div>
      `;
    }

    updateHomeRecoveryStats();
    if (typeof window.toast === "function") window.toast("Pause • Think • Choose saved");
  };


  function renderHomeRecoveryCard() {
    if (!window.data) return;
    const home = document.getElementById("home");
    if (!home || document.getElementById("ptcHomeCard")) return;

    const card = document.createElement("div");
    card.id = "ptcHomeCard";
    card.className = "card";
    card.style.marginTop = "14px";
    card.innerHTML = `
      <strong>Pause • Think • Choose</strong>
      <p class="sub">When a difficult moment shows up, slow it down before it becomes a pattern.</p>
      <div id="ptcHomeStats" class="ptc-help"></div>
      <div class="row" style="margin-top:10px">
        <button class="btn primary" onclick="window.ptcOpen()">Use Pause • Think • Choose</button>
        <button class="btn" onclick="window.ptcInsights()">Recovery Patterns</button>
      </div>
    `;
    const target = home.querySelector(".grid");
    if (target) target.insertAdjacentElement("afterend", card);
    else home.appendChild(card);
    updateHomeRecoveryStats();
  }

  function updateHomeRecoveryStats() {
    const el = document.getElementById("ptcHomeStats");
    const ptc = getData();
    if (!el || !ptc) return;
    const count = ptc.sessions.length;
    const actions = {};
    ptc.actionHistory.forEach(function (x) {
      if (x.action) actions[x.action] = (actions[x.action] || 0) + 1;
    });
    const top = Object.keys(actions).sort(function(a,b){ return actions[b] - actions[a]; }).slice(0,2);
    el.innerHTML = count
      ? `${count} completed exercise${count === 1 ? "" : "s"} logged` +
        (top.length ? ` • Most used healthy action${top.length > 1 ? "s" : ""}: ${top.map(esc).join(", ")}` : "")
      : "No Pause • Think • Choose exercises logged yet.";
  }

  window.ptcOpen = function () {
    if (typeof window.startDailyCheckIn === "function") {
      window.startDailyCheckIn();
    } else if (typeof window.show === "function") {
      window.show("checkin");
      setTimeout(mount, 0);
    }
  };

  window.ptcInsights = function () {
    const ptc = getData();
    if (!ptc) return;
    const actions = {};
    const triggers = {};
    ptc.actionHistory.forEach(function (x) {
      if (x.action) actions[x.action] = (actions[x.action] || 0) + 1;
      if (x.triggerType) triggers[x.triggerType] = (triggers[x.triggerType] || 0) + 1;
    });

    const topActions = Object.keys(actions).sort(function(a,b){ return actions[b] - actions[a]; }).slice(0,4);
    const topTriggers = Object.keys(triggers).sort(function(a,b){ return triggers[b] - triggers[a]; }).slice(0,4);

    const overlay = document.createElement("div");
    overlay.id = "ptcInsightsOverlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:100;padding:18px;overflow:auto";
    overlay.innerHTML = `
      <div class="card" style="max-width:760px;margin:20px auto">
        <div class="row" style="justify-content:space-between;align-items:center">
          <h2 class="h2" style="margin:0">Recovery Patterns</h2>
          <button class="btn" onclick="document.getElementById('ptcInsightsOverlay')?.remove()">Close</button>
        </div>
        <p class="sub">These are patterns from your own Pause • Think • Choose exercises. They are not a diagnosis.</p>
        <div class="ptc-divider"></div>
        <strong>Healthy actions you've practiced</strong>
        <p class="sub">${topActions.length ? topActions.map(function(a){ return `<span class="ptc-chip">${esc(a)} • ${actions[a]}</span>`; }).join("") : "Complete an exercise to start building your personal action history."}</p>
        <div class="ptc-divider"></div>
        <strong>Triggers you've logged</strong>
        <p class="sub">${topTriggers.length ? topTriggers.map(function(t){ return `<span class="ptc-chip">${esc(t)} • ${triggers[t]}</span>`; }).join("") : "Your trigger patterns will appear here as you use the tool."}</p>
        <div class="ptc-pattern">
          <strong>Remember:</strong><br>
          A pattern is information, not a prediction. The goal is to notice what happens and practice a healthier response.
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  };

  function patchStart() {
    const original = window.startDailyCheckIn;
    if (typeof original === "function" && !original.__ptcWrapped) {
      const wrapped = function () {
        original.apply(this, arguments);
        setTimeout(mount, 0);
      };
      wrapped.__ptcWrapped = true;
      window.startDailyCheckIn = wrapped;
    }
  }

  function patchSave() {
    const original = window.v43Save;
    if (typeof original === "function" && !original.__ptcWrapped) {
      const wrapped = function () {
        const before = existingCheckinRecord();
        original.apply(this, arguments);
        const after = existingCheckinRecord();
        // If the user completed PTC before saving the check-in, the PTC session
        // already stores its own copy. This bridge keeps the latest check-in linked.
        if (after && after !== before) {
          const latest = getData()?.sessions?.[0];
          if (latest && new Date(latest.date).getTime() >= Date.now() - 120000) {
            after.pauseThinkChoose = {
              sessionId: latest.id,
              thought: latest.thought,
              balancedThought: latest.balancedThought,
              reframe: latest.reframe,
              action: latest.action
            };
            saveData();
          }
        }
      };
      wrapped.__ptcWrapped = true;
      window.v43Save = wrapped;
    }
  }

  function observeCheckin() {
    const section = document.getElementById("checkin");
    if (!section || section.__ptcObserver) return;
    const observer = new MutationObserver(function () {
      if (document.getElementById("checkin") && !document.getElementById("ptcCard")) {
        setTimeout(mount, 0);
      }
    });
    observer.observe(section, { childList: true, subtree: false });
    section.__ptcObserver = observer;
  }

  function init() {
    if (!window.data) {
      setTimeout(init, 50);
      return;
    }
    addStyles();
    getData();
    patchStart();
    patchSave();
    mount();
    renderHomeRecoveryCard();
    updateHomeRecoveryStats();
    observeCheckin();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
