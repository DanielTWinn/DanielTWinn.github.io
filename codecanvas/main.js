console.log("© 2026 Daniel Winn");
const version = 5;
console.log("V"+version);
document.getElementById("version").innerHTML = version;

function removeComments(code) {
    // Remove single-line comments (//)
    const singleLineCommentRemoved = code.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments (/* ... */)
    const multiLineCommentRemoved = singleLineCommentRemoved.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return multiLineCommentRemoved.trim(); // Return formatted code without comments
}

document.getElementById('create').addEventListener('click', function() {
    const textarea = document.getElementById('code');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const fontSize = document.getElementById('fontsize').value;
    const theme = document.getElementById('theme').value;

    if (theme == "apcsp") {
        textarea.value = removeComments(textarea.value);
    }

    if (theme != "codehs") {
        context.font = `${fontSize}px Monospace`; // Font size and font
    } else {
        context.font = `${fontSize}px Monaco`; // Font size and font
    }
    

    const lines = textarea.value.split('\n');
    
    // Calculate max width and height based on text
    const maxWidth = lines.reduce((max, line) => Math.max(max, context.measureText(line).width), 0);
    const totalHeight = lines.length * (parseInt(fontSize) + 10); // 10 for spacing

    // Set the canvas size
    canvas.width = maxWidth + 8; // Add padding
    canvas.height = totalHeight + 0; // Add padding

    // Clear the canvas before drawing new text
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    if (theme == "basic") {
        context.fillStyle = 'black'; // Text color
        context.font = `${fontSize}px Monospace`; // Font size and font 
    } else if (theme == "dark") {
        context.fillStyle = "#000000";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white'; // Text color
        context.font = `${fontSize}px Monospace`; // Font size and font 
    } else if (theme == "codeorg") {
        context.fillStyle = "#e5e5e5";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'black'; // Text color
        context.font = `${fontSize}px Monospace`; // Font size and font 
    } else if (theme == "codehs") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'black'; // Text color
        context.font = `${fontSize}px Monaco`; // Font size and font 
    } else if (theme == "apcsp") {
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'black'; // Text color
        context.font = `${fontSize}px Monospace`; // Font size and font 
    }
    

    // Draw each line on the canvas
    lines.forEach((line, index) => {
        context.fillText(line, 4, parseInt(fontSize) + (index * (parseInt(fontSize) + 10))); // Adjust Y position for each line
    });
});

function updatefs() {
    document.getElementById("fst").innerText = document.getElementById('fontsize').value;
}

document.getElementById('format').addEventListener('click', function() {
    const textarea = document.getElementById('code');
    const formattedCode = prettier.format(textarea.value, {
        parser: "babel",
        plugins: [prettierPlugins.babel],
        singleQuote: true,
        trailingComma: 'all',
    });
    textarea.value = formattedCode; // Set the formatted code back to the textarea
});

function generateFilename() {
    const now = new Date();
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();

    return `CC_${hours}-${minutes}-${seconds}_${month}-${day}-${year}`;
}

document.getElementById('downloadPng').addEventListener('click', function() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = generateFilename(); // Filename for PNG
    link.href = canvas.toDataURL('image/png');
    link.click();
});

document.getElementById('downloadJpg').addEventListener('click', function() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = generateFilename(); // Filename for JPG
    link.href = canvas.toDataURL('image/jpeg', 1.0); // 1.0 is for highest quality
    link.click();
});

document.getElementById('printCanvas').addEventListener('click', function() {
    const canvas = document.getElementById('canvas');
    const dataUrl = canvas.toDataURL(); // Get canvas data as a URL
    const iframe = document.createElement('iframe');

    iframe.style.position = 'absolute';
    iframe.style.visibility = 'hidden'; // Hide the iframe
    document.body.appendChild(iframe);

    // Write to the iframe
    iframe.contentWindow.document.write('<html><head><title>Code Canvas</title></head><body>');
    iframe.contentWindow.document.write('<img src="' + dataUrl + '" style="max-width:100%;"/>');
    iframe.contentWindow.document.write('</body></html>');
    iframe.contentWindow.document.close();

    // Trigger the print dialog
    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    // Clean up: Remove the iframe after printing
    document.body.removeChild(iframe);
});