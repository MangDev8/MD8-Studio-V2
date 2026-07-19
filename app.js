/**
 * ==========================================================================
 * MD8 STUDIO - APP ENGINE
 * Core state, Canvas renderer, Audio Mixer, TTS engine, and Exporter
 * ==========================================================================
 */

// Global State
const state = {
    projectName: "Manga Video Creator",
    images: [], // { id, name, url, element }
    voAudio: null, // { file, url, buffer, duration }
    bgmType: "", // "procedural-lofi", "procedural-synth", "procedural-piano", "custom"
    bgmAudio: null, // { file, url, buffer, duration }
    voVolume: 1.0,
    bgmVolume: 0.12,
    segments: [], // { id, start, end, imageId, cameraMotion, text }
    currentTime: 0.0,
    isPlaying: false,
    isMuted: false,
    isCollapsed: false,
    aspectRatio: "16:9", // "16:9", "9:16", "1:1"
    previewResolution: { width: 1280, height: 720 },
    
    // Active/selected segment for direct image assignment
    selectedSegmentId: null,
  
    // Subtitle Properties
    subtitleStyles: {
      font: "Outfit",
      color: "#FFFFFF",
      size: 24,
      animation: "highlight" // "highlight", "progressive", "full"
    },
  
    // TTS / Speech Synthesis state
    ttsVoiceName: "system-default",
    activeUtterance: null,
    
    // Animation & Audio engine
    audioContext: null,
    voSourceNode: null,
    bgmSourceNode: null,
    voGainNode: null,
    bgmGainNode: null,
    analyserNode: null, // For DB volume meter
    mixedAudioDestination: null,
    playbackStartTime: 0,
    pausedTimeOffset: 0,
    animationFrameId: null,
    
    // Synth states
    synthNodes: [],
    synthIntervalId: null,
  
    // Export state
    isExporting: false,
    exportRecorder: null,
    exportChunks: [],
    exportStartTime: 0
  };
  
  // UI Element Selectors
  const el = {
    projectNameInput: document.getElementById("projectName"),
    
    // Media Uploads
    voUploadZone: document.getElementById("voUploadZone"),
    voFileInput: document.getElementById("voFileInput"),
    voUploadContent: document.getElementById("voUploadContent"),
    btnDeleteVO: document.getElementById("btnDeleteVO"),
    
    bgmSelect: document.getElementById("bgmSelect"),
    bgmFileInput: document.getElementById("bgmFileInput"),
    btnDeleteBGM: document.getElementById("btnDeleteBGM"),
    
    voVolumeSlider: document.getElementById("voVolumeSlider"),
    voVolumeVal: document.getElementById("voVolumeVal"),
    bgmVolumeSlider: document.getElementById("bgmVolumeSlider"),
    bgmVolumeVal: document.getElementById("bgmVolumeVal"),
    
    mangaUploadZone: document.getElementById("mangaUploadZone"),
    mangaFileInput: document.getElementById("mangaFileInput"),
    btnClearManga: document.getElementById("btnClearManga"),
    mangaStatusBadge: document.getElementById("mangaStatusBadge"),
    mangaCount: document.getElementById("mangaCount"),
    mangaCountTotal: document.getElementById("mangaCountTotal"),
    mangaFileList: document.getElementById("mangaFileList"),
    
    // TTS Controls
    ttsVoiceSelect: document.getElementById("ttsVoiceSelect"),
    btnGenerateAllTts: document.getElementById("btnGenerateAllTts"),
  
    // Subtitle Customizations
    subFontSelect: document.getElementById("subFontSelect"),
    subColorSelect: document.getElementById("subColorSelect"),
    subSizeSlider: document.getElementById("subSizeSlider"),
    subSizeVal: document.getElementById("subSizeVal"),
    subStyleSelect: document.getElementById("subStyleSelect"),
  
    // Player
    playerCanvas: document.getElementById("playerCanvas"),
    subtitleOverlay: document.getElementById("subtitleOverlay"),
    playbackIndicator: document.getElementById("playbackIndicator"),
    btnPrevFrame: document.getElementById("btnPrevFrame"),
    btnPlayPause: document.getElementById("btnPlayPause"),
    playIcon: document.getElementById("playIcon"),
    pauseIcon: document.getElementById("pauseIcon"),
    currentTimeDisplay: document.getElementById("currentTime"),
    totalTimeDisplay: document.getElementById("totalTime"),
    btnMute: document.getElementById("btnMute"),
    volumeIcon: document.getElementById("volumeIcon"),
    muteIcon: document.getElementById("muteIcon"),
    btnHidePanel: document.getElementById("btnHidePanel"),
    btnPlaybackPreview: document.getElementById("btnPlaybackPreview"),
    sidebar: document.getElementById("sidebar"),
    videoScrubber: document.getElementById("videoScrubber"),
    scrubberTicks: document.getElementById("scrubberTicks"),
    
    // Audio DB Meter
    dbMeterCanvas: document.getElementById("dbMeterCanvas"),
  
    // Timeline Tab
    tabButtons: document.querySelectorAll(".tab-btn"),
    tabPanes: document.querySelectorAll(".tab-pane"),
    btnAddSegment: document.getElementById("btnAddSegment"),
    mangaTimelineCount: document.getElementById("mangaTimelineCount"),
    segmentRowsContainer: document.getElementById("segmentRowsContainer"),
    
    // Script Naskah Tab
    btnSyncWithVO: document.getElementById("btnSyncWithVO"),
    btnSyncWithTTS: document.getElementById("btnSyncWithTTS"),
    scriptTextarea: document.getElementById("scriptTextarea"),
    
    // Header Buttons
    btnExport: document.getElementById("btnExport"),
    btnSave: document.getElementById("btnSave"),
    btnAspects: document.querySelectorAll(".btn-aspect"),
    
    // Export Modal
    modalExportOverlay: document.getElementById("modalExportOverlay"),
    btnCancelExport: document.getElementById("btnCancelExport"),
    exportProgressBar: document.getElementById("exportProgressBar"),
    exportStatusText: document.getElementById("exportStatusText"),
    exportProgressText: document.getElementById("exportProgressText"),
    exportPreviewCanvas: document.getElementById("exportPreviewCanvas"),
    
    // Toast
    toastNotification: document.getElementById("toastNotification"),
    toastMessage: document.getElementById("toastMessage")
  };
  
  // Canvas Context
  const ctx = el.playerCanvas.getContext("2d");
  const dbCtx = el.dbMeterCanvas.getContext("2d");
  
  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================
  function showToast(message, duration = 3000) {
    el.toastMessage.textContent = message;
    el.toastNotification.classList.remove("hidden");
    
    if (el.toastNotification.timeoutId) {
      clearTimeout(el.toastNotification.timeoutId);
    }
    
    el.toastNotification.timeoutId = setTimeout(() => {
      el.toastNotification.classList.add("hidden");
    }, duration);
  }
  
  // ==========================================================================
  // EVENT INITIALIZATION
  // ==========================================================================
  function initEvents() {
    // Project Title
    el.projectNameInput.addEventListener("input", (e) => {
      state.projectName = e.target.value;
    });
    
    // Aspect Ratio Preset Toggles
    el.btnAspects.forEach(btn => {
      btn.addEventListener("click", () => {
        el.btnAspects.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        changeAspectRatioPreset(btn.dataset.ratio);
      });
    });
  
    // VO Upload
    el.voUploadZone.addEventListener("click", () => el.voFileInput.click());
    el.voFileInput.addEventListener("change", handleVoFileSelect);
    el.btnDeleteVO.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteVO();
    });
  
    // BGM Dropdown
    el.bgmSelect.addEventListener("change", handleBgmSelectChange);
    el.bgmFileInput.addEventListener("change", handleBgmFileSelect);
    el.btnDeleteBGM.addEventListener("click", deleteBGM);
  
    // Volume Sliders
    el.voVolumeSlider.addEventListener("input", handleVoVolumeChange);
    el.bgmVolumeSlider.addEventListener("input", handleBgmVolumeChange);
  
    // Manga Upload
    el.mangaUploadZone.addEventListener("click", () => el.mangaFileInput.click());
    el.mangaFileInput.addEventListener("change", handleMangaFilesSelect);
    el.btnClearManga.addEventListener("click", clearAllManga);
  
    // TTS Setup
    el.ttsVoiceSelect.addEventListener("change", (e) => {
      state.ttsVoiceName = e.target.value;
    });
    el.btnGenerateAllTts.addEventListener("click", generateAllTtsVoices);
  
    // Subtitle custom styles
    el.subFontSelect.addEventListener("change", (e) => {
      state.subtitleStyles.font = e.target.value;
      drawFrame();
    });
    el.subColorSelect.addEventListener("change", (e) => {
      state.subtitleStyles.color = e.target.value;
      drawFrame();
    });
    el.subSizeSlider.addEventListener("input", (e) => {
      const val = e.target.value;
      state.subtitleStyles.size = parseInt(val);
      el.subSizeVal.textContent = val + "px";
      drawFrame();
    });
    el.subStyleSelect.addEventListener("change", (e) => {
      state.subtitleStyles.animation = e.target.value;
      drawFrame();
    });
  
    // Player controls
    el.btnPlayPause.addEventListener("click", togglePlayPause);
    el.btnPrevFrame.addEventListener("click", seekToStart);
    el.btnMute.addEventListener("click", toggleMute);
    el.btnHidePanel.addEventListener("click", toggleSidebar);
    el.btnPlaybackPreview.addEventListener("click", togglePlaybackPreviewMode);
    
    // Seek bar
    el.videoScrubber.addEventListener("input", handleScrubberSeek);
  
    // Tab switching
    el.tabButtons.forEach(btn => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
  
    // Segments add
    el.btnAddSegment.addEventListener("click", addNewSegmentManual);
  
    // Script Naskah Tab actions
    el.btnSyncWithVO.addEventListener("click", syncScriptWithLocalVO);
    el.btnSyncWithTTS.addEventListener("click", syncScriptWithTTSVoice);
  
    // Header Save / Export
    el.btnSave.addEventListener("click", saveProjectLocal);
    el.btnExport.addEventListener("click", startExportingVideo);
    el.btnCancelExport.addEventListener("click", cancelExport);
  }
  
  // ==========================================================================
  // ASPECT RATIO CONTROLS
  // ==========================================================================
  function changeAspectRatioPreset(ratio) {
    state.aspectRatio = ratio;
    
    let w = 1280;
    let h = 720;
  
    if (ratio === "9:16") {
      w = 720;
      h = 1280;
      el.viewportAspect.style.aspectRatio = "9 / 16";
      el.viewportAspect.style.width = "auto";
      el.viewportAspect.style.height = "100%";
    } else if (ratio === "1:1") {
      w = 720;
      h = 720;
      el.viewportAspect.style.aspectRatio = "1 / 1";
      el.viewportAspect.style.width = "auto";
      el.viewportAspect.style.height = "100%";
    } else {
      // 16:9
      w = 1280;
      h = 720;
      el.viewportAspect.style.aspectRatio = "16 / 9";
      el.viewportAspect.style.width = "100%";
      el.viewportAspect.style.height = "auto";
    }
  
    state.previewResolution = { width: w, height: h };
    el.playerCanvas.width = w;
    el.playerCanvas.height = h;
    
    drawFrame();
    showToast(`Rasio aspek diubah ke ${ratio === "16:9" ? "YouTube (16:9)" : ratio === "9:16" ? "TikTok (9:16)" : "Instagram (1:1)"}`);
  }
  
  // ==========================================================================
  // WEB AUDIO GRAPH & master ANALYSER
  // ==========================================================================
  function initAudio() {
    if (state.audioContext) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContextClass();
    
    // Analyser node for DB level meter
    state.analyserNode = state.audioContext.createAnalyser();
    state.analyserNode.fftSize = 64; // High frequency speed, small resolution
    
    // Setup Gains
    state.voGainNode = state.audioContext.createGain();
    state.bgmGainNode = state.audioContext.createGain();
    
    state.voGainNode.gain.value = state.voVolume;
    state.bgmGainNode.gain.value = state.bgmVolume;
    
    // Connect mixer graph
    state.voGainNode.connect(state.analyserNode);
    state.bgmGainNode.connect(state.analyserNode);
    state.analyserNode.connect(state.audioContext.destination);
  }
  
  // Volume handlers
  function handleVoVolumeChange(e) {
    const val = parseInt(e.target.value);
    el.voVolumeVal.textContent = val + "%";
    state.voVolume = val / 100;
    if (state.voGainNode) {
      state.voGainNode.gain.setValueAtTime(state.voVolume, state.audioContext.currentTime);
    }
  }
  
  function handleBgmVolumeChange(e) {
    const val = parseInt(e.target.value);
    el.bgmVolumeVal.textContent = val + "%";
    state.bgmVolume = val / 100;
    if (state.bgmGainNode) {
      state.bgmGainNode.gain.setValueAtTime(state.bgmVolume, state.audioContext.currentTime);
    }
  }
  
  function toggleMute() {
    state.isMuted = !state.isMuted;
    if (state.isMuted) {
      el.volumeIcon.classList.add("hidden");
      el.muteIcon.classList.remove("hidden");
      if (state.voGainNode) state.voGainNode.gain.setValueAtTime(0, state.audioContext.currentTime);
      if (state.bgmGainNode) state.bgmGainNode.gain.setValueAtTime(0, state.audioContext.currentTime);
    } else {
      el.volumeIcon.classList.remove("hidden");
      el.muteIcon.classList.add("hidden");
      if (state.voGainNode) state.voGainNode.gain.setValueAtTime(state.voVolume, state.audioContext.currentTime);
      if (state.bgmGainNode) state.bgmGainNode.gain.setValueAtTime(state.bgmVolume, state.audioContext.currentTime);
    }
  }
  
  // Real-time DB volume rendering loop
  function drawDbMeter() {
    dbCtx.clearRect(0, 0, el.dbMeterCanvas.width, el.dbMeterCanvas.height);
    
    if (!state.isPlaying || !state.analyserNode || state.isMuted) {
      // Draw empty database bar
      dbCtx.fillStyle = "#16162a";
      dbCtx.fillRect(0, 0, el.dbMeterCanvas.width, el.dbMeterCanvas.height);
      return;
    }
  
    const bufferLength = state.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    state.analyserNode.getByteFrequencyData(dataArray);
  
    // Compute RMS/average amplitude
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const avg = sum / bufferLength;
    const percentage = Math.min(1.0, avg / 140); // Standardize scale factor
  
    // Draw DB bar with modern audio colors (Green to Yellow to Red)
    const barW = el.dbMeterCanvas.width * percentage;
    const gradient = dbCtx.createLinearGradient(0, 0, el.dbMeterCanvas.width, 0);
    gradient.addColorStop(0, "#10b981"); // green
    gradient.addColorStop(0.7, "#f59e0b"); // yellow
    gradient.addColorStop(1, "#ef4444"); // red
  
    // Background track
    dbCtx.fillStyle = "#0c0c16";
    dbCtx.fillRect(0, 0, el.dbMeterCanvas.width, el.dbMeterCanvas.height);
  
    // Glowing Level Bar
    dbCtx.fillStyle = gradient;
    dbCtx.fillRect(0, 0, barW, el.dbMeterCanvas.height);
  
    // Draw minor tick segments
    dbCtx.strokeStyle = "#08080d";
    dbCtx.lineWidth = 1;
    for (let x = 10; x < el.dbMeterCanvas.width; x += 10) {
      dbCtx.beginPath();
      dbCtx.moveTo(x, 0);
      dbCtx.lineTo(x, el.dbMeterCanvas.height);
      dbCtx.stroke();
    }
  }
  
  // VO File select
  async function handleVoFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
  
    el.voUploadContent.innerHTML = `<span>Membaca file audio...</span>`;
  
    initAudio();
    const arrayBuffer = await file.arrayBuffer();
    let buffer = null;
    try {
      buffer = await state.audioContext.decodeAudioData(arrayBuffer);
    } catch (err) {
      showToast("Format file audio tidak didukung.");
      deleteVO();
      return;
    }
  
    state.voAudio = {
      file: file,
      url: URL.createObjectURL(file),
      buffer: buffer,
      duration: buffer.duration
    };
  
    el.btnDeleteVO.classList.remove("hidden");
    el.voUploadContent.innerHTML = `
      <span class="manga-name" style="color:var(--text-primary);font-weight:600;">VO: ${file.name.slice(0, 15)}...</span>
    `;
  
    // Enable VO Script Sync buttons
    el.btnSyncWithVO.disabled = false;
    
    updateVideoDuration();
    showToast(`Voice Over dimuat! Durasi: ${formatTime(buffer.duration)}`);
  }
  
  function deleteVO() {
    if (state.voAudio && state.voAudio.url) {
      URL.revokeObjectURL(state.voAudio.url);
    }
    state.voAudio = null;
    el.btnDeleteVO.classList.add("hidden");
    el.btnSyncWithVO.disabled = true;
    el.voFileInput.value = "";
    el.voUploadContent.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
      <span>Pilih file audio voice over...</span>
    `;
    updateVideoDuration();
    stopPlayback();
  }
  
  // BGM selectors
  function handleBgmSelectChange(e) {
    const value = e.target.value;
    if (value === "upload") {
      el.bgmFileInput.click();
    } else if (value.startsWith("procedural")) {
      state.bgmType = value;
      state.bgmAudio = null;
      el.btnDeleteBGM.classList.remove("hidden");
      showToast(`BGM diatur ke Procedural`);
    } else {
      deleteBGM();
    }
  }
  
  async function handleBgmFileSelect(e) {
    const file = e.target.files[0];
    if (!file) {
      el.bgmSelect.value = "";
      return;
    }
  
    initAudio();
    const arrayBuffer = await file.arrayBuffer();
    let buffer = null;
    try {
      buffer = await state.audioContext.decodeAudioData(arrayBuffer);
    } catch (err) {
      showToast("Format file audio tidak didukung.");
      deleteBGM();
      return;
    }
  
    state.bgmType = "custom";
    state.bgmAudio = {
      file: file,
      url: URL.createObjectURL(file),
      buffer: buffer,
      duration: buffer.duration
    };
  
    el.btnDeleteBGM.classList.remove("hidden");
    
    const opt = el.bgmSelect.querySelector('option[value="upload"]');
    opt.textContent = `📁 Custom: ${file.name.slice(0, 12)}...`;
    el.bgmSelect.value = "upload";
    showToast("File BGM berhasil dimuat.");
  }
  
  function deleteBGM() {
    if (state.bgmAudio && state.bgmAudio.url) {
      URL.revokeObjectURL(state.bgmAudio.url);
    }
    state.bgmAudio = null;
    state.bgmType = "";
    el.bgmSelect.value = "";
    el.btnDeleteBGM.classList.add("hidden");
    el.bgmFileInput.value = "";
    
    const opt = el.bgmSelect.querySelector('option[value="upload"]');
    opt.textContent = `📁 Upload BGM Sendiri...`;
    showToast("BGM dihapus.");
  }
  
  // ==========================================================================
  // PROCEDURAL SYNTH TRACKS
  // ==========================================================================
  function startProceduralBGM() {
    if (!state.bgmType.startsWith("procedural") || !state.audioContext) return;
    stopProceduralBGM();
  
    let intervalMs = 2500;
    let synthType = "triangle";
    let filterCutoff = 800;
    
    if (state.bgmType === "procedural-lofi") {
      intervalMs = 3000;
      synthType = "triangle";
      filterCutoff = 500;
    } else if (state.bgmType === "procedural-synth") {
      intervalMs = 1200;
      synthType = "sawtooth";
      filterCutoff = 1000;
    } else if (state.bgmType === "procedural-piano") {
      intervalMs = 4000;
      synthType = "sine";
      filterCutoff = 1000;
    }
  
    const chords = [
      [220, 261.63, 329.63, 392.00], // Am7
      [174.61, 220, 261.63, 349.23], // Fmaj7
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [196.00, 246.94, 293.66, 392.00]  // G7
    ];
  
    let chordIndex = 0;
  
    function playNextChord() {
      if (!state.isPlaying || state.isMuted) return;
      
      const now = state.audioContext.currentTime;
      const curChord = chords[chordIndex % chords.length];
      chordIndex++;
  
      curChord.forEach((freq, i) => {
        const osc = state.audioContext.createOscillator();
        const gainNode = state.audioContext.createGain();
        const filter = state.audioContext.createBiquadFilter();
  
        osc.type = synthType;
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 2, now);
  
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(filterCutoff, now);
        filter.Q.setValueAtTime(3, now);
  
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(state.bgmVolume * 0.25, now + 1.2);
        gainNode.gain.setValueAtTime(state.bgmVolume * 0.25, now + (intervalMs/1000) - 0.8);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (intervalMs/1000));
  
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(state.bgmGainNode);
  
        osc.start(now);
        osc.stop(now + (intervalMs/1000));
  
        state.synthNodes.push(osc);
      });
    }
  
    playNextChord();
    state.synthIntervalId = setInterval(playNextChord, intervalMs);
  }
  
  function stopProceduralBGM() {
    if (state.synthIntervalId) {
      clearInterval(state.synthIntervalId);
      state.synthIntervalId = null;
    }
    state.synthNodes.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    state.synthNodes = [];
  }
  
  // Master Audio track starter
  function startAudioTracks(timeOffset) {
    initAudio();
    if (state.audioContext.state === "suspended") {
      state.audioContext.resume();
    }
  
    // 1. Play Voice Over
    if (state.voAudio && state.voAudio.buffer) {
      state.voSourceNode = state.audioContext.createBufferSource();
      state.voSourceNode.buffer = state.voAudio.buffer;
      state.voSourceNode.connect(state.voGainNode);
      state.voSourceNode.start(0, timeOffset);
    }
  
    // 2. Play BGM (custom)
    if (state.bgmAudio && state.bgmAudio.buffer && state.bgmType === "custom") {
      state.bgmSourceNode = state.audioContext.createBufferSource();
      state.bgmSourceNode.buffer = state.bgmAudio.buffer;
      state.bgmSourceNode.loop = true;
      state.bgmSourceNode.connect(state.bgmGainNode);
      state.bgmSourceNode.start(0, timeOffset % state.bgmAudio.buffer.duration);
    }
  
    // 3. Play BGM (procedural synthetics)
    if (state.bgmType.startsWith("procedural")) {
      startProceduralBGM();
    }
  
    // 4. In case the active segment plays AI speech synthesis, trigger it
    playSpeechForTime(timeOffset);
  }
  
  function stopAudioTracks() {
    if (state.voSourceNode) {
      try { state.voSourceNode.stop(); } catch (e) {}
      state.voSourceNode = null;
    }
    if (state.bgmSourceNode) {
      try { state.bgmSourceNode.stop(); } catch (e) {}
      state.bgmSourceNode = null;
    }
    stopProceduralBGM();
    
    // Stop speaking
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
      state.activeUtterance = null;
    }
  }
  
  // ==========================================================================
  // SPEECH SYNTHESIS ENGINE (FREE AI VOICE)
  // ==========================================================================
  function loadSystemVoices() {
    if (typeof speechSynthesis === "undefined") return;
    const voices = speechSynthesis.getVoices();
    el.ttsVoiceSelect.innerHTML = "";
    
    if (voices.length === 0) {
      const opt = document.createElement("option");
      opt.value = "system-default";
      opt.textContent = "Default System Voice";
      el.ttsVoiceSelect.appendChild(opt);
      return;
    }
    
    voices.forEach(voice => {
      const opt = document.createElement("option");
      opt.value = voice.name;
      const isIndo = voice.lang.includes("id") || voice.lang.includes("ID");
      opt.textContent = `${voice.name} (${voice.lang})${isIndo ? " ⭐" : ""}`;
      if (isIndo) {
        opt.selected = true; // Auto select Indo voice
        state.ttsVoiceName = voice.name;
      }
      el.ttsVoiceSelect.appendChild(opt);
    });
  }
  
  // If voices are loaded asynchronously
  if (typeof speechSynthesis !== "undefined") {
    speechSynthesis.onvoiceschanged = loadSystemVoices;
  }
  
  // Estimate voice duration based on text word count (135 words per minute fallback)
  function estimateSpeechDuration(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    return Math.max(1.8, words * 0.46 + 0.6); // solid empirical formula
  }
  
  // Real-time Voice Playback controller
  let lastPlayedSegmentIdForSpeech = null;
  
  function playSpeechForTime(time) {
    if (typeof speechSynthesis === "undefined" || state.isMuted) return;
  
    // Find segment at current time
    const activeSeg = state.segments.find(s => time >= s.start && time <= s.end);
    if (!activeSeg || !activeSeg.text) {
      speechSynthesis.cancel();
      lastPlayedSegmentIdForSpeech = null;
      return;
    }
  
    // Speak only once per segment transition
    if (activeSeg.id === lastPlayedSegmentIdForSpeech) return;
    
    speechSynthesis.cancel(); // Stop preceding speech
    
    const utterance = new SpeechSynthesisUtterance(activeSeg.text);
    
    // Apply selected voice
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === state.ttsVoiceName);
    if (voice) {
      utterance.voice = voice;
    }
    
    // Set volume based on VO slider
    utterance.volume = state.voVolume;
    utterance.rate = 1.0; // standard speaking speed
  
    state.activeUtterance = utterance;
    lastPlayedSegmentIdForSpeech = activeSeg.id;
    
    speechSynthesis.speak(utterance);
  }
  
  // Sync Speech Synthesis on manual seeker
  function syncSpeechSeek(time) {
    // If playing, we restart the voice synth at segment start
    if (state.isPlaying) {
      lastPlayedSegmentIdForSpeech = null;
      playSpeechForTime(time);
    }
  }
  
  // Generate Speech durations for all segments
  function generateAllTtsVoices() {
    if (state.segments.length === 0) {
      showToast("Silakan buat segmen naskah terlebih dahulu.");
      return;
    }
  
    let offset = 0.0;
    state.segments.forEach(seg => {
      const dur = estimateSpeechDuration(seg.text);
      seg.start = offset;
      seg.end = offset + dur;
      offset = seg.end;
    });
  
    renderTimelineSegments();
    updateVideoDuration();
    showToast("Seluruh segmen diselaraskan dengan estimasi Suara AI!");
  }
  
  function generateIndividualTtsVoice(id) {
    const seg = state.segments.find(s => s.id === id);
    if (!seg) return;
  
    const dur = estimateSpeechDuration(seg.text);
    const diff = dur - (seg.end - seg.start);
    
    seg.end = seg.start + dur;
  
    // Shift subsequent segments
    const index = state.segments.findIndex(s => s.id === id);
    for (let i = index + 1; i < state.segments.length; i++) {
      state.segments[i].start += diff;
      state.segments[i].end += diff;
    }
  
    renderTimelineSegments();
    updateVideoDuration();
    showToast("Segmen diselaraskan dengan Suara AI.");
  }
  
  // ==========================================================================
  // MANGA IMAGE MANAGER (Direct click assignment)
  // ==========================================================================
  function handleMangaFilesSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
  
    let loadedCount = 0;
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
          const id = "img_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
          state.images.push({
            id: id,
            name: file.name,
            url: event.target.result,
            element: img
          });
          
          loadedCount++;
          if (loadedCount === files.length) {
            updateMangaUIList();
            updateSegmentImageSelectDropdowns();
            showToast(`${files.length} gambar manga dimuat.`);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
  
  function updateMangaUIList() {
    el.mangaFileList.innerHTML = "";
    
    if (state.images.length > 0) {
      el.btnClearManga.classList.remove("hidden");
      el.mangaStatusBadge.classList.remove("hidden");
      el.mangaCount.textContent = state.images.length;
      el.mangaCountTotal.textContent = state.images.length;
      
      state.images.forEach((imgObj) => {
        const item = document.createElement("div");
        item.className = "manga-file-item";
        item.innerHTML = `
          <span class="manga-dot"></span>
          <img class="manga-thumb-mini" src="${imgObj.url}">
          <span class="manga-name" title="Klik untuk pasang ke segmen aktif">${imgObj.name}</span>
          <button class="btn-delete-file" data-id="${imgObj.id}" title="Hapus Gambar">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        `;
        
        // DIRECT ASSIGNMENT: Click entire item to assign it to selected active segment card
        item.addEventListener("click", (e) => {
          if (e.target.closest(".btn-delete-file")) return; // skip if delete button clicked
          assignImageToActiveSegment(imgObj.id);
        });
  
        item.querySelector(".btn-delete-file").addEventListener("click", (e) => {
          e.stopPropagation();
          deleteMangaImage(imgObj.id);
        });
        el.mangaFileList.appendChild(item);
      });
    } else {
      el.btnClearManga.classList.add("hidden");
      el.mangaStatusBadge.classList.add("hidden");
      el.mangaFileList.innerHTML = `<span class="text-muted font-xs text-center" style="display:block;padding:10px;">Belum ada gambar manga.</span>`;
    }
  }
  
  function assignImageToActiveSegment(imgId) {
    if (!state.selectedSegmentId) {
      showToast("Pilih salah satu segmen kartu di bawah terlebih dahulu.");
      return;
    }
  
    const seg = state.segments.find(s => s.id === state.selectedSegmentId);
    if (!seg) return;
  
    seg.imageId = imgId;
    
    // Update card thumbnail directly in DOM without full rebuild to keep scroll position
    const matchingImg = state.images.find(img => img.id === imgId);
    const cardElement = document.getElementById(`segment-row-${seg.id}`);
    if (cardElement) {
      const thumbContainer = cardElement.querySelector(".card-thumbnail-container");
      thumbContainer.innerHTML = `
        <img class="card-thumb" src="${matchingImg.url}">
        <div class="card-thumb-overlay-btn">GANTI GAMBAR</div>
      `;
      const mangaSelect = cardElement.querySelector(".manga-select");
      if (mangaSelect) mangaSelect.value = imgId;
    }
  
    drawFrame();
    showToast("Gambar dipasang ke segmen.");
  }
  
  function deleteMangaImage(id) {
    state.images = state.images.filter(img => img.id !== id);
    updateMangaUIList();
    updateSegmentImageSelectDropdowns();
    
    state.segments.forEach(seg => {
      if (seg.imageId === id) {
        seg.imageId = state.images.length > 0 ? state.images[0].id : "";
      }
    });
    renderTimelineSegments();
  }
  
  function clearAllManga() {
    state.images = [];
    updateMangaUIList();
    updateSegmentImageSelectDropdowns();
    state.segments.forEach(seg => {
      seg.imageId = "";
    });
    renderTimelineSegments();
    showToast("Semua gambar manga dihapus.");
  }
  
  function updateSegmentImageSelectDropdowns() {
    const dropdowns = document.querySelectorAll(".manga-select");
    dropdowns.forEach(select => {
      const selectedVal = select.value;
      select.innerHTML = "";
      
      if (state.images.length === 0) {
        select.innerHTML = `<option value="">(Unggah Manga Dahulu)</option>`;
        return;
      }
      
      state.images.forEach(img => {
        const opt = document.createElement("option");
        opt.value = img.id;
        opt.textContent = img.name;
        select.appendChild(opt);
      });
      
      if (state.images.some(img => img.id === selectedVal)) {
        select.value = selectedVal;
      }
    });
  }
  
  // ==========================================================================
  // CARD TIMELINE PANEL RENDERER
  // ==========================================================================
  function updateVideoDuration() {
    let duration = 0.0;
    if (state.segments.length > 0) {
      duration = state.segments[state.segments.length - 1].end;
    } else if (state.voAudio) {
      duration = state.voAudio.duration;
    }
    
    el.totalTimeDisplay.textContent = formatTime(duration);
    el.videoScrubber.max = duration;
    
    renderScrubberTicks();
  }
  
  function getSegmentsDuration() {
    if (state.segments.length === 0) return 0;
    return state.segments[state.segments.length - 1].end;
  }
  
  function renderTimelineSegments() {
    el.segmentRowsContainer.innerHTML = "";
    el.mangaTimelineCount.textContent = state.segments.length;
    
    if (state.segments.length === 0) {
      el.segmentRowsContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
          </svg>
          <p>Belum ada segmen. Tulis naskah di tab "SCRIPT / NASKAH VIDEO" atau klik "+ Tambah Segmen Manual" di kanan.</p>
        </div>
      `;
      return;
    }
    
    state.segments.forEach((seg, index) => {
      const card = document.createElement("div");
      card.className = `segment-card ${state.selectedSegmentId === seg.id ? "active-selected" : ""}`;
      card.id = `segment-row-${seg.id}`;
      card.dataset.id = seg.id;
      
      // Select thumbnail details
      const imgObj = state.images.find(img => img.id === seg.imageId);
      const thumbHtml = imgObj 
        ? `<img class="card-thumb" src="${imgObj.url}">`
        : `<div class="card-thumb-placeholder">NO IMAGE</div>`;
  
      // Dropdown selects
      let imageOptions = "";
      if (state.images.length === 0) {
        imageOptions = `<option value="">(Unggah Manga Dahulu)</option>`;
      } else {
        state.images.forEach(img => {
          imageOptions += `<option value="${img.id}" ${img.id === seg.imageId ? "selected" : ""}>${img.name}</option>`;
        });
      }
  
      const motions = ["Static", "Pan Kanan", "Pan Kiri", "Pan Atas", "Pan Bawah", "Zoom In", "Zoom Out"];
      let motionOptions = "";
      motions.forEach(m => {
        motionOptions += `<option value="${m}" ${m === seg.cameraMotion ? "selected" : ""}>${m}</option>`;
      });
  
      card.innerHTML = `
        <div class="segment-card-header">
          <div class="card-header-left">
            <span class="card-index">Segmen #${index + 1}</span>
            <span class="card-timing-badge">${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s (${(seg.end - seg.start).toFixed(2)}s)</span>
          </div>
          <div class="card-header-right">
            <button class="btn btn-secondary-sm text-pink btn-tts-singlet" title="Ubah teks naskah segmen ini menjadi suara AI gratis">⚡ AI Voice</button>
          </div>
        </div>
        
        <div class="segment-card-body">
          <!-- Image Thumbnail Area -->
          <div class="card-thumbnail-container" title="Klik manga di atas untuk memasang gambar ke segmen aktif ini">
            ${thumbHtml}
            <div class="card-thumb-overlay-btn">GANTI GAMBAR</div>
          </div>
  
          <!-- Manga dropdown selector -->
          <div class="card-dropdowns-group">
            <div class="dropdown-with-label">
              <label>PILIH GAMBAR MANGA</label>
              <select class="custom-select select-sm manga-select">
                ${imageOptions}
              </select>
            </div>
            <div class="dropdown-with-label">
              <label>GERAKAN KAMERA</label>
              <select class="custom-select select-sm motion-select">
                ${motionOptions}
              </select>
            </div>
          </div>
  
          <!-- Manual timing inputs -->
          <div class="card-timing-inputs">
            <div class="timing-inputs-row">
              <label>MULAI</label>
              <input type="number" step="0.01" min="0" class="custom-input input-sm time-input-field time-start" value="${seg.start.toFixed(2)}">
            </div>
            <div class="timing-inputs-row">
              <label>SELESAI</label>
              <input type="number" step="0.01" min="0" class="custom-input input-sm time-input-field time-end" value="${seg.end.toFixed(2)}">
            </div>
          </div>
  
          <!-- Narrative inputs -->
          <div class="card-text-container">
            <label>SUBTITEL / NASKAH SEGMENT</label>
            <textarea class="card-text-area" placeholder="Masukkan teks narasi...">${seg.text}</textarea>
          </div>
        </div>
  
        <div class="segment-card-footer">
          <button class="btn btn-secondary-sm btn-dupe">Duplikat</button>
          <button class="btn btn-secondary-sm text-danger btn-delete">Hapus</button>
        </div>
      `;
  
      // Active Card selection click listener
      card.addEventListener("click", (e) => {
        if (e.target.closest("button, select, textarea, input")) return;
        selectCard(seg.id);
      });
  
      // Timing changes
      card.querySelector(".time-start").addEventListener("change", (e) => updateSegmentTiming(seg.id, parseFloat(e.target.value), null));
      card.querySelector(".time-end").addEventListener("change", (e) => updateSegmentTiming(seg.id, null, parseFloat(e.target.value)));
      
      // Select switches
      card.querySelector(".manga-select").addEventListener("change", (e) => {
        seg.imageId = e.target.value;
        const matchingImg = state.images.find(img => img.id === seg.imageId);
        const thumbContainer = card.querySelector(".card-thumbnail-container");
        if (matchingImg) {
          thumbContainer.innerHTML = `
            <img class="card-thumb" src="${matchingImg.url}">
            <div class="card-thumb-overlay-btn">GANTI GAMBAR</div>
          `;
        } else {
          thumbContainer.innerHTML = `<div class="card-thumb-placeholder">NO IMAGE</div>`;
        }
        drawFrame();
      });
  
      card.querySelector(".motion-select").addEventListener("change", (e) => {
        seg.cameraMotion = e.target.value;
      });
  
      // Text editing
      card.querySelector(".card-text-area").addEventListener("input", (e) => {
        seg.text = e.target.value;
        if (state.currentTime >= seg.start && state.currentTime <= seg.end) {
          el.subtitleOverlay.textContent = seg.text;
        }
      });
  
      // Footer actions
      card.querySelector(".btn-tts-singlet").addEventListener("click", () => generateIndividualTtsVoice(seg.id));
      card.querySelector(".btn-dupe").addEventListener("click", () => duplicateSegment(seg.id));
      card.querySelector(".btn-delete").addEventListener("click", () => deleteSegment(seg.id));
  
      el.segmentRowsContainer.appendChild(card);
    });
    
    updateVideoDuration();
  }
  
  function selectCard(id) {
    state.selectedSegmentId = id;
    const cards = document.querySelectorAll(".segment-card");
    cards.forEach(c => {
      c.classList.toggle("active-selected", c.dataset.id === id);
    });
  }
  
  function updateSegmentTiming(id, start, end) {
    const segIndex = state.segments.findIndex(s => s.id === id);
    if (segIndex === -1) return;
    
    const seg = state.segments[segIndex];
    
    if (start !== null) seg.start = start;
    if (end !== null) seg.end = end;
  
    if (seg.end <= seg.start) {
      seg.end = seg.start + 1.0;
    }
  
    state.segments.sort((a, b) => a.start - b.start);
    renderTimelineSegments();
  }
  
  function duplicateSegment(id) {
    const seg = state.segments.find(s => s.id === id);
    if (!seg) return;
  
    const duration = seg.end - seg.start;
    const newStart = seg.end;
    const newEnd = newStart + duration;
  
    const newSeg = {
      id: "seg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      start: newStart,
      end: newEnd,
      imageId: seg.imageId,
      cameraMotion: seg.cameraMotion,
      text: seg.text + " (Salinan)"
    };
  
    const index = state.segments.findIndex(s => s.id === id);
    state.segments.splice(index + 1, 0, newSeg);
    
    let currentOffset = newEnd;
    for (let i = index + 2; i < state.segments.length; i++) {
      const s = state.segments[i];
      const dur = s.end - s.start;
      s.start = currentOffset;
      s.end = currentOffset + dur;
      currentOffset = s.end;
    }
  
    renderTimelineSegments();
    showToast("Segmen berhasil diduplikasi.");
  }
  
  function deleteSegment(id) {
    const index = state.segments.findIndex(s => s.id === id);
    if (index === -1) return;
    
    const deletedSeg = state.segments[index];
    const dur = deletedSeg.end - deletedSeg.start;
    
    state.segments.splice(index, 1);
    
    for (let i = index; i < state.segments.length; i++) {
      state.segments[i].start -= dur;
      state.segments[i].end -= dur;
    }
  
    if (state.selectedSegmentId === id) {
      state.selectedSegmentId = null;
    }
  
    renderTimelineSegments();
    showToast("Segmen dihapus.");
  }
  
  function addNewSegmentManual() {
    const lastEnd = getSegmentsDuration();
    const defaultImageId = state.images.length > 0 ? state.images[0].id : "";
  
    const newSeg = {
      id: "seg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      start: lastEnd,
      end: lastEnd + 5.0,
      imageId: defaultImageId,
      cameraMotion: "Static",
      text: "Segmen naskah baru."
    };
  
    state.segments.push(newSeg);
    renderTimelineSegments();
    selectCard(newSeg.id);
    showToast("Segmen baru ditambahkan.");
  }
  
  // ==========================================================================
  // SCRIPT TO VIDEO TIMELINE SYNCHRONIZER
  // ==========================================================================
  function parseScriptTextIntoArray() {
    // Splits by double newlines to filter individual paragraphs
    return el.scriptTextarea.value
      .split(/\n\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
  
  // Auto-Sync Option A: Synchronize using total Voice Over audio length
  function syncScriptWithLocalVO() {
    if (!state.voAudio) {
      showToast("Silakan unggah Voice Over terlebih dahulu.");
      return;
    }
  
    const lines = parseScriptTextIntoArray();
    if (lines.length === 0) {
      showToast("Tulis naskah script terlebih dahulu.");
      return;
    }
  
    // Calculate proportional durations based on character/word counts
    const totalWords = lines.reduce((acc, line) => acc + line.split(/\s+/).length, 0);
    const voDuration = state.voAudio.duration;
  
    let currentOffset = 0.0;
    
    state.segments = lines.map((text, idx) => {
      const lineWords = text.split(/\s+/).length;
      const lineDur = (lineWords / totalWords) * voDuration;
      const start = currentOffset;
      const end = currentOffset + lineDur;
      currentOffset = end;
  
      const defaultImageId = state.images.length > 0 ? state.images[idx % state.images.length].id : "";
  
      return {
        id: "seg_sync_" + Date.now() + "_" + idx,
        start: start,
        end: end,
        imageId: defaultImageId,
        cameraMotion: "Static",
        text: text
      };
    });
  
    renderTimelineSegments();
    showToast("Sinkronisasi naskah dengan VO lokal berhasil!");
    switchTab("tabMangaTimeline");
  }
  
  // Auto-Sync Option B: Synchronize using AI Voice (estimated duration)
  function syncScriptWithTTSVoice() {
    const lines = parseScriptTextIntoArray();
    if (lines.length === 0) {
      showToast("Tulis naskah script terlebih dahulu.");
      return;
    }
  
    let currentOffset = 0.0;
    
    state.segments = lines.map((text, idx) => {
      const lineDur = estimateSpeechDuration(text);
      const start = currentOffset;
      const end = currentOffset + lineDur;
      currentOffset = end;
  
      const defaultImageId = state.images.length > 0 ? state.images[idx % state.images.length].id : "";
  
      return {
        id: "seg_tts_sync_" + Date.now() + "_" + idx,
        start: start,
        end: end,
        imageId: defaultImageId,
        cameraMotion: "Static",
        text: text
      };
    });
  
    renderTimelineSegments();
    showToast("Naskah disinkronkan & Estimasi suara AI selesai dibuat!");
    switchTab("tabMangaTimeline");
  }
  
  function switchTab(tabId) {
    el.tabButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabId);
    });
    el.tabPanes.forEach(pane => {
      pane.classList.toggle("active", pane.id === tabId);
    });
  
    if (tabId === "tabScriptNaskah") {
      // Sync current segments script texts into script area
      if (state.segments.length > 0) {
        el.scriptTextarea.value = state.segments.map(s => s.text).join("\n\n");
      }
    }
  }
  
  // ==========================================================================
  // RENDERER ENGINE & ANIMATED WORD-BY-WORD SUBTITLES
  // ==========================================================================
  function drawFrame() {
    // Clear
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, el.playerCanvas.width, el.playerCanvas.height);
  
    // Active segment checking
    const activeSeg = state.segments.find(s => state.currentTime >= s.start && state.currentTime <= s.end);
    
    // Highlight active card
    const cards = document.querySelectorAll(".segment-card");
    cards.forEach(card => {
      const isPlaying = activeSeg && card.dataset.id === activeSeg.id;
      card.classList.toggle("active-playing", isPlaying);
      if (isPlaying && state.isPlaying) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  
    if (!activeSeg) {
      el.subtitleOverlay.innerHTML = "";
      return;
    }
  
    // Draw manga frame image
    const imgObj = state.images.find(img => img.id === activeSeg.imageId);
    if (imgObj && imgObj.element) {
      const img = imgObj.element;
      const canvasW = el.playerCanvas.width;
      const canvasH = el.playerCanvas.height;
  
      // Fit cover logic
      const scaleX = canvasW / img.width;
      const scaleY = canvasH / img.height;
      const baseScale = Math.max(scaleX, scaleY);
      
      const w = img.width * baseScale;
      const h = img.height * baseScale;
  
      const segDuration = activeSeg.end - activeSeg.start;
      const progress = segDuration > 0 ? Math.min(Math.max((state.currentTime - activeSeg.start) / segDuration, 0), 1) : 0;
  
      ctx.save();
  
      let finalScale = 1.0;
      let translateX = 0;
      let translateY = 0;
  
      switch (activeSeg.cameraMotion) {
        case "Zoom In":
          finalScale = 1.05 + progress * 0.17;
          break;
        case "Zoom Out":
          finalScale = 1.22 - progress * 0.17;
          break;
        case "Pan Kanan":
          finalScale = 1.15;
          translateX = w * 0.05 * (2 * progress - 1);
          break;
        case "Pan Kiri":
          finalScale = 1.15;
          translateX = w * 0.05 * (1 - 2 * progress);
          break;
        case "Pan Atas":
          finalScale = 1.15;
          translateY = h * 0.05 * (1 - 2 * progress);
          break;
        case "Pan Bawah":
          finalScale = 1.15;
          translateY = h * 0.05 * (2 * progress - 1);
          break;
        case "Static":
        default:
          finalScale = 1.0;
          break;
      }
  
      ctx.translate(canvasW / 2 + translateX, canvasH / 2 + translateY);
      ctx.scale(finalScale, finalScale);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      // Black screen image placeholder
      ctx.fillStyle = "#0c0c16";
      ctx.fillRect(40, 40, el.playerCanvas.width - 80, el.playerCanvas.height - 80);
      ctx.strokeStyle = "#1f1f3a";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 40, el.playerCanvas.width - 80, el.playerCanvas.height - 80);
      
      ctx.fillStyle = "#5b5b78";
      ctx.font = "italic 20px Outfit";
      ctx.textAlign = "center";
      ctx.fillText("[Manga Frame Kosong - Klik gambar di atas untuk memasang]", el.playerCanvas.width / 2, el.playerCanvas.height / 2);
    }
  
    // Draw subtitle with animation on HTML overlay
    renderAnimatedSubtitles(activeSeg);
  }
  
  // Subtitle Animator: Highlight kata, Progressive, or Full
  function renderAnimatedSubtitles(activeSeg) {
    if (!activeSeg.text) {
      el.subtitleOverlay.innerHTML = "";
      return;
    }
  
    const words = activeSeg.text.split(/\s+/).filter(w => w.length > 0);
    const segDuration = activeSeg.end - activeSeg.start;
    const progress = segDuration > 0 ? Math.min(Math.max((state.currentTime - activeSeg.start) / segDuration, 0), 1) : 0;
    
    // Calculate active word index
    const activeWordIdx = Math.min(words.length - 1, Math.floor(progress * words.length));
  
    // Apply visual style states to HTML overlay
    el.subtitleOverlay.style.fontFamily = `"${state.subtitleStyles.font}", var(--font-ui)`;
    el.subtitleOverlay.style.fontSize = `${state.subtitleStyles.size}px`;
    el.subtitleOverlay.style.color = state.subtitleStyles.color;
  
    // Custom visual styles for shorts/reels fonts
    if (state.subtitleStyles.font === "Impact") {
      el.subtitleOverlay.style.textTransform = "uppercase";
      el.subtitleOverlay.style.fontWeight = "900";
      el.subtitleOverlay.style.letterSpacing = "0.08em";
    } else {
      el.subtitleOverlay.style.textTransform = "none";
      el.subtitleOverlay.style.fontWeight = "600";
      el.subtitleOverlay.style.letterSpacing = "normal";
    }
  
    let formattedHtml = "";
  
    if (state.subtitleStyles.animation === "progressive") {
      // Show only words up to the current progress
      const wordsToShow = Math.ceil(progress * words.length);
      formattedHtml = words.slice(0, wordsToShow).join(" ");
    } else if (state.subtitleStyles.animation === "highlight") {
      // Show full sentence, but color the active word in yellow/green highlight
      formattedHtml = words.map((w, idx) => {
        if (idx === activeWordIdx) {
          return `<span style="color:#FFFF00;text-shadow:0 0 10px rgba(255,255,0,0.8);">${w}</span>`;
        }
        return w;
      }).join(" ");
    } else {
      // Full sentence
      formattedHtml = activeSeg.text;
    }
  
    el.subtitleOverlay.innerHTML = formattedHtml;
  }
  
  // Animation loop
  function playbackLoop() {
    if (!state.isPlaying) return;
  
    const now = performance.now();
    const elapsed = (now - state.playbackStartTime) / 1000;
    state.currentTime = state.pausedTimeOffset + elapsed;
  
    const totalDur = getSegmentsDuration();
    
    if (state.currentTime >= totalDur) {
      state.currentTime = totalDur;
      stopPlayback();
      showToast("Playback selesai.");
    }
  
    // Sync controls
    el.videoScrubber.value = state.currentTime;
    el.currentTimeDisplay.textContent = formatTime(state.currentTime);
  
    // Trigger speech synthesis triggers
    playSpeechForTime(state.currentTime);
  
    // Redraw canvases
    drawFrame();
    drawDbMeter();
  
    state.animationFrameId = requestAnimationFrame(playbackLoop);
  }
  
  // Play Pause toggle
  function togglePlayPause() {
    if (state.segments.length === 0) {
      showToast("Silakan tambahkan segmen manga terlebih dahulu.");
      return;
    }
  
    if (state.isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }
  
  function startPlayback() {
    if (state.isPlaying) return;
    
    initAudio();
    state.isPlaying = true;
    el.playIcon.classList.add("hidden");
    el.pauseIcon.classList.remove("hidden");
    el.playbackIndicator.classList.remove("hidden");
  
    state.playbackStartTime = performance.now();
    state.pausedTimeOffset = state.currentTime;
    
    if (state.pausedTimeOffset >= getSegmentsDuration()) {
      state.pausedTimeOffset = 0;
      state.currentTime = 0;
    }
  
    startAudioTracks(state.currentTime);
    playbackLoop();
  }
  
  function stopPlayback() {
    if (!state.isPlaying) return;
  
    state.isPlaying = false;
    el.playIcon.classList.remove("hidden");
    el.pauseIcon.classList.add("hidden");
    el.playbackIndicator.classList.add("hidden");
  
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
  
    stopAudioTracks();
    state.pausedTimeOffset = state.currentTime;
    
    // Refresh db meter to blank state
    drawDbMeter();
  }
  
  function seekToStart() {
    stopPlayback();
    state.currentTime = 0;
    state.pausedTimeOffset = 0;
    el.videoScrubber.value = 0;
    el.currentTimeDisplay.textContent = "00:00";
    drawFrame();
    drawDbMeter();
    showToast("Kembali ke awal.");
  }
  
  function handleScrubberSeek(e) {
    const seekVal = parseFloat(e.target.value);
    state.currentTime = seekVal;
    
    if (state.isPlaying) {
      stopAudioTracks();
      state.playbackStartTime = performance.now();
      state.pausedTimeOffset = seekVal;
      startAudioTracks(seekVal);
    } else {
      state.pausedTimeOffset = seekVal;
      syncSpeechSeek(seekVal);
    }
    
    el.currentTimeDisplay.textContent = formatTime(seekVal);
    drawFrame();
    drawDbMeter();
  }
  
  function toggleSidebar() {
    state.isCollapsed = !state.isCollapsed;
    el.sidebar.classList.toggle("collapsed", state.isCollapsed);
    el.btnHidePanel.textContent = state.isCollapsed ? "Tampilkan Panel" : "Sembunyikan Panel";
  }
  
  function togglePlaybackPreviewMode() {
    state.isPlaybackPreviewMode = !state.isPlaybackPreviewMode;
    el.btnPlaybackPreview.classList.toggle("btn-primary", state.isPlaybackPreviewMode);
    el.btnPlaybackPreview.classList.toggle("btn-dark-sm", !state.isPlaybackPreviewMode);
    showToast(state.isPlaybackPreviewMode ? "Mode Playback Preview Aktif" : "Mode Playback Preview Dinonaktifkan.");
  }
  
  function renderScrubberTicks() {
    el.scrubberTicks.innerHTML = "";
    const totalDur = getSegmentsDuration();
    if (totalDur <= 0) return;
  
    state.segments.forEach(seg => {
      const leftPercent = (seg.start / totalDur) * 100;
      const tick = document.createElement("div");
      tick.className = "scrubber-tick-mark";
      tick.style.left = `${leftPercent}%`;
      el.scrubberTicks.appendChild(tick);
    });
  }
  
  // ==========================================================================
  // EXPORTING ENGINE (With dynamic word-by-word canvas burning)
  // ==========================================================================
  let exportIntervalId = null;
  
  async function startExportingVideo() {
    if (state.segments.length === 0) {
      showToast("Tidak ada segmen untuk diekspor.");
      return;
    }
  
    stopPlayback();
    initAudio();
    
    state.isExporting = true;
    el.modalExportOverlay.classList.remove("hidden");
    el.exportProgressBar.style.width = "0%";
    el.exportProgressText.textContent = "0%";
    el.exportStatusText.textContent = "Menyiapkan render...";
    
    const totalDur = getSegmentsDuration();
    const exportW = state.previewResolution.width;
    const exportH = state.previewResolution.height;
    
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportW;
    exportCanvas.height = exportH;
    const exportCtx = exportCanvas.getContext("2d");
    
    el.exportPreviewCanvas.width = exportW;
    el.exportPreviewCanvas.height = exportH;
    const modalCtx = el.exportPreviewCanvas.getContext("2d");
  
    const canvasStream = exportCanvas.captureStream(30); 
    const audioDest = state.audioContext.createMediaStreamDestination();
    
    // Mixed audio connection
    state.voGainNode.connect(audioDest);
    state.bgmGainNode.connect(audioDest);
  
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDest.stream.getAudioTracks()
    ]);
  
    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8,opus' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }
  
    state.exportChunks = [];
    try {
      state.exportRecorder = new MediaRecorder(combinedStream, options);
    } catch (err) {
      state.exportRecorder = new MediaRecorder(combinedStream);
    }
  
    state.exportRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        state.exportChunks.push(e.data);
      }
    };
  
    state.exportRecorder.onstop = () => {
      try { state.voGainNode.disconnect(audioDest); } catch(e) {}
      try { state.bgmGainNode.disconnect(audioDest); } catch(e) {}
      
      if (state.exportChunks.length > 0) {
        const blob = new Blob(state.exportChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `${state.projectName.replace(/\s+/g, "_")}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Ekspor video berhasil!");
      } else {
        showToast("Ekspor gagal.");
      }
      cleanupExportState();
    };
  
    state.exportRecorder.start();
    
    let renderTime = 0.0;
    startAudioTracks(0);
  
    const fps = 30;
    const frameDuration = 1 / fps;
    
    exportIntervalId = setInterval(() => {
      if (!state.isExporting) return;
      
      renderTime += frameDuration;
      
      if (renderTime >= totalDur) {
        renderTime = totalDur;
        clearInterval(exportIntervalId);
        stopAudioTracks();
        state.exportRecorder.stop();
        return;
      }
  
      // Draw frame
      drawExportFrame(exportCtx, renderTime, exportW, exportH);
  
      // Draw preview
      modalCtx.drawImage(exportCanvas, 0, 0, exportW, exportH);
  
      // Progress bar
      const progress = (renderTime / totalDur) * 100;
      el.exportProgressBar.style.width = `${progress}%`;
      el.exportProgressText.textContent = `${Math.min(100, Math.floor(progress))}%`;
      el.exportStatusText.textContent = `Merender: ${renderTime.toFixed(1)}s / ${totalDur.toFixed(1)}s`;
      
    }, frameDuration * 1000);
  }
  
  function drawExportFrame(cCtx, targetTime, wWidth, wHeight) {
    // Clear
    cCtx.fillStyle = "#000000";
    cCtx.fillRect(0, 0, wWidth, wHeight);
  
    // Find active segment
    const activeSeg = state.segments.find(s => targetTime >= s.start && targetTime <= s.end);
    if (!activeSeg) return;
  
    const imgObj = state.images.find(img => img.id === activeSeg.imageId);
    if (imgObj && imgObj.element) {
      const img = imgObj.element;
      
      const scaleX = wWidth / img.width;
      const scaleY = wHeight / img.height;
      const baseScale = Math.max(scaleX, scaleY);
      
      const w = img.width * baseScale;
      const h = img.height * baseScale;
  
      const segDuration = activeSeg.end - activeSeg.start;
      const progress = segDuration > 0 ? Math.min(Math.max((targetTime - activeSeg.start) / segDuration, 0), 1) : 0;
  
      cCtx.save();
      
      let finalScale = 1.0;
      let translateX = 0;
      let translateY = 0;
  
      switch (activeSeg.cameraMotion) {
        case "Zoom In":
          finalScale = 1.05 + progress * 0.17;
          break;
        case "Zoom Out":
          finalScale = 1.22 - progress * 0.17;
          break;
        case "Pan Kanan":
          finalScale = 1.15;
          translateX = w * 0.05 * (2 * progress - 1);
          break;
        case "Pan Kiri":
          finalScale = 1.15;
          translateX = w * 0.05 * (1 - 2 * progress);
          break;
        case "Pan Atas":
          finalScale = 1.15;
          translateY = h * 0.05 * (1 - 2 * progress);
          break;
        case "Pan Bawah":
          finalScale = 1.15;
          translateY = h * 0.05 * (2 * progress - 1);
          break;
        case "Static":
        default:
          finalScale = 1.0;
          break;
      }
  
      cCtx.translate(wWidth / 2 + translateX, wHeight / 2 + translateY);
      cCtx.scale(finalScale, finalScale);
      cCtx.drawImage(img, -w / 2, -h / 2, w, h);
      
      cCtx.restore();
    }
  
    // Draw subtitle text on canvas for recording
    if (activeSeg.text) {
      cCtx.shadowColor = "rgba(0, 0, 0, 1)";
      cCtx.shadowBlur = 8;
      cCtx.shadowOffsetX = 0;
      cCtx.shadowOffsetY = 2;
  
      // Apply colors and sizes
      cCtx.fillStyle = state.subtitleStyles.color;
      
      let fontSize = Math.floor(wHeight * 0.045); // default base
      if (state.subtitleStyles.size !== 24) {
        // Scaled factor
        fontSize = Math.floor(wHeight * (state.subtitleStyles.size / 533));
      }
      
      const isImpact = state.subtitleStyles.font === "Impact";
      cCtx.font = `${isImpact ? "900" : "600"} ${fontSize}px "${state.subtitleStyles.font}", Outfit`;
      cCtx.textAlign = "center";
      cCtx.textBaseline = "bottom";
  
      const textX = wWidth / 2;
      const textY = wHeight * 0.90;
      const maxWidth = wWidth * 0.85;
      const lineHeight = fontSize * 1.35;
  
      // Animate subtitles word by word inside video record
      const words = activeSeg.text.split(/\s+/).filter(w => w.length > 0);
      const segDuration = activeSeg.end - activeSeg.start;
      const progress = segDuration > 0 ? Math.min(Math.max((targetTime - activeSeg.start) / segDuration, 0), 1) : 0;
      const activeWordIdx = Math.min(words.length - 1, Math.floor(progress * words.length));
  
      let stringToDraw = "";
      if (state.subtitleStyles.animation === "progressive") {
        const wordsToShow = Math.ceil(progress * words.length);
        stringToDraw = words.slice(0, wordsToShow).join(" ");
        if (isImpact) stringToDraw = stringToDraw.toUpperCase();
        wrapText(cCtx, stringToDraw, textX, textY, maxWidth, lineHeight);
      } else if (state.subtitleStyles.animation === "highlight") {
        // For highlight in standard canvas, draw highlight colors
        // Draw standard line, or draw active word differently. To keep it robust, we draw progressive or highlight word-by-word
        let wordsDrawn = words.map((w, idx) => (idx === activeWordIdx ? `[H]${w}[/H]` : w)).join(" ");
        if (isImpact) wordsDrawn = wordsDrawn.toUpperCase();
        wrapTextWithHighlight(cCtx, wordsDrawn, textX, textY, maxWidth, lineHeight, state.subtitleStyles.color);
      } else {
        stringToDraw = activeSeg.text;
        if (isImpact) stringToDraw = stringToDraw.toUpperCase();
        wrapText(cCtx, stringToDraw, textX, textY, maxWidth, lineHeight);
      }
    }
  }
  
  // Canvas Text Wrapping
  function wrapText(canvasCtx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    const lines = [];
  
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = canvasCtx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);
  
    for (let i = lines.length - 1; i >= 0; i--) {
      canvasCtx.fillText(lines[i].trim(), x, y - (lines.length - 1 - i) * lineHeight);
    }
  }
  
  // Canvas Text Wrapping with [H]...[/H] highlight support
  function wrapTextWithHighlight(canvasCtx, text, x, y, maxWidth, lineHeight, baseColor) {
    // Simple layout: Draw the line, but substitute target highlights.
    // To keep it simple, we draw the sentence but override drawing the active word at its offset.
    // Below is a simplified solid drawing routine that handles single line wraps:
    const rawWords = text.split(" ");
    let line = "";
    const lines = [];
  
    for (let n = 0; n < rawWords.length; n++) {
      const w = rawWords[n].replace("[H]", "").replace("[/H]", "");
      const testLine = line + w + " ";
      const metrics = canvasCtx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = w + " ";
      } else {
        line = line + rawWords[n] + " "; // Keep markers in buffer lines
      }
    }
    lines.push(line);
  
    // Draw lines bottom up
    for (let i = lines.length - 1; i >= 0; i--) {
      const curLine = lines[i].trim();
      const curY = y - (lines.length - 1 - i) * lineHeight;
      
      // Draw centered words by computing offsets
      const lineWords = curLine.split(" ");
      const lineTextNoMarkers = curLine.replace(/\[H\]/g, "").replace(/\[\/H\]/g, "");
      const lineW = canvasCtx.measureText(lineTextNoMarkers).width;
      
      let curX = x - lineW / 2;
      
      lineWords.forEach(word => {
        const isHighlighted = word.includes("[H]");
        const cleanWord = word.replace("[H]", "").replace("[/H]", "");
        
        canvasCtx.fillStyle = isHighlighted ? "#FFFF00" : baseColor; // Yellow highlight
        canvasCtx.fillText(cleanWord, curX + canvasCtx.measureText(cleanWord).width / 2, curY);
        
        curX += canvasCtx.measureText(cleanWord + " ").width;
      });
    }
  }
  
  function cancelExport() {
    if (exportIntervalId) {
      clearInterval(exportIntervalId);
      exportIntervalId = null;
    }
    if (state.exportRecorder && state.exportRecorder.state !== "inactive") {
      state.exportRecorder.stop();
    }
    stopAudioTracks();
    cleanupExportState();
    showToast("Ekspor dibatalkan.");
  }
  
  function cleanupExportState() {
    state.isExporting = false;
    state.exportRecorder = null;
    state.exportChunks = [];
    el.modalExportOverlay.classList.add("hidden");
  }
  
  // ==========================================================================
  // PERSISTENCE (LocalStorage Save/Load)
  // ==========================================================================
  function saveProjectLocal() {
    const projectData = {
      projectName: state.projectName,
      voVolume: state.voVolume,
      bgmVolume: state.bgmVolume,
      bgmType: state.bgmType,
      aspectRatio: state.aspectRatio,
      subtitleStyles: state.subtitleStyles,
      segments: state.segments.map(s => ({
        start: s.start,
        end: s.end,
        imageId: s.imageId,
        cameraMotion: s.cameraMotion,
        text: s.text
      }))
    };
  
    const jsonStr = JSON.stringify(projectData, null, 2);
    localStorage.setItem("md8_project_save", jsonStr);
  
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.projectName.replace(/\s+/g, "_")}_MD8_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  
    el.btnSave.classList.add("btn-pulse");
    setTimeout(() => el.btnSave.classList.remove("btn-pulse"), 2000);
    showToast("Projek MD8 Studio berhasil disimpan.");
  }
  
  function loadSavedProjectLocal() {
    const savedDataStr = localStorage.getItem("md8_project_save");
    if (!savedDataStr) return;
  
    try {
      const data = JSON.parse(savedDataStr);
      state.projectName = data.projectName || "Manga Video Creator";
      el.projectNameInput.value = state.projectName;
      
      state.voVolume = data.voVolume !== undefined ? data.voVolume : 1.0;
      el.voVolumeSlider.value = state.voVolume * 100;
      el.voVolumeVal.textContent = Math.round(state.voVolume * 100) + "%";
  
      state.bgmVolume = data.bgmVolume !== undefined ? data.bgmVolume : 0.12;
      el.bgmVolumeSlider.value = state.bgmVolume * 100;
      el.bgmVolumeVal.textContent = Math.round(state.bgmVolume * 100) + "%";
  
      if (data.bgmType) {
        state.bgmType = data.bgmType;
        el.bgmSelect.value = data.bgmType.startsWith("procedural") ? data.bgmType : "";
        if (state.bgmType) el.btnDeleteBGM.classList.remove("hidden");
      }
  
      if (data.aspectRatio) {
        state.aspectRatio = data.aspectRatio;
        el.btnAspects.forEach(btn => {
          btn.classList.toggle("active", btn.dataset.ratio === state.aspectRatio);
        });
        changeAspectRatioPreset(state.aspectRatio);
      }
  
      if (data.subtitleStyles) {
        state.subtitleStyles = data.subtitleStyles;
        el.subFontSelect.value = state.subtitleStyles.font;
        el.subColorSelect.value = state.subtitleStyles.color;
        el.subStyleSelect.value = state.subtitleStyles.animation;
        el.subSizeSlider.value = state.subtitleStyles.size;
        el.subSizeVal.textContent = state.subtitleStyles.size + "px";
      }
  
      state.segments = data.segments || [];
      renderTimelineSegments();
      showToast("Projek MD8 Studio berhasil dipulihkan.");
    } catch (err) {
      console.error("Gagal memulihkan projek:", err);
    }
  }
  
  // ==========================================================================
  // UTILITY FUNCTIONS & ON-LOAD
  // ==========================================================================
  function formatTime(sec) {
    if (isNaN(sec) || sec === Infinity) return "00:00";
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }
  
  window.addEventListener("DOMContentLoaded", () => {
    initEvents();
    loadSavedProjectLocal();
    
    if (typeof speechSynthesis !== "undefined") {
      loadSystemVoices();
    }
  
    // Draw default blank state
    drawFrame();
    drawDbMeter();
  });
  