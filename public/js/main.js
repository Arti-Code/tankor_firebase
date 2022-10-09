import {auth} from './auth.js';

const app = firebase.initializeApp(auth);
const db = firebase.database();

const messages = document.getElementById('messages');
//let localDescription = document.getElementById('localSessionDescription');
let btnStart = document.getElementById('btn_start');
let btnStop = document.getElementById('btn_stop');
let stat_disconnected = document.getElementById('status_disconnected');
let stat_connecting = document.getElementById('status_connecting');
let stat_connected = document.getElementById('status_connected');
let device_id = "kamera";
let pc;

btnStart.addEventListener('click', init)
btnStop.addEventListener('click', stopConnection);
btnStart.addEventListener('touchend', wait_answer)
btnStop.addEventListener('touchend', stopConnection);

clearNegotiation()
status_disconnected();


function init() {
  pc = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});
  pc.addTransceiver('video', {'direction': 'recvonly'});
  
  pc.ontrack = function (event) {
    var el = document.createElement(event.track.kind)
    el.srcObject = event.streams[0]
    el.autoplay = true
    el.controls = true
    document.getElementById('remoteVideos').appendChild(el)
  };
  
  pc.oniceconnectionstatechange = function (event) {
    info(pc.iceConnectionState)
    if (pc.iceConnectionState == 'checking') {
      status_connecting();
    } else if (pc.iceConnectionState == 'connected') {
      status_connected();
    } else if (pc.iceConnectionState == 'completed') {
      status_connected();
    } else {
      status_disconnected();
    }
  };

  pc.onicecandidate = function (event) {
    if (event.candidate === null) {
      let lsd = btoa(JSON.stringify(pc.localDescription));
      info("[OFFER]: ok");
      //db_write(device_id, "answer", "");
      db_write(device_id, "offer", lsd);
      info("[ANSWER]: waiting");
      wait_answer();
    }
  };
  
  pc.onnegotiationneeded = function (event) {
    pc.createOffer().then(d => pc.setLocalDescription(d)).catch(info);
  };
};
  

function db_read() {
  let dbRef = db.ref().child("signaling").child("welcome")
  .get().then((snapshoot) => {
    if (snapshoot.exists()) {
      info(snapshoot.val());
    } else {
      info("empty snapshoot");
    }
  });
};

function db_write(device, msg_type, data) {
  db.ref().child("signaling").child(device).child(msg_type)
    .set(data);
};

function info(text) {
  console.log(text)
  //messages.innerHTML = messages.innerHTML + text + '<br />';
};

function clearNegotiation() {
  db_write(device_id, "answer", "");
  db_write(device_id, "offer", "");
}

function wait_answer() {
  let on_answer = db.ref().child("signaling").child(device_id).child("answer");
  on_answer.on('value', (snapshot) => {
    set_remote_sdp(snapshot.val());
  });
};

function set_remote_sdp(data) {
  if (data == "") {
    info("empty answer");
    return;
  } else {
    try {
      let sdp = JSON.parse(atob(data));
      pc.setRemoteDescription(new RTCSessionDescription(sdp));
      info("[ANSWER]: ok");
      db_write(device_id, "answer", "");
      btnStop.removeAttribute('hidden')
      btnStart.setAttribute('hidden', 'true')
    } catch (e) {
      alert(e);
    }
  }
};

function stopConnection() {
  pc.close();
  btnStop.setAttribute('hidden', 'true');
  btnStart.removeAttribute('hidden');
  status_disconnected();
};
  
function hide_status_flags() {
  stat_disconnected.setAttribute('hidden', 'true');
  stat_connecting.setAttribute('hidden', 'true');
  stat_connected.setAttribute('hidden', 'true');
};

function status_disconnected() {
  hide_status_flags();
  stat_disconnected.removeAttribute('hidden');
};

function status_connecting() {
  hide_status_flags();
  stat_connecting.removeAttribute('hidden');
};

function status_connected() {
  hide_status_flags();
  stat_connected.removeAttribute('hidden');
};