function scaleVideoDimensions(width, height, maxPx = 400) {
   const aspectRatio = width / height;
   if (width > height) {
       return [Math.min(width, maxPx), Math.round(Math.min(maxPx / aspectRatio, height))];
   } else {
       return [Math.round(Math.min(maxPx * aspectRatio, width)), Math.min(height, maxPx)];
   }
}

try {
        const cameraVideoStream = document.getElementById('camera-stream');
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');

        canvas.style.width ='100%';
        canvas.style.height='100%';
        var rcanvasres = [16, 9];
        var canvasres = "???";

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia({ video: true })) {
            navigator.mediaDevices
              .getUserMedia({ video: {facingMode: "environment"} })
              .then ((stream) => {
                        cameraVideoStream.srcObject = stream
                        //cameraVideoStream.play()

                        const videoTrack = stream.getVideoTracks()[0];
                        const settings = videoTrack.getSettings();
                        document.getElementById('vidstats').innerHTML = "FPS: "+settings.frameRate+" | Full Resolution: "+settings.width+"x"+settings.height;
                        
                        var restemp = scaleVideoDimensions(settings.width, settings.height);
                        canvasres = restemp[0]+"x"+restemp[1]
                        rcanvasres = restemp
                        canvas.width  = restemp[0];
                        canvas.height = restemp[1];
                        document.getElementById('canstats').innerHTML = "FPS: ? | Full Resolution: "+canvasres;
                })
        }

        document.getElementById('turn').addEventListener('click', function() {
                var t = rcanvasres[0];
                rcanvasres[0] = rcanvasres[1];
                rcanvasres[1] = t;
                canvasres = rcanvasres[0]+"x"+rcanvasres[1];
                canvas.width  = rcanvasres[0];
                canvas.height = rcanvasres[1];
        });

        var count = 0;
        var startTime = Date.now(); 

        requestAnimationFrame(function loop() {
                count++;
                ctx.drawImage(cameraVideoStream, 0, 0, rcanvasres[0], rcanvasres[1]);

                var elapsedTime = Date.now() - startTime;
                if (elapsedTime >= 1000) {
                        document.getElementById('canstats').innerHTML = "FPS: "+count+" | Full Resolution: "+canvasres;
                        count = 0;
                        startTime = Date.now();
                }

                requestAnimationFrame(loop);
        });
} catch(err) {
    document.getElementById('vidstats').innerHTML = err.message;
    document.getElementById('vidstats').style.color = "red";
}
