// Get reference to 'start' button
let startButton = document.getElementById("start");

//chrome.storage.sync.get("color", ({ color }) => {
//  changeColor.style.backgroundColor = color;
//});

function injectScript(tabId, injectDetails) {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(tabId, injectDetails, (data) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(data);
      }
    });
  });
}

// When the button is clicked, inject setPageBackgroundColor into current page
startButton.addEventListener("click", async () => {

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // injectScript( tab.id, {file: "lib-jitsi-meet.min.js"} ).then( () => { alert(`Defined? ${JitsiMeetJS}`); } );

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: startStream,
  });
});

// The body of this function will be executed as a content script inside the
// current page
function startStream() {
  chrome.storage.sync.get("settings", ({ settings }) => {
    console.log( `TODO: Find audio/video element, connect to room ${settings}, start streaming` );

    // From https://cdn.jsdelivr.net/npm/html-element-picker@latest
    // !function(){class t{constructor(t){this.hoverBox=document.createElement("div"),this.hoverBox.style.position="absolute",this.hoverBox.style.pointerEvents="none";const e={...{container:document.body,selectors:"*",background:"rgba(153, 235, 255, 0.5)",borderWidth:5,transition:"all 150ms ease",ignoreElements:[document.body],action:{}},...t};Object.keys(e).forEach(t=>{this[t]=e[t]}),this._detectMouseMove=(t=>{this._previousEvent=t;let e=t.target;if(-1===this.ignoreElements.indexOf(e)&&e.matches(this.selectors)&&this.container.contains(e)||e===this.hoverBox){if(e===this.hoverBox){const i=document.elementsFromPoint(t.clientX,t.clientY)[1];if(this._previousTarget===i)return;e=i}else this._previousTarget=e;const i=e.getBoundingClientRect(),o=i.height,s=i.width;this.hoverBox.style.width=s+2*this.borderWidth+"px",this.hoverBox.style.height=o+2*this.borderWidth+"px",this.hoverBox.style.top=i.top+window.scrollY-this.borderWidth+"px",this.hoverBox.style.left=i.left+window.scrollX-this.borderWidth+"px",this._triggered&&this.action.callback&&(this.action.callback(e),this._triggered=!1)}else this.hoverBox.style.width=0}),document.addEventListener("mousemove",this._detectMouseMove)}get container(){return this._container}set container(t){if(!(t instanceof HTMLElement))throw new Error("Please specify an HTMLElement as container!");this._container=t,this.container.appendChild(this.hoverBox)}get background(){return this._background}set background(t){this._background=t,this.hoverBox.style.background=this.background}get transition(){return this._transition}set transition(t){this._transition=t,this.hoverBox.style.transition=this.transition}get borderWidth(){return this._borderWidth}set borderWidth(t){this._borderWidth=t,this._redetectMouseMove()}get selectors(){return this._selectors}set selectors(t){this._selectors=t,this._redetectMouseMove()}get ignoreElements(){return this._ignoreElements}set ignoreElements(t){this._ignoreElements=t,this._redetectMouseMove()}get action(){return this._action}set action(t){if(!(t instanceof Object))throw new Error("action must be an object!");if("string"==typeof t.trigger&&"function"==typeof t.callback)this._triggerListener&&(document.removeEventListener(this.action.trigger,this._triggerListener),this._triggered=!1),this._action=t,this._triggerListener=(()=>{this._triggered=!0,this._redetectMouseMove()}),document.addEventListener(this.action.trigger,this._triggerListener);else if(void 0!==t.trigger||void 0!==t.callback)throw new Error("action must include two keys: trigger (String) and callback (function)!")}_redetectMouseMove(){this._detectMouseMove&&this._previousEvent&&this._detectMouseMove(this._previousEvent)}}"undefined"!=typeof module&&void 0!==module.exports?module.exports=t:window.ElementPicker=t}();
    // new ElementPicker( { selectors: 'audio,video,canvas' } );
    
    var audios = document.getElementsByTagName("audio");
    console.log( audios ); // HTMLCollection
    for (let item of audios) {
      console.log(item.id);
    }
    
    console.log(`Defined? ${window.JitsiMeetJS}`); // NO
    /*
    var s = document.createElement('script');
    // TODO: add "script.js" to web_accessible_resources in manifest.json
    s.src = chrome.runtime.getURL('lib-jitsi-meet.min.js');
    s.onload = function() {
      console.log(`Defined? ${JitsiMeetJS}`); // NO
      this.remove();
      console.log(`Defined after? ${JitsiMeetJS}`);
    };
    (document.head || document.documentElement).appendChild(s);
    */
    
  });
}
