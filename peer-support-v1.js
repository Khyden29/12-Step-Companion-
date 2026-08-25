/*
 * 12-Step Companion
 * In-App Peer Support v1.0
 *
 * Purpose:
 * - Recognize completion of all 12 Steps.
 * - Show a meaningful completion milestone.
 * - Offer an OPTIONAL peer-support pathway.
 * - Keep peer support clearly separate from professional/crisis care.
 *
 * Integration:
 * 1. Add this file to the repository root.
 * 2. Add before </body> in index.html:
 *    <script src="peer-support-v1.js"></script>
 *
 * Existing app integration:
 * The module listens for:
 *   window.dispatchEvent(new CustomEvent("twelveStepCompanion:stepCompleted",
 *     { detail: { step: 1 } }));
 *
 * If the app already stores completed steps in localStorage, the module
 * also checks common keys and arrays when it initializes.
 *
 * To explicitly tell the module that all 12 Steps are complete:
 *   window.dispatchEvent(new CustomEvent(
 *     "twelveStepCompanion:allStepsCompleted"
 *   ));
 *
 * This v1 intentionally does NOT create real user-to-user messaging.
 * It creates the milestone, consent/availability flow, and a safe
 * "peer support coming soon" state until authentication, privacy,
 * reporting, blocking, moderation, and secure messaging are implemented.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "tsc_peer_support_v1";
  const MILESTONE_KEY = "tsc_12_step_milestone_v1";

  const state = loadState();

  function loadState() {
    try {
      return Object.assign({
        completedSteps: [],
        milestoneSeen: false,
        wantsToHelp: null,
        availability: "not_available",
        onboardingComplete: false
      }, JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch (e) {
      return {
        completedSteps: [],
        milestoneSeen: false,
        wantsToHelp: null,
        availability: "not_available",
        onboardingComplete: false
      };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function uniqueSteps(list) {
    return [...new Set(
      (Array.isArray(list) ? list : [])
        .map(Number)
        .filter(n => n >= 1 && n <= 12)
    )].sort((a, b) => a - b);
  }

  function markStepComplete(step) {
    step = Number(step);
    if (!(step >= 1 && step <= 12)) return;
    state.completedSteps = uniqueSteps([...state.completedSteps, step]);
    saveState();

    if (state.completedSteps.length === 12) {
      showMilestone();
    }
  }

  function allStepsCompleted() {
    return state.completedSteps.length === 12 &&
      state.completedSteps.every((n, i) => n === i + 1);
  }

  function detectExistingCompletion() {
    const candidates = [
      "completedSteps",
      "completed-steps",
      "stepProgress",
      "stepsCompleted",
      "12stepProgress"
    ];

    for (const key of candidates) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          const steps = uniqueSteps(parsed);
          if (steps.length === 12) {
            state.completedSteps = steps;
            saveState();
            return true;
          }
        }

        if (parsed && Array.isArray(parsed.completedSteps)) {
          const steps = uniqueSteps(parsed.completedSteps);
          if (steps.length === 12) {
            state.completedSteps = steps;
            saveState();
            return true;
          }
        }
      } catch (e) {}
    }

    return allStepsCompleted();
  }

  function injectStyles() {
    if (document.getElementById("tsc-peer-support-styles")) return;

    const style = document.createElement("style");
    style.id = "tsc-peer-support-styles";
    style.textContent = `
      #tsc-peer-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(0,0,0,.72);
        backdrop-filter: blur(4px);
      }
      #tsc-peer-card {
        width: min(680px, 100%);
        max-height: 92vh;
        overflow-y: auto;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 24px;
        padding: 24px;
        background: #24162a;
        color: #fff;
        box-shadow: 0 20px 70px rgba(0,0,0,.45);
      }
      #tsc-peer-card h2 { margin: 0 0 8px; font-size: 28px; }
      #tsc-peer-card h3 { margin: 22px 0 8px; }
      #tsc-peer-card p { line-height: 1.55; color: #ddd0df; }
      .tsc-peer-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        margin: 8px 0 14px;
        border-radius: 999px;
        background: rgba(220,119,164,.18);
        border: 1px solid rgba(220,119,164,.45);
        font-weight: 700;
      }
      .tsc-peer-actions {
        display: grid;
        gap: 10px;
        margin-top: 18px;
      }
      .tsc-peer-btn {
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 14px;
        padding: 14px 16px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        background: #34203a;
        color: #fff;
      }
      .tsc-peer-btn.primary {
        background: #d978a4;
        color: #171018;
        border-color: transparent;
      }
      .tsc-peer-btn.secondary { background: transparent; }
      .tsc-peer-note {
        font-size: 13px;
        color: #bcaec0;
        margin-top: 14px;
      }
      .tsc-peer-choice {
        display: block;
        padding: 14px;
        margin: 9px 0;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 14px;
        background: #301d35;
      }
      .tsc-peer-choice input { margin-right: 10px; }
      .tsc-peer-success {
        padding: 14px;
        border-radius: 14px;
        background: rgba(71,164,113,.14);
        border: 1px solid rgba(71,164,113,.35);
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    injectStyles();
    if (document.getElementById("tsc-peer-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "tsc-peer-overlay";
    overlay.innerHTML = `
      <div id="tsc-peer-card" role="dialog" aria-modal="true" aria-labelledby="tsc-peer-title">
        <div id="tsc-peer-content"></div>
      </div>
    `;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
  }

  function openModal(html) {
    ensureOverlay();
    document.getElementById("tsc-peer-content").innerHTML = html;
    document.getElementById("tsc-peer-overlay").style.display = "flex";
  }

  function closeModal() {
    const overlay = document.getElementById("tsc-peer-overlay");
    if (overlay) overlay.style.display = "none";
  }

  function showMilestone() {
    if (state.milestoneSeen) return;

    state.milestoneSeen = true;
    saveState();
    localStorage.setItem(MILESTONE_KEY, "completed");

    openModal(`
      <div class="tsc-peer-badge">🏆 12-STEP MILESTONE</div>
      <h2 id="tsc-peer-title">Congratulations!</h2>
      <p>
        You've worked through all 12 Steps in the 12-Step Companion.
        This is a milestone worth recognizing.
      </p>
      <p>
        Your recovery doesn't end here. The tools you've practiced can
        continue to help you one day at a time.
      </p>

      <h3>Would you like to give back?</h3>
      <p>
        You can continue your own recovery without taking on a support role,
        or you can choose to become an optional in-app peer helper for someone
        who is getting started.
      </p>

      <div class="tsc-peer-actions">
        <button class="tsc-peer-btn primary" id="tsc-peer-help">🤝 Yes, I want to help</button>
        <button class="tsc-peer-btn" id="tsc-peer-later">Maybe later</button>
        <button class="tsc-peer-btn secondary" id="tsc-peer-continue">Continue my recovery</button>
      </div>

      <div class="tsc-peer-note">
        Peer support is voluntary and is not professional counseling,
        emergency care, or a replacement for a real-world sponsor.
      </div>
    `);

    document.getElementById("tsc-peer-help").onclick = showPeerSetup;
    document.getElementById("tsc-peer-later").onclick = closeModal;
    document.getElementById("tsc-peer-continue").onclick = closeModal;
  }

  function showPeerSetup() {
    openModal(`
      <div class="tsc-peer-badge">🤝 IN-APP PEER SUPPORT</div>
      <h2 id="tsc-peer-title">Give Back When You're Ready</h2>
      <p>
        Let other users know you're willing to encourage them as they learn
        recovery skills.
      </p>

      <h3>Choose your availability</h3>

      <label class="tsc-peer-choice">
        <input type="radio" name="tscAvailability" value="available">
        <strong>Available</strong><br>
        <span>I'm willing to receive a peer-support request.</span>
      </label>

      <label class="tsc-peer-choice">
        <input type="radio" name="tscAvailability" value="occasional">
        <strong>Occasionally</strong><br>
        <span>I may help when I have the time and capacity.</span>
      </label>

      <label class="tsc-peer-choice">
        <input type="radio" name="tscAvailability" value="not_available">
        <strong>Not currently available</strong><br>
        <span>Keep my peer-support option off for now.</span>
      </label>

      <h3>Important boundaries</h3>
      <p>
        A peer helper is there to share experience, encouragement and recovery
        tools. A peer is not responsible for another person's safety and does
        not provide professional medical or mental-health care.
      </p>
      <p>
        If someone indicates immediate danger, the app should direct them to
        crisis/emergency support rather than placing that responsibility on a
        peer.
      </p>

      <div class="tsc-peer-actions">
        <button class="tsc-peer-btn primary" id="tsc-peer-save">Save My Peer Support Choice</button>
        <button class="tsc-peer-btn secondary" id="tsc-peer-back">Back</button>
      </div>
    `);

    const current = state.availability || "not_available";
    const radio = document.querySelector(
      'input[name="tscAvailability"][value="' + current + '"]'
    );
    if (radio) radio.checked = true;

    document.getElementById("tsc-peer-save").onclick = () => {
      const selected = document.querySelector('input[name="tscAvailability"]:checked');
      state.wantsToHelp = selected && selected.value !== "not_available";
      state.availability = selected ? selected.value : "not_available";
      state.onboardingComplete = true;
      saveState();

      openModal(`
        <div class="tsc-peer-success">
          <strong>Peer Support preference saved.</strong>
          <p>
            Your choice can be changed at any time in Settings.
          </p>
        </div>
        <h2 id="tsc-peer-title">You're Giving Back</h2>
        <p>
          The connection system is being designed with privacy, consent,
          blocking, reporting and safety controls before real peer-to-peer
          communication is enabled.
        </p>
        <p>
          For now, your preference is saved and the app can use this milestone
          to prepare the future peer-support experience.
        </p>
        <div class="tsc-peer-actions">
          <button class="tsc-peer-btn primary" id="tsc-peer-done">Continue</button>
        </div>
      `);
      document.getElementById("tsc-peer-done").onclick = closeModal;
    };

    document.getElementById("tsc-peer-back").onclick = showMilestone;
  }

  // Public API for the rest of the app.
  window.TSC_PeerSupport = {
    markStepComplete,
    markAllStepsComplete: function () {
      state.completedSteps = Array.from({ length: 12 }, (_, i) => i + 1);
      saveState();
      showMilestone();
    },
    showMilestone,
    getState: function () {
      return JSON.parse(JSON.stringify(state));
    }
  };

  window.addEventListener("twelveStepCompanion:stepCompleted", function (event) {
    if (event && event.detail) markStepComplete(event.detail.step);
  });

  window.addEventListener("twelveStepCompanion:allStepsCompleted", function () {
    window.TSC_PeerSupport.markAllStepsComplete();
  });

  document.addEventListener("DOMContentLoaded", function () {
    ensureOverlay();

    // Detect a previously completed 12-step journey if the existing app
    // stores it in one of the common localStorage formats.
    if (detectExistingCompletion() && !state.milestoneSeen) {
      setTimeout(showMilestone, 500);
    }
  });
})();
