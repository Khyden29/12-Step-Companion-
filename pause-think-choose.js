/*
 * 12-Step Companion
 * Pause • Think • Choose
 * Clean V1 — hidden by default
 */

(function () {
  "use strict";

  const PTC_ID = "ptc-clean-v1";

  function getEl(id) {
    return document.getElementById(id);
  }

  function shouldShowPTC() {
    const trigger = getEl("v43Trigger")?.value || "";
    const need = getEl("v43Need")?.value || "";

    return (
      trigger === "Yes" ||
      need === "I need to talk to my sponsor" ||
      need === "I'm afraid I might relapse" ||
      need === "I'm in crisis"
    );
  }

  function createPTC() {
    if (getEl(PTC_ID)) return getEl(PTC_ID);

    const card = document.createElement("section");
    card.id = PTC_ID;
    card.className = "card";
    card.style.display = "none";
    card.innerHTML = `
      <h2 class="h2">Pause • Think • Choose</h2>

      <p class="sub">
        Let's work through this moment before it gets bigger.
        You do not have to solve your whole life right now.
      </p>

      <div class="card">
        <h3>1. PAUSE</h3>
        <p>Slow the moment down before making a decision.</p>

        <label>What is happening right now?</label>
        <textarea id="ptcPause"
          placeholder="What happened? What are you dealing with right now?"
          rows="5"></textarea>

        <label>How strong is the feeling or urge?</label>
        <input id="ptcIntensity"
          type="range"
          min="0"
          max="10"
          value="0">

        <div id="ptcIntensityValue">0/10</div>
      </div>

      <div class="card">
        <h3>2. THINK</h3>
        <p>Take a moment before reacting.</p>

        <label>What happens if I act on this feeling?</label>
        <textarea id="ptcThink"
          placeholder="What could happen if I react right now?"
          rows="4"></textarea>

        <label>What would help me get through this safely?</label>
        <textarea id="ptcHelp"
          placeholder="A meeting, sponsor, friend, walk, prayer, calling someone..."
          rows="4"></textarea>
      </div>

      <div class="card">
        <h3>3. CHOOSE</h3>
        <p>Choose the next healthy action — not the perfect answer.</p>

        <select id="ptcChoice">
          <option value="">Choose one</option>
          <option>Call my sponsor</option>
          <option>Call a trusted person</option>
          <option>Go to a meeting</option>
          <option>Leave the situation</option>
          <option>Take a walk and reset</option>
          <option>Use another healthy recovery tool</option>
          <option>Get professional help</option>
        </select>

        <button class="btn primary" type="button" id="ptcSave">
          Save My Choice
        </button>

        <p id="ptcSaved" class="sub" style="display:none;">
          Your recovery choice has been saved.
        </p>
      </div>
    `;

    document.body.appendChild(card);

    const slider = getEl("ptcIntensity");
    const value = getEl("ptcIntensityValue");

    if (slider && value) {
      slider.addEventListener("input", function () {
        value.textContent = slider.value + "/10";
      });
    }

    getEl("ptcSave")?.addEventListener("click", savePTC);

    return card;
  }

  function savePTC() {
    const entry = {
      date: new Date().toISOString(),
      pause: getEl("ptcPause")?.value || "",
      intensity: Number(getEl("ptcIntensity")?.value || 0),
      think: getEl("ptcThink")?.value || "",
      help: getEl("ptcHelp")?.value || "",
      choice: getEl("ptcChoice")?.value || ""
    };

    localStorage.setItem("ptcLastEntry", JSON.stringify(entry));

    const saved = getEl("ptcSaved");
    if (saved) saved.style.display = "block";
  }

  function showPTC() {
    const card = createPTC();
    card.style.display = "block";
  }

  function hidePTC() {
    const card = getEl(PTC_ID);
    if (card) card.style.display = "none";
  }

  function updatePTC() {
    if (shouldShowPTC()) {
      showPTC();
    } else {
      hidePTC();
    }
  }

  /*
   * Public functions.
   * The Daily Check-In will call updatePTC()
   * when we connect the two systems.
   */

  window.PTC = {
    show: showPTC,
    hide: hidePTC,
    update: updatePTC,
    shouldShow: shouldShowPTC
  };

  /*
   * IMPORTANT:
   * Do NOT automatically show or mount PTC.
   * It starts completely hidden.
   */
  createPTC();
  hidePTC();

})();
