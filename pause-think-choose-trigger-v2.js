/*
  12-Step Companion
  Pause • Think • Choose — Recovery Skills Trigger V2.0

  This is the bridge from the V4.3 Daily Check-In into the Recovery
  Skills Engine. It makes PTC the FIRST intervention for ordinary
  struggle, while immediate safety concerns surface crisis support.
*/
(function(){
  "use strict";

  const MIN_INTENSITY=5;
  let last="";

  function ctx(){
    const g=id=>document.getElementById(id);
    return {
      trigger:g("v43Trigger")?.value||"",
      triggerType:g("v43TriggerType")?.value||"",
      intensity:Number(g("v43Intensity")?.value||0),
      mood:g("v43Mood")?.value||"",
      mind:g("v43Mind")?.value||"",
      need:g("v43Need")?.value||""
    };
  }

  function isCrisis(c){
    const s=(c.need+" "+c.mind+" "+c.triggerType).toLowerCase();
    return c.need==="I'm in crisis" ||
      /suicid|kill myself|hurt myself|self harm|not safe|immediate danger/.test(s);
  }

  function isStruggling(c){
    return isCrisis(c) ||
      (c.trigger==="Yes" && c.intensity>=MIN_INTENSITY) ||
      /struggling|not doing well/i.test(c.mood) ||
      /relapse|craving|overwhelmed|anxious|discouraged|lonely/i.test(
        c.mind+" "+c.need+" "+c.triggerType);
  }

  function evaluate(source){
    const c=ctx();
    const sig=[source,c.trigger,c.triggerType,c.intensity,c.mood,c.mind,c.need].join("|");
    if(sig===last) return;
    last=sig;
    if(!isStruggling(c)) return;

    if(typeof window.ptcRecoveryShow==="function"){
      window.ptcRecoveryShow();
      return;
    }

    setTimeout(function(){
      if(typeof window.ptcRecoveryShow==="function") window.ptcRecoveryShow();
    },200);
  }

  function bind(){
    const section=document.getElementById("checkin");
    if(!section) return;

    ["v43Trigger","v43TriggerType","v43Intensity","v43Mood","v43Mind","v43Need"]
      .forEach(function(id){
        const el=document.getElementById(id);
        if(!el || el.__ptcV2TriggerBound) return;
        el.addEventListener("change",()=>evaluate("change:"+id));
        el.addEventListener("input",()=>evaluate("input:"+id));
        el.__ptcV2TriggerBound=true;
      });

    setTimeout(()=>evaluate("bind"),150);
  }

  function init(){
    bind();
    setTimeout(bind,250);
    setTimeout(bind,750);
  }

  if(document.readyState==="loading")
    document.addEventListener("DOMContentLoaded",init);
  else init();
})();
