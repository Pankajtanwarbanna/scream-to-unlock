(async () => {
    const { unlockUntil } = await chrome.storage.local.get("unlockUntil");
    const now = Date.now();

    if (unlockUntil && now < unlockUntil) return;

    // Create blocking overlay
    const blocker = document.createElement("div");
    blocker.id = "scream-blocker";
    blocker.innerHTML = `
    <div class="scream-container">
      <h1>🔒 Access Blocked</h1>
      <p class="instruction">Scream <strong>"I'm a loser"</strong> to unlock</p>
      <div class="meter-container">
        <div id="volumeBar" class="meter-fill"></div>
      </div>
      <p id="timeEstimate">Estimated Unlock Time: 0 sec</p>
      <p id="status">Waiting for microphone...</p>
    </div>
  `;
    document.body.innerHTML = "";
    document.body.appendChild(blocker);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);

        // Live volume meter
        const volumeBar = document.getElementById("volumeBar");
        const timeEstimate = document.getElementById("timeEstimate");

        function updateMeter() {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            const seconds = Math.min(Math.floor(avg), 300); // cap at 5 mins
            const percent = Math.min((avg / 255) * 100, 100);

            volumeBar.style.width = `${percent}%`;
            timeEstimate.textContent = `Estimated Unlock Time: ${seconds} sec`;

            requestAnimationFrame(updateMeter);
        }

        updateMeter();

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        document.getElementById("status").textContent = "Listening...";

        recognition.onresult = async (event) => {
            const spoken = event.results[0][0].transcript.toLowerCase();
            console.log({ spoken });
            if (spoken.includes("i'm a loser") || spoken.includes("i am a loser")) {
                analyser.getByteFrequencyData(dataArray);
                const avgVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                const seconds = Math.min(Math.floor(avgVolume), 300);

                await chrome.storage.local.set({ unlockUntil: Date.now() + seconds * 1000 });

                document.getElementById("status").textContent = `Unlocked for ${seconds} seconds!`;
                stream.getTracks().forEach(track => track.stop());
                setTimeout(() => {
                    blocker.remove();
                    location.reload();
                }, 1500);
            } else {
                document.getElementById("status").textContent = "Wrong phrase. Try again.";
                recognition.stop();
            }
        };

        recognition.onerror = () => {
            document.getElementById("status").textContent = "Mic error. Try again.";
        };

        recognition.start();
    } catch (err) {
        document.getElementById("status").textContent = "Microphone access denied.";
    }
})();
