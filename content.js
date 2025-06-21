(async () => {
    const { unlockUntil } = await chrome.storage.local.get("unlockUntil");
    const now = Date.now();

    if (unlockUntil && now < unlockUntil) return;

    // Create blocking overlay with enhanced UI
    const blocker = document.createElement("div");
    blocker.id = "scream-blocker";
    blocker.innerHTML = `
    <div class="scream-container">
      <div class="lock-icon">
        <div class="lock-body"></div>
        <div class="lock-shackle"></div>
      </div>
      
      <h1 class="main-title">Access Restricted</h1>
      
      <div class="phrase-container">
        <p class="instruction-text">Speak the phrase to unlock:</p>
        <div class="phrase-display">
          <span class="phrase-word" data-word="i'm">I'm</span>
          <span class="phrase-word" data-word="a">a</span>
          <span class="phrase-word" data-word="loser">loser</span>
        </div>
      </div>

      <div class="audio-visualizer">
        <div class="wave-container">
          ${Array.from({ length: 50 }, (_, i) => `<div class="wave-bar" style="animation-delay: ${i * 20}ms"></div>`).join('')}
        </div>
        <div class="volume-indicator">
          <div class="volume-fill"></div>
        </div>
        <p class="volume-label">Speak louder for more unlock time</p>
      </div>

      <div class="time-display">
        <div class="time-circle">
          <svg class="progress-ring" width="120" height="120">
            <circle class="progress-ring-circle" cx="60" cy="60" r="50" fill="transparent" stroke="#333" stroke-width="8"/>
            <circle class="progress-ring-progress" cx="60" cy="60" r="50" fill="transparent" stroke="#00ff88" stroke-width="8"/>
          </svg>
          <div class="time-content">
            <span class="time-value">0</span>
            <span class="time-unit">sec</span>
          </div>
        </div>
        <p class="time-label">Unlock Duration</p>
      </div>

      <div class="status-container">
        <div class="status-indicator"></div>
        <p id="status" class="status-text">Initializing microphone...</p>
      </div>
    </div>
  `;

    document.body.innerHTML = "";
    document.body.appendChild(blocker);

    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
      #scream-blocker {
        position: fixed;
        inset: 0;
        background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
        color: #fff;
        font-family: 'Inter', 'Segoe UI', sans-serif;
        z-index: 999999;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
      }

      #scream-blocker::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%);
        animation: backgroundPulse 8s ease-in-out infinite;
      }

      @keyframes backgroundPulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }

      .scream-container {
        text-align: center;
        padding: 3rem;
        max-width: 700px;
        position: relative;
        z-index: 1;
      }

      .lock-icon {
        position: relative;
        width: 60px;
        height: 60px;
        margin: 0 auto 2rem;
        animation: lockFloat 3s ease-in-out infinite;
      }

      @keyframes lockFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      .lock-body {
        width: 40px;
        height: 30px;
        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
        border-radius: 8px;
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        box-shadow: 0 4px 20px rgba(255, 107, 107, 0.3);
      }

      .lock-shackle {
        width: 25px;
        height: 25px;
        border: 4px solid #ff6b6b;
        border-bottom: none;
        border-radius: 25px 25px 0 0;
        position: absolute;
        top: 5px;
        left: 50%;
        transform: translateX(-50%);
      }

      .main-title {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 2rem;
        background: linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: gradientShift 3s ease infinite;
      }

      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .phrase-container {
        margin-bottom: 3rem;
      }

      .instruction-text {
        font-size: 1.1rem;
        color: #a0a0a0;
        margin-bottom: 1rem;
        font-weight: 400;
      }

      .phrase-display {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin: 1.5rem 0;
      }

      .phrase-word {
        font-size: 2.5rem;
        font-weight: 700;
        padding: 0.8rem 1.5rem;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .phrase-word::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: all 0.6s;
      }

      .phrase-word.speaking {
        background: rgba(0, 255, 136, 0.2);
        border-color: #00ff88;
        transform: scale(1.05);
        box-shadow: 0 8px 32px rgba(0, 255, 136, 0.3);
      }

      .phrase-word.speaking::before {
        left: 100%;
      }

      .audio-visualizer {
        margin: 3rem 0;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(10px);
      }

      .wave-container {
        display: flex;
        justify-content: center;
        align-items: end;
        gap: 3px;
        height: 80px;
        margin-bottom: 1.5rem;
      }

      .wave-bar {
        width: 4px;
        height: 8px;
        background: linear-gradient(to top, #4ecdc4, #00ff88);
        border-radius: 2px;
        animation: waveIdle 2s ease-in-out infinite;
      }

      @keyframes waveIdle {
        0%, 100% { height: 8px; opacity: 0.3; }
        50% { height: 20px; opacity: 0.6; }
      }

      .wave-bar.active {
        animation: waveActive 0.1s ease-in-out;
        height: var(--wave-height, 8px);
        opacity: 1;
      }

      @keyframes waveActive {
        0% { transform: scaleY(0.8); }
        100% { transform: scaleY(1); }
      }

      .volume-indicator {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }

      .volume-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #4ecdc4, #00ff88, #45b7d1);
        border-radius: 4px;
        transition: width 0.1s ease;
        position: relative;
      }

      .volume-fill::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 20px;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4));
        animation: shimmer 1.5s ease-in-out infinite;
      }

      @keyframes shimmer {
        0% { transform: translateX(-20px); }
        100% { transform: translateX(20px); }
      }

      .volume-label {
        font-size: 0.9rem;
        color: #a0a0a0;
        margin: 0;
      }

      .time-display {
        margin: 3rem 0;
      }

      .time-circle {
        position: relative;
        display: inline-block;
        margin-bottom: 1rem;
      }

      .progress-ring {
        transform: rotate(-90deg);
      }

      .progress-ring-progress {
        stroke-dasharray: 314;
        stroke-dashoffset: 314;
        transition: stroke-dashoffset 0.3s ease;
        filter: drop-shadow(0 0 8px #00ff88);
      }

      .time-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .time-value {
        font-size: 2rem;
        font-weight: 700;
        color: #00ff88;
        text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
      }

      .time-unit {
        font-size: 0.8rem;
        color: #a0a0a0;
        font-weight: 500;
      }

      .time-label {
        font-size: 1rem;
        color: #a0a0a0;
        margin: 0;
      }

      .status-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
        padding: 1rem 2rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ffa500;
        animation: statusPulse 2s ease-in-out infinite;
      }

      @keyframes statusPulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }

      .status-indicator.listening {
        background: #00ff88;
        animation: statusListening 1s ease-in-out infinite;
      }

      @keyframes statusListening {
        0%, 100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7); }
        50% { box-shadow: 0 0 0 8px rgba(0, 255, 136, 0); }
      }

      .status-indicator.success {
        background: #00ff88;
        animation: statusSuccess 0.6s ease;
      }

      @keyframes statusSuccess {
        0% { transform: scale(1); }
        50% { transform: scale(1.5); }
        100% { transform: scale(1); }
      }

      .status-text {
        font-size: 1rem;
        margin: 0;
        font-weight: 500;
      }

      .unlock-animation {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 4rem;
        font-weight: 800;
        color: #00ff88;
        text-shadow: 0 0 30px rgba(0, 255, 136, 0.8);
        animation: unlockPop 2s ease;
        z-index: 1000;
        pointer-events: none;
      }

      @keyframes unlockPop {
        0% { 
          opacity: 0; 
          transform: translate(-50%, -50%) scale(0.5); 
        }
        20% { 
          opacity: 1; 
          transform: translate(-50%, -50%) scale(1.2); 
        }
        40% { 
          transform: translate(-50%, -50%) scale(1); 
        }
        100% { 
          opacity: 0; 
          transform: translate(-50%, -50%) scale(1); 
        }
      }

      /* Enhanced Unlock Success Screen */
      .unlock-success-screen {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: scale(0.9);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 10;
      }

      .unlock-success-screen.show {
        opacity: 1;
        transform: scale(1);
      }

      .unlock-success-screen::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at center, rgba(0, 255, 136, 0.1) 0%, transparent 70%);
        animation: successPulse 2s ease-in-out infinite;
      }

      @keyframes successPulse {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.1); opacity: 0.6; }
      }

      .unlock-content {
        text-align: center;
        color: #fff;
        z-index: 1;
        position: relative;
        max-width: 600px;
        padding: 2rem;
      }

      .unlock-icon-container {
        position: relative;
        margin-bottom: 2rem;
      }

      .unlock-icon {
        font-size: 5rem;
        animation: unlockBounce 1s ease-out;
        display: inline-block;
        filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3));
      }

      @keyframes unlockBounce {
        0% { transform: scale(0) rotate(0deg); }
        50% { transform: scale(1.2) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); }
      }

      .unlock-rays {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 200px;
        height: 200px;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
        background-size: 20px 20px;
        border-radius: 50%;
        animation: raysRotate 3s linear infinite;
        z-index: -1;
      }

      @keyframes raysRotate {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }

      .unlock-title {
        font-size: 3.5rem;
        font-weight: 900;
        margin-bottom: 2rem;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: titleSlideUp 0.8s ease-out 0.3s both;
      }

      @keyframes titleSlideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .unlock-time-display {
        margin: 2rem 0;
        animation: timeSlideUp 0.8s ease-out 0.5s both;
      }

      @keyframes timeSlideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .unlock-time-circle {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 150px;
        height: 150px;
        background: rgba(255, 255, 255, 0.2);
        border: 4px solid rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        animation: timeCirclePulse 2s ease-in-out infinite;
      }

      @keyframes timeCirclePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      .unlock-time-value {
        font-size: 3rem;
        font-weight: 900;
        line-height: 1;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }

      .unlock-time-unit {
        font-size: 0.9rem;
        font-weight: 600;
        opacity: 0.8;
        letter-spacing: 1px;
      }

      .performance-feedback {
        margin: 2rem 0;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        backdrop-filter: blur(10px);
        animation: feedbackSlideUp 0.8s ease-out 0.7s both;
      }

      @keyframes feedbackSlideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .performance-message {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .performance-weak .performance-message { color: #ffeb3b; }
      .performance-okay .performance-message { color: #ff9800; }
      .performance-good .performance-message { color: #fff; }
      .performance-epic .performance-message { 
        color: #fff; 
        animation: epicGlow 1s ease-in-out infinite alternate;
      }

      @keyframes epicGlow {
        from { text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
        to { text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 2px 8px rgba(0, 0, 0, 0.2); }
      }

      .volume-rating {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        font-weight: 600;
      }

      .rating-bars {
        display: flex;
        gap: 4px;
      }

      .rating-bar {
        width: 8px;
        height: 20px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        transition: all 0.3s ease;
      }

      .rating-bar.active {
        background: #fff;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
        animation: barGlow 0.6s ease-out;
      }

      @keyframes barGlow {
        0% { transform: scaleY(0.5); }
        50% { transform: scaleY(1.2); }
        100% { transform: scaleY(1); }
      }

      .countdown-container {
        margin-top: 2rem;
        animation: countdownSlideUp 0.8s ease-out 0.9s both;
      }

      @keyframes countdownSlideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .countdown-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }

      .countdown-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.8));
        border-radius: 4px;
        transition: width 1s linear;
      }

      .countdown-text {
        font-size: 1rem;
        opacity: 0.9;
        margin: 0;
      }

      .countdown-timer {
        font-weight: 700;
        color: #fff;
      }
    `;

    document.head.appendChild(style);

    // Get DOM elements
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('status');
    const volumeFill = document.querySelector('.volume-fill');
    const timeValue = document.querySelector('.time-value');
    const progressRing = document.querySelector('.progress-ring-progress');
    const waveBars = document.querySelectorAll('.wave-bar');
    const phraseWords = document.querySelectorAll('.phrase-word');

    // Progress ring circumference
    const circumference = 2 * Math.PI * 50;
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);

        statusIndicator.classList.add('listening');
        statusText.textContent = "Listening for your voice...";

        function updateVisualizer() {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            const maxVolume = Math.max(...dataArray);

            // Update volume bar
            const volumePercent = Math.min((avg / 128) * 100, 100);
            volumeFill.style.width = `${volumePercent}%`;

            // Update time estimate
            const seconds = Math.min(Math.floor(avg * 2), 420); // Increased multiplier and max time
            timeValue.textContent = seconds;

            // Update progress ring
            const progress = Math.min((seconds / 420) * 100, 100); // Updated to match new max time
            const offset = circumference - (progress / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;

            // Update wave bars
            waveBars.forEach((bar, index) => {
                const frequency = dataArray[Math.floor(index * dataArray.length / waveBars.length)];
                const height = Math.max(8, (frequency / 255) * 80);
                bar.style.setProperty('--wave-height', `${height}px`);
                bar.classList.add('active');
            });

            requestAnimationFrame(updateVisualizer);
        }

        updateVisualizer();

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = true;

        let currentWordIndex = 0;
        const targetWords = ['i\'m', 'a', 'loser'];

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();

            // Highlight words as they're spoken
            targetWords.forEach((word, index) => {
                if (transcript.includes(word)) {
                    phraseWords[index].classList.add('speaking');
                }
            });

            if (event.results[0].isFinal) {
                if (transcript.includes("i'm a loser") || transcript.includes("i am a loser")) {
                    analyser.getByteFrequencyData(dataArray);
                    const avgVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    const seconds = Math.min(Math.floor(avgVolume * 1.5), 300);

                    // Create enhanced unlock screen
                    await showUnlockSuccess(seconds, avgVolume);

                    await chrome.storage.local.set({ unlockUntil: Date.now() + seconds * 1000 });
                    stream.getTracks().forEach(track => track.stop());

                    setTimeout(() => {
                        blocker.remove();
                        location.reload();
                    }, 6000); // Increased to 6 seconds for better visibility
                } else {
                    statusText.textContent = "❌ Wrong phrase. Please try again.";
                    phraseWords.forEach(word => word.classList.remove('speaking'));
                    setTimeout(() => {
                        statusText.textContent = "Listening for your voice...";
                        recognition.start();
                    }, 1500);
                }
            }
        };

        recognition.onerror = () => {
            statusText.textContent = "🎤 Microphone error. Click to try again.";
            statusIndicator.addEventListener('click', () => {
                recognition.start();
                statusText.textContent = "Listening for your voice...";
            });
        };

        recognition.start();
    } catch (err) {
        statusText.textContent = "🚫 Microphone access denied. Please allow microphone access.";
    }

    // Enhanced unlock success screen
    async function showUnlockSuccess(seconds, volume) {
        // Hide main container
        document.querySelector('.scream-container').style.display = 'none';

        // Create unlock success screen
        const unlockScreen = document.createElement('div');
        unlockScreen.className = 'unlock-success-screen';

        // Determine performance message based on volume
        let performanceMsg = "";
        let performanceClass = "";

        if (volume < 30) {
            performanceMsg = "You sound like a mouse! 🐭 Speak louder next time for more unlock time.";
            performanceClass = "performance-weak";
        } else if (volume < 60) {
            performanceMsg = "Not bad, but you can do better! 😐 Try screaming louder for maximum unlock time.";
            performanceClass = "performance-okay";
        } else if (volume < 100) {
            performanceMsg = "Great job! 🔥 That was a proper scream! You earned good unlock time.";
            performanceClass = "performance-good";
        } else {
            performanceMsg = "AMAZING! 🚀 That was an epic scream! Maximum unlock time achieved!";
            performanceClass = "performance-epic";
        }

        unlockScreen.innerHTML = `
            <div class="unlock-content">
                <div class="unlock-icon-container">
                    <div class="unlock-icon">🔓</div>
                    <div class="unlock-rays"></div>
                </div>
                
                <h1 class="unlock-title">ACCESS GRANTED!</h1>
                
                <div class="unlock-time-display">
                    <div class="unlock-time-circle">
                        <div class="unlock-time-value">${seconds}</div>
                        <div class="unlock-time-unit">SECONDS</div>
                    </div>
                </div>
                
                <div class="performance-feedback ${performanceClass}">
                    <p class="performance-message">${performanceMsg}</p>
                    <div class="volume-rating">
                        <span class="rating-label">Your Volume:</span>
                        <div class="rating-bars">
                            ${Array.from({ length: 5 }, (_, i) =>
            `<div class="rating-bar ${i < Math.ceil(volume / 25) ? 'active' : ''}"></div>`
        ).join('')}
                        </div>
                        <span class="rating-text">${Math.round(volume)}/125</span>
                    </div>
                </div>
                
                <div class="countdown-container">
                    <div class="countdown-bar">
                        <div class="countdown-fill"></div>
                    </div>
                    <p class="countdown-text">Redirecting in <span class="countdown-timer">6</span> seconds...</p>
                </div>
            </div>
        `;

        document.getElementById('scream-blocker').appendChild(unlockScreen);

        // Start countdown animation
        const countdownFill = unlockScreen.querySelector('.countdown-fill');
        const countdownTimer = unlockScreen.querySelector('.countdown-timer');

        let timeLeft = 6;
        const countdownInterval = setInterval(() => {
            timeLeft--;
            countdownTimer.textContent = timeLeft;
            countdownFill.style.width = `${((6 - timeLeft) / 6) * 100}%`;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);

        // Trigger animations
        setTimeout(() => unlockScreen.classList.add('show'), 100);
    }
})();