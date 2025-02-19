if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    console.log("Let's get this party started")
}

navigator.mediaDevices.getUserMedia({video: true})
