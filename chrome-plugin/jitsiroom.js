let settings = {
  server: "beta.meet.jit.si",
  room:   "jitsi-at-scale"
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set( { settings } );
  console.log(`Default Jitsi room set to ${settings}`);
});