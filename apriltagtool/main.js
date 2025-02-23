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

                // Get the image data from the canvas
                var imageData = ctx.getImageData(0, 0, rcanvasres[0], rcanvasres[1]);
                var data = imageData.data;
                        
                // Create arrays for gradient magnitudes and directions
                var gradientMagnitude = new Uint8ClampedArray(data.length / 4);
                var gradientDirection = new Float32Array(data.length / 4);
                        
                // Convert to grayscale and compute gradients
                for (var y = 1; y < rcanvasres[1] - 1; y++) {
                    for (var x = 1; x < rcanvasres[0] - 1; x++) {
                        // Calculate the index for the current pixel
                        var idx = (y * rcanvasres[0] + x) * 4;
                        
                        // Get the grayscale value
                        var gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        
                        // Sobel operator kernels
                        var gx = (
                            -data[(y - 1) * rcanvasres[0] * 4 + (x - 1) * 4] + data[(y - 1) * rcanvasres[0] * 4 + (x + 1) * 4] +
                            -2 * data[y * rcanvasres[0] * 4 + (x - 1) * 4] + 2 * data[y * rcanvasres[0] * 4 + (x + 1) * 4] +
                            -data[(y + 1) * rcanvasres[0] * 4 + (x - 1) * 4] + data[(y + 1) * rcanvasres[0] * 4 + (x + 1) * 4]
                        );
                
                        var gy = (
                            -data[(y - 1) * rcanvasres[0] * 4 + (x - 1) * 4] - 2 * data[(y - 1) * rcanvasres[0] * 4 + x * 4] - data[(y - 1) * rcanvasres[0] * 4 + (x + 1) * 4] +
                            data[(y + 1) * rcanvasres[0] * 4 + (x - 1) * 4] + 2 * data[(y + 1) * rcanvasres[0] * 4 + x * 4] + data[(y + 1) * rcanvasres[0] * 4 + (x + 1) * 4]
                        );
                
                        // Calculate magnitude and direction
                        var magnitude = Math.sqrt(gx * gx + gy * gy);
                        var direction = Math.atan2(gy, gx); // Direction in radians
                
                        // Store the magnitude and direction
                        gradientMagnitude[idx / 4] = magnitude;
                        gradientDirection[idx / 4] = direction;
                    }
                }
        
                // Normalize the gradient magnitude for display
                var maxMagnitude = Math.max(...gradientMagnitude);
                for (var i = 0; i < gradientMagnitude.length; i++) {
                    gradientMagnitude[i] = (gradientMagnitude[i] / maxMagnitude) * 255; // Scale to 0-255
                }
        
                // Create a new image data array for the output
                var outputData = ctx.createImageData(rcanvasres[0], rcanvasres[1]);
                for (var i = 0; i < gradientMagnitude.length; i++) {
                    outputData.data[i * 4] = gradientMagnitude[i];     // Red
                    outputData.data[i * 4 + 1] = gradientMagnitude[i]; // Green
                    outputData.data[i * 4 + 2] = gradientMagnitude[i]; // Blue
                    outputData.data[i * 4 + 3] = 255;                  // Alpha (fully opaque)
                }
        
                // Put the output image data back to the canvas
                ctx.putImageData(outputData, 0, 0);

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
