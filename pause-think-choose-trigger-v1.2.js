/*
  12-Step Companion
  Pause • Think • Choose — Trigger Integration V1.2
  Connects V4.3 Daily Check-In triggers to the existing PTC exercise.
*/

(function () {
  "use strict";

  const MIN_TRIGGER_INTENSITY = 5;
  let lastSignature = "";

  function getContext() {
    return {
      trigger: document.getElementById("v43Trigger")?.value || "",
      triggerType: document.getElementById("v43TriggerType")?.value || "",
      intensity: Number(document.getElementById("v43Intensity")?.value || 0),
      mood: document.getElementById("v43Mood")?.value || "",
      mind: document.getElementById("v43Mind")?.value || "",
      need: document.getElementById("v43Need")?.value || ""
    };
  }

  
    if (document.getElementById("ptcTriggerStyles")) return;

    const style = document.createElement("style");
    style.id = "ptcTriggerStyles";
function shouldPrompt(ctx) {
  const trigger = String(ctx.trigger || "").trim().toLowerCase();
  const triggerType = String(ctx.triggerType || "").trim().toLowerCase();
  const mood = String(ctx.mood || "").trim().toLowerCase();
  const need = String(ctx.need || "").trim().toLowerCase();

  const intensity = Number(ctx.intensity) || 0;

  // Any meaningful indication that the user may be struggling.
  const triggerDetected =
    trigger === "yes" ||
    trigger === "true";

  const struggleMood =
    mood === "struggling" ||
    mood === "not doing well" ||
    mood.includes("struggl") ||
    mood.includes("not doing");

  const relapseConcern =
    need.includes("relapse") ||
    need.includes("might relapse") ||
    need.includes("afraid");

  const crisisConcern =
    need.includes("crisis") ||
    need.includes("emergency") ||
    need.includes("danger") ||
    need.includes("unsafe");

  const strongTrigger =
    triggerDetected &&
    intensity >= 5;

  // PTC should be offered first whenever there is
  // a meaningful indication of struggle.
  if (
    triggerDetected ||
    struggleMood ||
    relapseConcern ||
    crisisConcern ||
    strongTrigger
  ) {
    return true;
  }

  return false;
}
    style.textContent = `
      #ptcTriggerPrompt {
        margin-top: 12px;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: var(--card);
      }

      #ptcTriggerPrompt strong {
        display: block;
        margin-bottom: 5px;
      }

      #ptcTriggerPrompt .ptc-trigger-note {
        color: var(--muted);
        font-size: .9rem;
        line-height: 1.45;
      }

      #ptcCard.ptc-trigger-focus {
        outline: 2px solid var(--accent);
        box-shadow: 0 0 0 5px rgba(78,154,247,.12);
      }
    `;

    document.head.appendChild(style);
  }

  function getPTCCard() {
    return document.getElementById("ptcCard");
  }

  function showPrompt() {
    addStyles();

    const card = getPTCCard();
    if (!card) return false;

    let prompt = document.getElementById("ptcTriggerPrompt");

    if (!prompt) {
      prompt = document.createElement("div");
      prompt.id = "ptcTriggerPrompt";

      prompt.innerHTML = `
        <strong>Pause before you react.</strong>

        <div class="ptc-trigger-note">
          Your check-in shows this may be a difficult moment.
          Pause • Think • Choose can help you slow it down and
          choose your next healthy action.
        </div>

        <button
          class="btn primary"
          id="ptcStartFromTrigger"
          style="margin-top:10px"
        >
          Open Pause • Think • Choose
        </button>
      `;

      card.insertBefore(prompt, card.firstChild);

      document
        .getElementById("ptcStartFromTrigger")
        ?.addEventListener("click", function () {
          focusPTC();
        });
    }

    return true;
  }

  function focusPTC() {
    const card = getPTCCard();

    if (!card) return false;

    showPrompt();

    card.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    card.classList.add("ptc-trigger-focus");

    setTimeout(function () {
      card.classList.remove("ptc-trigger-focus");

      const pauseField = document.getElementById("ptcPause");

      if (pauseField) {
        pauseField.focus();
      }
    }, 700);

    return true;
  }

  function evaluate(source) {
    const ctx = getContext();

    if (!shouldPrompt(ctx)) {
      lastSignature = "";
      return;
    }

    const signature = [
      source,
      ctx.trigger,
      ctx.triggerType,
      ctx.intensity,
      ctx.mood,
      ctx.mind,
      ctx.need
    ].join("|");

    if (signature === lastSignature) return;

    lastSignature = signature;

    if (!focusPTC()) {
      setTimeout(function () {
        if (shouldPrompt(getContext())) {
          focusPTC();
        }
      }, 250);
    }
  }

  function bindCheckin() {
    const section = document.getElementById("checkin");

    if (!section) return;

    const ids = [
      "v43Trigger",
      "v43TriggerType",
      "v43Intensity",
      "v43Mood",
      "v43Mind",
      "v43Need"
    ];

    ids.forEach(function (id) {
      const el = document.getElementById(id);

      if (!el || el.__ptcTriggerBound) return;

      el.addEventListener("change", function () {
        evaluate("change:" + id);
      });

      if (id === "v43Intensity") {
        el.addEventListener("input", function () {
          if (Number(el.value || 0) >= MIN_TRIGGER_INTENSITY) {
            evaluate("input:" + id);
          }
        });
      }

      el.__ptcTriggerBound = true;
    });

    setTimeout(function () {
      const ctx = getContext();

      if (shouldPrompt(ctx)) {
        evaluate("initial");
      }
    }, 150);
  }

  function observeCheckin() {
    const section = document.getElementById("checkin");

    if (!section || section.__ptcTriggerObserver) return;

    const observer = new MutationObserver(function () {
      lastSignature = "";

      setTimeout(function () {
        bindCheckin();
      }, 100);
    });

    observer.observe(section, {
      childList: true,
      subtree: true
    });

    section.__ptcTriggerObserver = observer;

    bindCheckin();
  }

  function init() {
    addStyles();
    observeCheckin();

    setTimeout(bindCheckin, 250);
    setTimeout(bindCheckin, 750);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
