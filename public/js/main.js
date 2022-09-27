import {auth} from './auth.js';

const app = firebase.initializeApp(auth);
const db = firebase.database();

const messages = document.getElementById('messages');
let localDescription = document.getElementById('localSessionDescription');
let btnStart = document.getElementById('btn_start');
let btnStop = document.getElementById('btn_stop');
let device_id = "kamera";

btnStart.addEventListener('click', wait_answer)
btnStop.addEventListener('click', stopConnection);
btnStart.addEventListener('touchend', wait_answer)
btnStop.addEventListener('touchend', stopConnection);

let pc = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});

pc.ontrack = function (event) {
  var el = document.createElement(event.track.kind)
  el.srcObject = event.streams[0]
  el.autoplay = true
  el.controls = true
  document.getElementById('remoteVideos').appendChild(el)
}

pc.oniceconnectionstatechange = e => info(pc.iceConnectionState)

pc.onicecandidate = event => {
  if (event.candidate === null) {
    let lsd = btoa(JSON.stringify(pc.localDescription));
    console.log("[OFFER]: " + lsd);
    info("[OFFER] OK");
    db_write(device_id, "answer", "");
    db_write(device_id, "offer", lsd);
    localDescription.value = lsd;
  }
}

pc.onnegotiationneeded = event => {
  pc.createOffer().then(d => pc.setLocalDescription(d)).catch(info);
};

//pc.addTransceiver('audio', {'direction': 'recvonly'})
pc.addTransceiver('video', {'direction': 'recvonly'})
//pc.addTransceiver('video', {'direction': 'recvonly'})
//pc.createOffer().then(d => pc.setLocalDescription(d)).catch(info)

function db_read() {
  let dbRef = db.ref().child("signaling").child("welcome")
  .get().then((snapshoot) => {
    if (snapshoot.exists()) {
      console.log(snapshoot.val());
      info(snapshoot.val());
    } else {
      console.log("empty snapshoot");
      info("empty snapshoot");
    }
  });
};

function db_write(device, msg_type, data) {
  db.ref().child("signaling").child(device).child(msg_type)
    .set(data);
};

function info(text) {
  messages.innerHTML = messages.innerHTML + text + '<br />';
};

function wait_answer() {
  let on_answer = db.ref().child("signaling").child(device_id).child("answer");
  on_answer.on('value', (snapshot) => {
    set_remote_sdp(snapshot.val());
  });
};

function set_remote_sdp(data) {
  if (data == "") {
    return;
  } else {
    try {
      let sdp = JSON.parse(atob(data));
      pc.setRemoteDescription(new RTCSessionDescription(sdp));
      info("[ANSWER]: OK");
      console.log("[ANSWER]: OK");
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
}

//window.startSession = () => {
//  wait_answer();
//};

//window.startSession = () => {
//  let sd = document.getElementById('remoteSessionDescription').value
//  if (sd === '') {
//    return alert('Session Description must not be empty')
//  }
//
//  try {
//    pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(sd))))
//  } catch (e) {
//    alert(e)
//  }
//}
  
