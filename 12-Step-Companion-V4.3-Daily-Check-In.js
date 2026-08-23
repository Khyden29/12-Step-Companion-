/*
12-Step Companion V4.3 Daily Check-In Upgrade
Install by adding this script after the existing app script in index.html:
<script src="daily-checkin-v4.3.js"></script>
*/
(function () {
  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function ensureCheckinData() {
    data.checkins = data.checkins || [];
  }

  function renderV43Checkin() {
    const section = document.getElementById("checkin");
    if (!section) return;

    section.innerHTML = `
      <h2 class="h2">Daily Check-In</h2>
      <p class="sub">A quick pause to be honest about where you are today.</p>

      <div class="card">
        <div class="field">
          <label>1. How am I feeling?</label>
          <select id="v43Mood">
            <option>Great</option><option>Good</option><option>Okay</option>
            <option>Not doing well</option><option>Struggling</option>
          </select>
        </div>

        <div class="field">
          <label>2. What's my state of mind today?</label>
          <select id="v43Mind">
            <option>Calm</option><option>Positive</option><option>Anxious</option>
            <option>Angry</option><option>Sad</option><option>Overwhelmed</option>
            <option>Lonely</option><option>Restless</option><option>Discouraged</option>
            <option>Other</option>
          </select>
        </div>

        <div class="field">
          <label>3. Have I experienced any triggers today?</label>
          <select id="v43Trigger" onchange="window.v43ToggleTrigger()">
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        <div id="v43TriggerFields" style="display:none">
          <div class="field">
            <label>What triggered you?</label>
            <select id="v43TriggerType">
              <option>Cravings</option><option>Stress</option><option>Anger</option>
              <option>Relationship problems</option><option>Financial problems</option>
              <option>Work</option><option>Family</option><option>Loneliness</option>
              <option>Being around alcohol/drugs</option><option>Memories of using</option>
              <option>Someone I used with</option><option>Other</option>
            </select>
          </div>

          <div class="field">
            <label>How strong is the trigger? <span id="v43IntensityValue">1</span>/10</label>
            <input id="v43Intensity" type="range" min="1" max="10" value="1"
              oninput="document.getElementById('v43IntensityValue').textContent=this.value">
          </div>
        </div>

        <div class="field">
          <label>4. What do I need right now?</label>
          <select id="v43Need">
            <option>I just need to check in</option>
            <option>I need to talk to my sponsor</option>
            <option>I need a meeting</option>
            <option>I need someone to talk to</option>
            <option>I'm afraid I might relapse</option>
            <option>I'm in crisis</option>
          </select>
        </div>

        <div class="field">
          <label>What am I grateful for?</label>
          <textarea id="v43Gratitude"></textarea>
        </div>

        <div class="field">
          <label>What do I need to be honest about today?</label>
          <textarea id="v43Honesty"></textarea>
        </div>

        <div id="v43Support" class="card" style="display:none;margin-top:12px">
          <strong>You don't have to handle this alone.</strong>
          <p class="sub">Choose the support that would help you right now.</p>
          <div class="row">
            <button class="btn primary" onclick="window.v43Meeting()">Find a Meeting</button>
            <button class="btn" onclick="window.v43Sponsor()">Contact My Sponsor</button>
            <button class="btn danger" onclick="window.v43Crisis()">Crisis / Emergency Help</button>
          </div>
        </div>

        <button class="btn primary" style="margin-top:12px" onclick="window.v43Save()">Save Check-In</button>
      </div>`;
  }

  window.v43ToggleTrigger = function () {
    const yes = document.getElementById("v43Trigger").value === "Yes";
    document.getElementById("v43TriggerFields").style.display = yes ? "block" : "none";
    document.getElementById("v43Support").style.display = yes ? "block" : "none";
  };

  window.v43Save = function () {
    ensureCheckinData();
    const trigger = document.getElementById("v43Trigger").value;
    const need = document.getElementById("v43Need").value;

    data.checkins.push({
      date: new Date().toISOString(),
      mood: document.getElementById("v43Mood").value,
      stateOfMind: document.getElementById("v43Mind").value,
      trigger: trigger,
      triggerType: trigger === "Yes" ? document.getElementById("v43TriggerType").value : "",
      triggerIntensity: trigger === "Yes" ? Number(document.getElementById("v43Intensity").value) : 0,
      need: need,
      gratitude: document.getElementById("v43Gratitude").value,
      honesty: document.getElementById("v43Honesty").value,
      version: "V4.3"
    });

    save();
    toast("Daily Check-In saved");

    if (trigger === "Yes" || need === "I need a meeting" ||
        need === "I need to talk to my sponsor" ||
        need === "I'm afraid I might relapse" ||
        need === "I'm in crisis") {
      document.getElementById("v43Support").style.display = "block";
      return;
    }

    show("home");
  };

  window.v43Meeting = function () {
    window.open("https://www.aa.org/meeting-guide-app", "_blank", "noopener");
  };

  window.v43Sponsor = function () {
    show("sponsor");
  };

  window.v43Crisis = function () {
    show("help");
  };

  // Replace the old check-in UI when the page loads.
  renderV43Checkin();

  // Opening behavior: show the check-in on app launch only if today's check-in
  // has not already been completed.
  ensureCheckinData();
  const doneToday = data.checkins.some(function (c) {
    return String(c.date || "").slice(0, 10) === todayKey();
  });

  if (!doneToday) {
    setTimeout(function () {
      show("checkin");
    }, 250);
  }
})();
