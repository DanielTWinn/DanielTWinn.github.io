document.getElementById('vidstats').style.color = "yellow";
try {
const cameraVideoStream = document.getElementById('camera-stream')

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia({ video: true })) {
    navigator.mediaDevices
      .getUserMedia({ video: {facingMode: "environment"} })
      .then ((stream) => {
              cameraVideoStream.srcObject = stream
              //cameraVideoStream.play()
              
              const videoTrack = stream.getVideoTracks()[0];
              const settings = videoTrack.getSettings();

              document.getElementById('vidstats').innerHTML = "FPS: "+settings.frameRate+" | Full Resolution: "+settings.width+"x"+settings.height;
      })
}

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

canvas.style.width ='100%';
canvas.style.height='100%';
canvas.width  = "400px";
canvas.height = "225px";

//await new Promise(r => cameraVideoStream.onloadedmetadata = r);
requestAnimationFrame(function loop() {
  ctx.drawImage(cameraVideoStream, 0, 0, 400, 225);
  requestAnimationFrame(loop);
});
}
catch(err) {
    document.getElementById('vidstats').innerHTML = err.message;
    document.getElementById('vidstats').style.color = "red";
}
document.getElementById('vidstats').style.color = "blue";
