/*
  12-Step Companion
  Pause • Think • Choose — Recovery Skills Engine V2.0

  Purpose:
  When the Daily Check-In identifies that a user is struggling,
  this engine becomes the FIRST intervention. It teaches practical
  recovery/life skills before escalating to sponsor/meeting support,
  while surfacing crisis resources immediately when safety is at risk.

  Install AFTER:
    daily-checkin-v4.3.js
    pause-think-choose-v1.js
    pause-think-choose-trigger-v1.2.js

  This file can coexist with the existing PTC V1.0 while testing.
  It uses local app storage through window.save() when available.
*/
(function () {
  "use strict";

  const KEY = "pauseThinkChooseRecoveryV2";
  const MIN_INTENSITY = 5;

  const TOOLS = [
    {
      id:"breathing",
      title:"Slow Breathing",
      category:"Calm the body",
      when:["anxious","overwhelmed","restless","high"],
      steps:[
        "Sit or stand somewhere you can pause safely.",
        "Breathe in slowly through your nose for about 4 seconds.",
        "Breathe out slowly for about 6 seconds.",
        "Repeat for 5 rounds. Let the exhale be longer than the inhale.",
        "Notice whether the intensity changed."
      ]
    },
    {
      id:"grounding",
      title:"5–4–3–2–1 Grounding",
      category:"Get back to the present",
      when:["anxious","overwhelmed","restless","lonely","high"],
      steps:[
        "Name 5 things you can see.",
        "Name 4 things you can physically feel.",
        "Name 3 things you can hear.",
        "Name 2 things you can smell.",
        "Name 1 thing you can taste or one thing you appreciate right now.",
        "Remind yourself: I am dealing with this moment, not every future moment at once."
      ]
    },
    {
      id:"urge",
      title:"Ride the Urge",
      category:"Craving / relapse prevention",
      when:["craving","relapse","high"],
      steps:[
        "Rate the urge from 0–10.",
        "Notice where the urge shows up in your body without acting on it.",
        "Describe the sensation instead of fighting it: tight, hot, restless, racing, etc.",
        "Breathe slowly and remind yourself that an urge can rise and fall without being obeyed.",
        "Delay the decision. Give yourself the next 10 minutes.",
        "Choose one safe recovery action before the 10 minutes are over."
      ]
    },
    {
      id:"thought",
      title:"Challenge the Thought",
      category:"Think differently",
      when:["discouraged","anxious","overwhelmed","low"],
      steps:[
        "Write the thought that is driving the feeling.",
        "Ask: Is this 100% true, or is this how it feels right now?",
        "Look for a thinking trap: all-or-nothing, catastrophizing, mind reading, fortune telling, labeling, or personalization.",
        "Write one fact that supports the thought.",
        "Write one fact that does not support it.",
        "Create a more balanced thought that is honest and useful."
      ]
    },
    {
      id:"journal",
      title:"Journal It Out",
      category:"Get it out of your head",
      when:["low","discouraged","overwhelmed","lonely"],
      steps:[
        "Write what happened without judging yourself.",
        "Write what you are feeling.",
        "Write what you want to do next.",
        "Write what could happen if you act on the urge.",
        "Write what could happen if you choose recovery.",
        "Finish with one healthy action you are willing to take now."
      ]
    },
    {
      id:"environment",
      title:"Change Your Environment",
      category:"Interrupt the pattern",
      when:["craving","angry","high","restless"],
      steps:[
        "Identify what place, person, object, or situation is increasing the urge.",
        "Create physical distance from it when you can do so safely.",
        "Move to a safer or more supportive environment.",
        "Remove access to anything that could make acting on the urge easier.",
        "Replace the old action with one recovery action."
      ]
    },
    {
      id:"movement",
      title:"Move Your Body",
      category:"Reset",
      when:["restless","anxious","overwhelmed","low"],
      steps:[
        "Stand up and change position.",
        "Take a short walk, stretch, or do another safe form of movement.",
        "Keep your attention on your breathing and surroundings.",
        "Give yourself 5–10 minutes before making a major decision.",
        "Check the intensity again."
      ]
    },
    {
      id:"gratitude",
      title:"Three Things",
      category:"Shift attention",
      when:["low","discouraged"],
      steps:[
        "Name one person you are grateful for.",
        "Name one thing you have today that you once prayed for.",
        "Name one thing you can do today that supports your recovery.",
        "Let the gratitude be real; you do not have to pretend the problem disappeared.",
        "Choose your next healthy action."
      ]
    },
    {
      id:"stepwork",
      title:"Work a Step",
      category:"Recovery practice",
      when:["discouraged","low","relapse","high"],
      steps:[
        "Ask which Step best fits what you are facing.",
        "Write one honest answer rather than trying to solve everything.",
        "Notice where honesty, acceptance, inventory, amends, prayer, or service may apply.",
        "If you are unsure, write the question down for your sponsor.",
        "Take one small Step-related action today."
      ]
    }
  ];

  function esc(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g, c =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  function getData(){
    if (!window.data) return null;
    data.pauseThinkChooseRecovery = data.pauseThinkChooseRecovery || {
      version:"2.0",
      sessions:[],
      toolHistory:[]
    };
    data.pauseThinkChooseRecovery.sessions =
      Array.isArray(data.pauseThinkChooseRecovery.sessions)
        ? data.pauseThinkChooseRecovery.sessions : [];
    data.pauseThinkChooseRecovery.toolHistory =
      Array.isArray(data.pauseThinkChooseRecovery.toolHistory)
        ? data.pauseThinkChooseRecovery.toolHistory : [];
    return data.pauseThinkChooseRecovery;
  }

  function save(){
    if (typeof window.save === "function") window.save();
    else if (window.data) localStorage.setItem("tsc-v43", JSON.stringify(window.data));
  }

  function context(){
    const get=id=>document.getElementById(id);
    return {
      trigger:get("v43Trigger")?.value || "",
      triggerType:get("v43TriggerType")?.value || "",
      intensity:Number(get("v43Intensity")?.value || 0),
      mood:get("v43Mood")?.value || "",
      mind:get("v43Mind")?.value || "",
      need:get("v43Need")?.value || ""
    };
  }

  function safety(ctx){
    const s = (ctx.need+" "+ctx.mind+" "+ctx.triggerType).toLowerCase();
    return ctx.need === "I'm in crisis" ||
      /suicid|kill myself|hurt myself|self harm|not safe|immediate danger/.test(s);
  }

  function struggling(ctx){
    return safety(ctx) ||
      (ctx.trigger === "Yes" && ctx.intensity >= MIN_INTENSITY) ||
      /struggling|not doing well/i.test(ctx.mood) ||
      /relapse|craving|overwhelmed|anxious|discouraged|lonely/i.test(
        ctx.mind+" "+ctx.need+" "+ctx.triggerType
      );
  }

  function tags(ctx){
    const s=(ctx.mind+" "+ctx.triggerType+" "+ctx.need).toLowerCase();
    const out=[];
    if (/crav|relapse|alcohol|drug/.test(s) || ctx.intensity>=7) out.push("craving");
    if (/anx|overwhelm|restless/.test(s)) out.push("anxious");
    if (/lonel/.test(s)) out.push("lonely");
    if (/discour|low|depress/.test(s)) out.push("low","discouraged");
    if (/angry|anger|argument/.test(s)) out.push("angry");
    if (ctx.intensity>=7) out.push("high");
    return out;
  }

  function recommendedTools(ctx){
    const t=tags(ctx);
    let list=TOOLS.filter(x => x.when.some(w=>t.includes(w)));
    if (!list.length) list=TOOLS.slice(0,5);
    const unique=[];
    list.forEach(x=>{if(!unique.some(y=>y.id===x.id)) unique.push(x);});
    return unique.slice(0,5);
  }

  function styles(){
    if(document.getElementById("ptcRecoveryStyles")) return;
    const st=document.createElement("style");
    st.id="ptcRecoveryStyles";
    st.textContent=`
      #ptcRecoveryCard{margin-top:14px;padding:16px;border:1px solid var(--border);
        border-radius:18px;background:var(--card);display:none}
      #ptcRecoveryCard .ptc-v2-title{font-size:1.45rem;font-weight:850}
      #ptcRecoveryCard .ptc-v2-sub{color:var(--muted);line-height:1.5}
      .ptc-v2-phase{margin-top:14px;padding:14px;border:1px solid var(--border);
        border-radius:16px;background:var(--card2,var(--card))}
      .ptc-v2-tools{display:grid;gap:9px;margin-top:10px}
      .ptc-v2-tool{text-align:left}
      .ptc-v2-tool small{display:block;color:var(--muted);margin-top:3px}
      .ptc-v2-modal{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:9999;
        padding:16px;overflow:auto}
      .ptc-v2-modal .inner{max-width:720px;margin:20px auto;background:var(--card);
        border:1px solid var(--border);border-radius:18px;padding:18px}
      .ptc-v2-step{margin:10px 0;padding:12px;border-left:3px solid var(--accent);
        background:rgba(78,154,247,.08);border-radius:0 12px 12px 0}
      .ptc-v2-safe{border:1px solid #a44;border-radius:16px;padding:14px;background:rgba(160,40,40,.16)}
      .ptc-v2-row{display:flex;gap:9px;flex-wrap:wrap;margin-top:10px}
      .ptc-v2-hidden{display:none!important}
    `;
    document.head.appendChild(st);
  }

  function createCard(){
    if(document.getElementById("ptcRecoveryCard")) return document.getElementById("ptcRecoveryCard");
    const card=document.createElement("div");
    card.id="ptcRecoveryCard";
    card.innerHTML=`
      <div class="ptc-v2-title">Pause • Think • Choose</div>
      <p class="ptc-v2-sub">
        Let's work through this moment before it gets bigger. You do not have
        to solve your whole life right now. We will take one step at a time.
      </p>

      <div id="ptcSafetyBox"></div>

      <div class="ptc-v2-phase">
        <strong>1. PAUSE</strong>
        <p class="ptc-v2-sub">Slow the moment down before making a decision.</p>
        <label>What is happening right now?</label>
        <textarea id="ptcV2Pause" placeholder="What happened? What are you dealing with right now?"></textarea>
        <label>How strong is the feeling or urge right now? <span id="ptcV2BeforeLabel">0/10</span></label>
        <input id="ptcV2Before" type="range" min="0" max="10" value="0">
      </div>

      <div class="ptc-v2-phase">
        <strong>2. THINK</strong>
        <p class="ptc-v2-sub">Understand the thought and feeling instead of automatically acting on them.</p>
        <label>What am I telling myself?</label>
        <textarea id="ptcV2Thought" placeholder="Write the thought exactly as it is."></textarea>
        <div class="ptc-v2-row">
          <button class="btn" id="ptcV2ThoughtTool">Challenge this thought</button>
          <button class="btn" id="ptcV2JournalTool">Journal it out</button>
        </div>
      </div>

      <div class="ptc-v2-phase">
        <strong>3. CHOOSE</strong>
        <p class="ptc-v2-sub">Pick one practical recovery action you are willing to try now.</p>
        <div id="ptcV2Tools" class="ptc-v2-tools"></div>
      </div>

      <div class="ptc-v2-phase">
        <strong>4. CHECK</strong>
        <p class="ptc-v2-sub">After trying a tool, check whether the intensity changed.</p>
        <label>How strong is it now? <span id="ptcV2AfterLabel">0/10</span></label>
        <input id="ptcV2After" type="range" min="0" max="10" value="0">
        <label>Did the tool help?</label>
        <select id="ptcV2Help">
          <option value="">Choose one</option>
          <option>Yes, I feel more in control</option>
          <option>A little, but I still need support</option>
          <option>No, I am still struggling</option>
        </select>
        <div id="ptcV2Next" class="ptc-v2-row"></div>
      </div>

      <button class="btn primary" id="ptcV2Save" style="margin-top:12px">
        Save My Recovery Practice
      </button>
      <div id="ptcV2Saved" class="ptc-v2-sub" style="margin-top:10px"></div>
    `;
    const section=document.getElementById("checkin");
    if(section) section.insertBefore(card, section.firstChild);
    return card;
  }

  function renderTools(){
    const box=document.getElementById("ptcV2Tools");
    if(!box) return;
    const ctx=context();
    const list=recommendedTools(ctx);
    box.innerHTML=list.map(t=>`
      <button class="btn ptc-v2-tool" data-tool="${esc(t.id)}">
        <strong>${esc(t.title)}</strong>
        <small>${esc(t.category)}</small>
      </button>`).join("");
    box.querySelectorAll("[data-tool]").forEach(b=>{
      b.addEventListener("click",()=>openTool(b.dataset.tool));
    });
  }

  function openTool(id){
    const tool=TOOLS.find(x=>x.id===id);
    if(!tool) return;
    const modal=document.createElement("div");
    modal.className="ptc-v2-modal";
    modal.id="ptcV2Modal";
    modal.innerHTML=`
      <div class="inner">
        <div style="display:flex;justify-content:space-between;gap:10px">
          <div>
            <h2 style="margin:0">${esc(tool.title)}</h2>
            <p class="ptc-v2-sub">${esc(tool.category)}</p>
          </div>
          <button class="btn" id="ptcV2Close">Close</button>
        </div>
        <p class="ptc-v2-sub">Work through these steps slowly. You are practicing a recovery skill.</p>
        ${tool.steps.map((s,i)=>`<div class="ptc-v2-step"><strong>${i+1}.</strong> ${esc(s)}</div>`).join("")}
        <div class="ptc-v2-row">
          <button class="btn primary" id="ptcV2DoneTool">I practiced this</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("#ptcV2Close").onclick=()=>modal.remove();
    modal.querySelector("#ptcV2DoneTool").onclick=()=>{
      const d=getData();
      if(d){
        d.toolHistory.unshift({id:tool.id,title:tool.title,date:new Date().toISOString(),context:context()});
        d.toolHistory=d.toolHistory.slice(0,200);
        save();
      }
      modal.remove();
      const after=document.getElementById("ptcV2After");
      if(after) after.focus();
    };
  }

  function renderSafety(ctx){
    const box=document.getElementById("ptcSafetyBox");
    if(!box) return;
    if(!safety(ctx)){
      box.innerHTML="";
      return;
    }
    box.innerHTML=`
      <div class="ptc-v2-safe">
        <strong>If you may be in immediate danger, don't handle this alone.</strong>
        <p class="ptc-v2-sub">
          The recovery tools can still be used, but immediate safety comes first.
        </p>
        <div class="ptc-v2-row">
          <a class="btn primary" href="tel:988">Call 988</a>
          <a class="btn" href="sms:741741?&body=HOME">Text HOME to 741741</a>
          <a class="btn" href="tel:911">Call 911</a>
        </div>
        <p class="ptc-v2-sub" style="margin-bottom:0">
          For substance-use treatment/referral information, SAMHSA's National Helpline is
          1-800-662-HELP (4357).
        </p>
      </div>`;
  }

  function renderNext(){
    const box=document.getElementById("ptcV2Next");
    if(!box) return;
    const help=document.getElementById("ptcV2Help")?.value || "";
    if(!help){ box.innerHTML=""; return; }

    if(help==="Yes, I feel more in control"){
      box.innerHTML=`<div class="ptc-v2-sub"><strong>Good work.</strong>
        You practiced a skill instead of automatically reacting. You can save this practice below.</div>`;
      return;
    }

    box.innerHTML=`
      <div class="ptc-v2-sub"><strong>It's okay to need more support.</strong>
        Your next step can be connection.</div>
      <button class="btn primary" id="ptcV2Sponsor">Contact / Notify Sponsor</button>
      <button class="btn" id="ptcV2Meeting">Find a Recovery Meeting</button>
      <button class="btn" id="ptcV2MoreTools">Try Another Recovery Tool</button>
      <button class="btn" id="ptcV2Crisis">Crisis / Immediate Help</button>`;
    document.getElementById("ptcV2Sponsor").onclick=()=>{
      if(typeof window.connectPortal==="function") window.connectPortal();
      else if(typeof window.openSponsorPortal==="function") window.openSponsorPortal();
      else alert("Sponsor connection is the next recovery-support step. The sponsor portal can be connected here.");
    };
    document.getElementById("ptcV2Meeting").onclick=()=>{
      if(typeof window.findMeeting==="function") window.findMeeting();
      else if(typeof window.show==="function") window.show("meetings");
      else alert("Open Meetings to find a recovery meeting.");
    };
    document.getElementById("ptcV2MoreTools").onclick=()=>{
      document.getElementById("ptcV2Tools")?.scrollIntoView({behavior:"smooth",block:"center"});
    };
    document.getElementById("ptcV2Crisis").onclick=showCrisis;
  }

  function showCrisis(){
    const modal=document.createElement("div");
    modal.className="ptc-v2-modal";
    modal.innerHTML=`
      <div class="inner">
        <h2>Immediate Support</h2>
        <p class="ptc-v2-sub">
          If you are in immediate danger or think you may hurt yourself or someone else,
          call 911 or go to the nearest emergency department.
        </p>
        <div class="ptc-v2-safe">
          <strong>988 Suicide & Crisis Lifeline</strong>
          <p class="ptc-v2-sub">Call or text 988, or use 988 online chat.</p>
          <a class="btn primary" href="tel:988">Call 988</a>
          <a class="btn" href="sms:988">Text 988</a>
        </div>
        <div class="ptc-v2-phase">
          <strong>Crisis Text Line</strong>
          <p class="ptc-v2-sub">Text HOME to 741741 for free, confidential, 24/7 support.</p>
          <a class="btn" href="sms:741741?&body=HOME">Text HOME</a>
        </div>
        <div class="ptc-v2-phase">
          <strong>Substance-use treatment and referral</strong>
          <p class="ptc-v2-sub">SAMHSA National Helpline: 1-800-662-HELP (4357).</p>
          <a class="btn" href="tel:18006624357">Call SAMHSA</a>
        </div>
        <button class="btn" id="ptcV2CloseCrisis" style="margin-top:12px">Return to Recovery Tools</button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("#ptcV2CloseCrisis").onclick=()=>modal.remove();
  }

  function showIfNeeded(){
    const card=createCard();
    if(!card) return;
    const ctx=context();
    renderSafety(ctx);
    renderTools();
    if(struggling(ctx)){
      card.style.display="block";
      renderSafety(ctx);
      card.scrollIntoView({behavior:"smooth",block:"start"});
      if(safety(ctx)) setTimeout(showCrisis,250);
    } else {
      card.style.display="none";
    }
  }

  function bind(){
    const section=document.getElementById("checkin");
    if(!section) return;
    if(!section.__ptcV2Observer){
      const observer=new MutationObserver(()=>{
        setTimeout(()=>{styles();createCard();renderTools();showIfNeeded();},80);
      });
      observer.observe(section,{childList:true,subtree:true});
      section.__ptcV2Observer=observer;
    }

    ["v43Trigger","v43TriggerType","v43Intensity","v43Mood","v43Mind","v43Need"].forEach(id=>{
      const el=document.getElementById(id);
      if(!el || el.__ptcV2Bound) return;
      el.addEventListener("change",showIfNeeded);
      el.addEventListener("input",showIfNeeded);
      el.__ptcV2Bound=true;
    });
  }

  function init(){
    styles();
    if(!window.data){setTimeout(init,100);return;}
    getData();
    createCard();
    bind();
    showIfNeeded();

    const before=document.getElementById("ptcV2Before");
    const after=document.getElementById("ptcV2After");
    const bl=document.getElementById("ptcV2BeforeLabel");
    const al=document.getElementById("ptcV2AfterLabel");
    if(before) before.addEventListener("input",()=>bl.textContent=before.value+"/10");
    if(after) after.addEventListener("input",()=>al.textContent=after.value+"/10");

    document.getElementById("ptcV2Help")?.addEventListener("change",renderNext);
    document.getElementById("ptcV2ThoughtTool")?.addEventListener("click",()=>openTool("thought"));
    document.getElementById("ptcV2JournalTool")?.addEventListener("click",()=>openTool("journal"));
    document.getElementById("ptcV2Save")?.addEventListener("click",()=>{
      const d=getData();
      if(!d) return;
      d.sessions.unshift({
        id:"ptc-v2-"+Date.now(),
        date:new Date().toISOString(),
        context:context(),
        pause:document.getElementById("ptcV2Pause")?.value || "",
        thought:document.getElementById("ptcV2Thought")?.value || "",
        before:Number(document.getElementById("ptcV2Before")?.value || 0),
        after:Number(document.getElementById("ptcV2After")?.value || 0),
        helped:document.getElementById("ptcV2Help")?.value || "",
        completed:true
      });
      d.sessions=d.sessions.slice(0,100);
      save();
      document.getElementById("ptcV2Saved").textContent="Recovery practice saved.";
    });
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();

  window.ptcRecoveryShow = showIfNeeded;
  window.ptcRecoveryTools = TOOLS;
})();
