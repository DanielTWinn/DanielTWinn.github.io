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

await new Promise(r => video.onloadedmetadata = r);
requestAnimationFrame(function loop() {
  ctx.drawImage(video, 0, 0, 16, 12);
  requestAnimationFrame(loop);
});
