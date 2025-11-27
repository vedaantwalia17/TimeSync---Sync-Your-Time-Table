// popup/popup.js (debug, single-shot)
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");
const extractBtn = document.getElementById("extractBtn");
function setStatus(s){ statusEl.textContent = s; }

async function singleCall(tabId){
  try{
    const res = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: () => {
        // probe common global names, return diagnostic info
        const names = ['__SNU_TIMESYNC','__TIMESYNC','TimeSync','timesync'];
        const found = [];
        for(const n of names){
          const g = window[n];
          found.push({ name: n, exists: !!g, type: typeof g, hasExtract: !!(g && typeof g.extract === 'function') });
        }
        // try to call whichever has extract
        for(const f of found){
          if(f.hasExtract){
            try { return { ok:true, global:f.name, result: window[f.name].extract() }; }
            catch(e){ return { ok:false, error: 'extract threw: '+e.message, global:f.name }; }
          }
        }
        return { ok:false, error:'no-extractor-found', probe: found };
      }
    });
    return res && res[0] ? res[0].result : { ok:false, error:'no-response' };
  } catch(e){ return { ok:false, error:'executeScript failed: '+e.message }; }
}

extractBtn.addEventListener('click', async ()=>{
  setStatus('Running extractor (single-shot)...');
  outputEl.textContent = '';
  const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
  if(!tab || !tab.id){ setStatus('No active tab'); return; }
  const r = await singleCall(tab.id);
  outputEl.textContent = JSON.stringify(r, null, 2);
  setStatus(r.ok ? `Got data (global: ${r.global})` : 'Failed — check output');
});
