const cameraVideoStream = document.getElementById('camera-stream')

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia({ video: true })) {
    navigator.mediaDevices
      .getUserMedia({ video: {facingMode: "environment"} })
      .then ((stream) => {
              cameraVideoStream.srcObject = stream
              cameraVideoStream.play()
              
              const videoTrack = stream.getVideoTracks()[0];
              const settings = videoTrack.getSettings();

              document.getElementById('vidstats').innerHTML = "FPS: "+settings.frameRate+" | Full Resolution: "+settings.width+"x"+settings.height;
      })
}

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

// set canvas size = video size when known
cameraVideoStream.addEventListener('loadedmetadata', function() {
  canvas.width = cameraVideoStream.videoWidth;
  canvas.height = cameraVideoStream.videoHeight;
});

cameraVideoStream.addEventListener('play', function() {
  var $this = this; //cache
  (function loop() {
    if (!$this.paused && !$this.ended) {
      ctx.drawImage($this, 0, 0);
      setTimeout(loop, 1000 / 5); // drawing at 30fps
    }
  })();
}, 0);
