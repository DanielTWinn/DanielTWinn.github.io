console.log("© 2025 Daniel Winn");
const version = 97;
console.log("V"+version);
document.getElementById("version").innerHTML = version;

function scaleVideoDimensions(width, height, maxPx = 400) {
   const aspectRatio = width / height;
   if (width > height) {
       return [Math.min(width, maxPx), Math.round(Math.min(maxPx / aspectRatio, height))];
   } else {
       return [Math.round(Math.min(maxPx * aspectRatio, width)), Math.min(height, maxPx)];
   }
}

function clusterPixels(gradientMagnitude, gradientDirection, width, height, magnitudeThreshold, directionThreshold) {
    const labels = new Array(gradientMagnitude.length).fill(-1);
    let currentLabel = 0;

    function isSimilar(g1, g2) {
        return (
            Math.abs(g1.magnitude - g2.magnitude) < magnitudeThreshold &&
            Math.abs(g1.direction - g2.direction) < directionThreshold
        );
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            if (labels[index] === -1) { // Not labeled yet
                labels[index] = currentLabel;
                const queue = [[x, y]];

                while (queue.length > 0) {
                    const [cx, cy] = queue.pop();
                    for (let ny = cy - 1; ny <= cy + 1; ny++) {
                        for (let nx = cx - 1; nx <= cx + 1; nx++) {
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const neighborIndex = ny * width + nx;
                                if (labels[neighborIndex] === -1 && isSimilar(
                                    { magnitude: gradientMagnitude[index], direction: gradientDirection[index] },
                                    { magnitude: gradientMagnitude[neighborIndex], direction: gradientDirection[neighborIndex] }
                                )) {
                                    labels[neighborIndex] = currentLabel;
                                    queue.push([nx, ny]);
                                }
                            }
                        }
                    }
                }
                currentLabel++;
            }
        }
    }

    return labels;
}

const colorPalette = [
    [255, 0, 0],    // Red
    [0, 255, 0],    // Green
    [0, 0, 255],    // Blue
    [255, 255, 0],  // Yellow
    [255, 0, 255],  // Magenta
    [0, 255, 255],  // Cyan
    [128, 0, 0],    // Maroon
    [0, 128, 0],    // Dark Green
    [0, 0, 128],    // Navy
    [128, 128, 0],  // Olive
    [128, 0, 128],  // Purple
    [0, 128, 128]   // Teal
];

function visualizeEdgeComponents(gradientMagnitude, width, height, edgeThreshold) {
    const outputImageData = new ImageData(width, height);
    const labels = new Array(gradientMagnitude.length).fill(-1);
    let currentLabel = 0;

    // Initialize the output image data to transparent
    for (let i = 0; i < outputImageData.data.length; i += 4) {
        outputImageData.data[i + 3] = 0; // Set alpha to 0 (transparent)
    }

    // First pass: Label the edges
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            if (gradientMagnitude[index] > edgeThreshold && labels[index] === -1) {
                // Start a new component
                currentLabel++;
                const queue = [[x, y]];

                while (queue.length > 0) {
                    const [cx, cy] = queue.pop();
                    const currentIndex = cy * width + cx;

                    // Label the current pixel
                    labels[currentIndex] = currentLabel;

                    // Check neighboring pixels
                    for (let ny = cy - 1; ny <= cy + 1; ny++) {
                        for (let nx = cx - 1; nx <= cx + 1; nx++) {
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const neighborIndex = ny * width + nx;
                                if (gradientMagnitude[neighborIndex] > edgeThreshold && labels[neighborIndex] === -1) {
                                    labels[neighborIndex] = currentLabel;
                                    queue.push([nx, ny]);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Second pass: Assign colors based on labels
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const label = labels[index];
            if (label > 0) { // Only color labeled edges
                const colorIndex = (label - 1) % colorPalette.length; // Cycle through the color palette
                const color = colorPalette[colorIndex];
                outputImageData.data[index * 4] = color[0];     // Red
                outputImageData.data[index * 4 + 1] = color[1]; // Green
                outputImageData.data[index * 4 + 2] = color[2]; // Blue
                outputImageData.data[index * 4 + 3] = 255;      // Alpha
            }
        }
    }

    return outputImageData;
}

function fitLineSegments(labels, gradientMagnitude, gradientDirection, width, height) {
    const lineSegments = [];
    const labelPoints = {};

    // Collect points for each label
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const label = labels[index];

            if (label > 0) {
                if (!labelPoints[label]) {
                    labelPoints[label] = [];
                }
                labelPoints[label].push({ x, y, magnitude: gradientMagnitude[index] });
            }
        }
    }

    // Fit a line segment for each label
    for (const points of Object.values(labelPoints)) {
        if (points.length < 2) continue; // Need at least two points to fit a line

        // Calculate the weighted average for the line fitting
        const sum = points.reduce((acc, point) => {
            acc.x += point.x * point.magnitude;
            acc.y += point.y * point.magnitude;
            acc.weight += point.magnitude;
            return acc;
        }, { x: 0, y: 0, weight: 0 });

        const avgX = sum.x / sum.weight;
        const avgY = sum.y / sum.weight;

        // Calculate the direction based on the points
        const direction = Math.atan2(avgY, avgX);
        const length = Math.sqrt(avgX * avgX + avgY * avgY);

        // Create start and end points based on the average position
        const start = { x: avgX - (length / 2) * Math.cos(direction), y: avgY - (length / 2) * Math.sin(direction) };
        const end = { x: avgX + (length / 2) * Math.cos(direction), y: avgY + (length / 2) * Math.sin(direction) };

        // Only add segments that are long enough
        if (length >= MIN_LENGTH_TO_DRAW) {
            lineSegments.push({ start, end });
        }
    }

    return { lineSegments, labelPoints }; // Return both line segments and label points
}

// Adjustable thresholds
const MIN_LENGTH_TO_DRAW = 8; // Minimum length to draw a line segment
const MAX_LENGTH_FOR_GREEN = 20; // Maximum length for a line segment to be green

function drawPoints(ctx, points) {
    ctx.fillStyle = 'blue'; // Color for points
    points.forEach(point => {
        ctx.fillRect(point.x, point.y, 2, 2); // Draw small squares for points
    });
}

try {
        const cameraVideoStream = document.getElementById('camera-stream');
        var gcanvas = document.getElementById('gcanvas');
        var gctx = gcanvas.getContext('2d');
        var ccanvas = document.getElementById('ccanvas');
        var cctx = ccanvas.getContext('2d');
        var lcanvas = document.getElementById('lcanvas');
        var lctx = lcanvas.getContext('2d');

        gcanvas.style.width ='100%';
        gcanvas.style.height='100%';
        ccanvas.style.width ='100%';
        ccanvas.style.height='100%';
        lcanvas.style.width ='100%';
        lcanvas.style.height='100%';
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
                        gcanvas.width  = restemp[0];
                        gcanvas.height = restemp[1];
                        ccanvas.width  = restemp[0];
                        ccanvas.height = restemp[1];
                        lcanvas.width  = restemp[0];
                        lcanvas.height = restemp[1];
                        document.getElementById('canstats').innerHTML = "FPS: ? | Full Resolution: "+canvasres;
                })
        }

        document.getElementById('turn').addEventListener('click', function() {
                var t = rcanvasres[0];
                rcanvasres[0] = rcanvasres[1];
                rcanvasres[1] = t;
                canvasres = rcanvasres[0]+"x"+rcanvasres[1];
                gcanvas.width  = rcanvasres[0];
                gcanvas.height = rcanvasres[1];
                ccanvas.width  = rcanvasres[0];
                ccanvas.height = rcanvasres[1];
                lcanvas.width  = rcanvasres[0];
                lcanvas.height = rcanvasres[1];
        });

        var count = 0;
        var startTime = Date.now(); 

        requestAnimationFrame(function loop() {
                count++;
                gctx.drawImage(cameraVideoStream, 0, 0, rcanvasres[0], rcanvasres[1]);

                // Get the image data from the canvas
                var imageData = gctx.getImageData(0, 0, rcanvasres[0], rcanvasres[1]);
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
                var outputData = gctx.createImageData(rcanvasres[0], rcanvasres[1]);
                for (var i = 0; i < gradientMagnitude.length; i++) {
                    outputData.data[i * 4] = gradientMagnitude[i];     // Red
                    outputData.data[i * 4 + 1] = gradientMagnitude[i]; // Green
                    outputData.data[i * 4 + 2] = gradientMagnitude[i]; // Blue
                    outputData.data[i * 4 + 3] = 255;                  // Alpha (fully opaque)
                }
        
                // Put the output image data back to the gcanvas
                gctx.putImageData(outputData, 0, 0);

                // Step 2: Cluster pixels
                const magnitudeThreshold = 10; // Set your threshold for magnitude
                const directionThreshold = Math.PI / 8; // Set your threshold for direction (in radians)
                const labels = clusterPixels(gradientMagnitude, gradientDirection, rcanvasres[0], rcanvasres[1], magnitudeThreshold, directionThreshold);

                // Step 3: Visualize edges based on the gradient magnitudes
                const edgeThreshold = 50; // Set your threshold for edge detection
                const outputImageData = visualizeEdgeComponents(gradientMagnitude, rcanvasres[0], rcanvasres[1], edgeThreshold);

                // Put the output image data back to the canvas
                cctx.putImageData(outputImageData, 0, 0);

                // Fit line segments to the clustered pixels and get label points
                const { lineSegments, labelPoints } = fitLineSegments(labels, gradientMagnitude, gradientDirection, rcanvasres[0], rcanvasres[1]);

                // Clear the canvas before drawing the new frame
                lctx.clearRect(0, 0, rcanvasres[0], rcanvasres[1]);

                // Draw the collected points for debugging
                for (const points of Object.values(labelPoints)) {
                    drawPoints(lctx, points);
                }

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
