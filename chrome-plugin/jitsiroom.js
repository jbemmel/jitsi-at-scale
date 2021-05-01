let room = {
  server: "beta.meet.jit.si",
  room:   "jitsi-at-scale"
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set( room );
  console.log(`Default Jitsi room set to ${room}`);
});
