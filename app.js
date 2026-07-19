// ============================================================
// MD8 STUDIO PRO - FULL JAVASCRIPT
// ============================================================

// === STATE ===
const App = {
    clips: [],
    currentTime: 0,
    playing: false,
    muted: false,
    volume: 0.8,
    totalDuration: 10,
    selectedIdx: -1,
    mediaItems: [],
    voBuffer: null,
    bgmBuffer: null,
    voTrimStart: 0,
    voTrimEnd: 0,
    bgmTrimStart: 0,
    bgmTrimEnd: 0,
    voVolume: 1,
    bgmVolume: 0.8,
    audioCtx: null,
    gainNode: null,
    voGainNode: null,
    bgmGainNode: null,
    voSource: null,
    bgmSource: null,
    voWaveformData: null,
    _playStart: 0,
    _playOffset: 0,
    animFrame: null,
    dragClip: null,
    dragOffsetX: 0,
    isDragging: false,
    timelineZoom: 10,
    groqApiKey: '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',
    aspectRatio: '16:9',
    isExporting: false,
    imageScale: 100,
    imageBlur: 0,
    imageOpacity: 100,
    imageBrightness: 100,
    characters: [],
    scriptPanels: [],
    voTag: '',
    isMobile: window.innerWidth <= 768,
    exportResolution: '1080p',
    exportBitrate: 8,
};

// === DOM REFS ===
const $ = id => document.getElementById(id);

const DOM = {
    projectName: $('projectName'),
    btnExport: $('btnExport'),
    btnSave: $('btnSave'),
    btnToggleLeft: $('btnToggleLeft'),
    btnToggleRight: $('btnToggleRight'),
    btnScript: $('btnScript'),
    leftPanel: $('leftPanel'),
    rightPanel: $('rightPanel'),
    mediaGrid: $('mediaGrid'),
    mediaInput: $('mediaInput'),
    voInput: $('voInput'),
    bgmInput: $('bgmInput'),
    voStatus: $('voStatus'),
    bgmStatus: $('bgmStatus'),
    btnClearVO: $('btnClearVO'),
    btnClearBGM: $('btnClearBGM'),
    effectItems: document.querySelectorAll('.effect-item'),
    btnRewind: $('btnRewind'),
    btnPlay: $('btnPlay'),
    btnMute: $('btnMute'),
    currentTime: $('currentTime'),
    totalTime: $('totalTime'),
    scrubber: $('scrubber'),
    playerCanvas: $('playerCanvas'),
    subtitleDisplay: $('subtitleDisplay'),
    timelineBody: $('timelineBody'),
    timelineInner: $('timelineInner'),
    trackVideo: $('trackVideo'),
    trackVO: $('trackVO'),
    trackBGM: $('trackBGM'),
    playheadLine: $('playheadLine'),
    ruler: $('ruler'),
    btnAddClip: $('btnAddClip'),
    btnSplit: $('btnSplit'),
    btnDeleteClip: $('btnDeleteClip'),
    btnAutoAnim: $('btnAutoAnim'),
    btnApplyAllAnim: $('btnApplyAllAnim'),
    btnAddTransition: $('btnAddTransition'),
    btnFadeIn: $('btnFadeIn'),
    btnFadeOut: $('btnFadeOut'),
    btnSyncAudio: $('btnSyncAudio'),
    btnAddVOTag: $('btnAddVOTag'),
    timelineZoom: $('timelineZoom'),
    zoomLabel: $('zoomLabel'),
    zoomInBtn: $('zoomInBtn'),
    zoomOutBtn: $('zoomOutBtn'),
    scriptPanel: $('scriptPanel'),
    scriptText: $('scriptText'),
    btnSyncScript: $('btnSyncScript'),
    btnAIScriptGen: $('btnAIScriptGen'),
    btnCloseScript: $('btnCloseScript'),
    toast: $('toast'),
    toastIcon: $('toastIcon'),
    toastMsg: $('toastMsg'),
    aiProgress: $('aiProgress'),
    aiProgressFill: $('aiProgressFill'),
    aiProgressText: $('aiProgressText'),
    aiStatus: $('aiStatus'),
    btnAspect: document.querySelectorAll('.btn-aspect'),
    volumeSlider: $('volumeSlider'),
    chatMessages: $('chatMessages'),
    chatInput: $('chatInput'),
    btnChatSend: $('btnChatSend'),
    imgScale: $('imgScale'),
    imgScaleVal: $('imgScaleVal'),
    imgBlur: $('imgBlur'),
    imgBlurVal: $('imgBlurVal'),
    imgOpacity: $('imgOpacity'),
    imgOpacityVal: $('imgOpacityVal'),
    imgBrightness: $('imgBrightness'),
    imgBrightnessVal: $('imgBrightnessVal'),
    btnApplyImageSettings: $('btnApplyImageSettings'),
    btnAIAdjustImage: $('btnAIAdjustImage'),
    btnResetImage: $('btnResetImage'),
    scriptPreviewPanel: $('scriptPreviewPanel'),
    scriptPreviewBody: $('scriptPreviewBody'),
    btnCopyScript: $('btnCopyScript'),
    btnApplyScript: $('btnApplyScript'),
    btnClosePreview: $('btnClosePreview'),
    voVolume: $('voVolume'),
    voVolumeVal: $('voVolumeVal'),
    bgmVolume: $('bgmVolume'),
    bgmVolumeVal: $('bgmVolumeVal'),
    voTagInput: $('voTagInput'),
    transisiPopup: $('transisiPopup'),
    transisiGrid: $('transisiGrid'),
    btnTransisiApply: $('btnTransisiApply'),
    btnTransisiClose: $('btnTransisiClose'),
    exportModal: $('exportModal'),
    exportProgressBar: $('exportProgressBar'),
    exportStatus: $('exportStatus'),
    exportPercent: $('exportPercent'),
    exportDetail: $('exportDetail'),
    exportEstimate: $('exportEstimate'),
    exportPreview: $('exportPreview'),
    btnStartExport: $('btnStartExport'),
    btnCancelExport: $('btnCancelExport'),
    resGrid: $('resGrid'),
    exportBitrate: $('exportBitrate'),
    exportBitrateVal: $('exportBitrateVal'),
};

// === UTILITIES ===
function fmtTime(sec) {
    if (!sec || isNaN(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1).padStart(4, '0');
    return `${String(m).padStart(2, '0')}:${s}`;
}

let toastTimer;

function showToast(msg, icon = 'ℹ️', dur = 3000) {
    clearTimeout(toastTimer);
    DOM.toastIcon.textContent = icon;
    DOM.toastMsg.textContent = msg;
    DOM.toast.classList.add('visible');
    toastTimer = setTimeout(() => DOM.toast.classList.remove('visible'), dur);
}

function getAudioCtx() {
    if (!App.audioCtx || App.audioCtx.state === 'closed') {
        App.audioCtx = new(window.AudioContext || window.webkitAudioContext)();
        App.gainNode = App.audioCtx.createGain();
        App.gainNode.gain.value = App.volume;
        App.gainNode.connect(App.audioCtx.destination);

        App.voGainNode = App.audioCtx.createGain();
        App.voGainNode.gain.value = App.voVolume;
        App.voGainNode.connect(App.gainNode);

        App.bgmGainNode = App.audioCtx.createGain();
        App.bgmGainNode.gain.value = App.bgmVolume;
        App.bgmGainNode.connect(App.gainNode);
    }
    return App.audioCtx;
}

function getMedia(id) {
    return App.mediaItems.find(m => m.id === id) || null;
}

function fileToDataURL(file) {
    return new Promise((res) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = () => res(null);
        fr.readAsDataURL(file);
    });
}

function makeClip(idx) {
    return {
        id: Date.now() + idx + Math.random().toString(36).slice(2, 5),
        start: idx * 3,
        end: idx * 3 + 3,
        duration: 3,
        text: '',
        mediaId: null,
        animType: 'static',
        effect: 'none',
        scale: 100,
        posX: 0,
        posY: 0,
        rotate: 0,
        opacity: 100,
        brightness: 100,
        animSpeed: 1,
        animIntensity: 100,
        panelNumber: idx + 1,
        bgBlur: 0,
        character: '',
        voTag: '',
        transition: 'none',
        transitionDur: 0.6,
    };
}

// === ASPECT RATIO ===
const RATIOS = {
    '16:9': { w: 1280, h: 720 },
    '9:16': { w: 720, h: 1280 },
    '1:1': { w: 720, h: 720 },
    '4:3': { w: 960, h: 720 },
};

function applyRatio(ratio) {
    App.aspectRatio = ratio;
    const { w, h } = RATIOS[ratio] || RATIOS['16:9'];
    DOM.playerCanvas.width = w;
    DOM.playerCanvas.height = h;
    DOM.btnAspect.forEach(b => b.classList.toggle('active', b.dataset.ratio === ratio));
    renderFrame();
}

DOM.btnAspect.forEach(btn => {
    btn.addEventListener('click', () => applyRatio(btn.dataset.ratio));
});

// === PANEL TOGGLES ===
DOM.btnToggleLeft.addEventListener('click', () => {
    if (App.isMobile) {
        DOM.leftPanel.classList.toggle('open');
        DOM.rightPanel.classList.remove('open');
    } else {
        DOM.leftPanel.style.display = DOM.leftPanel.style.display === 'none' ? 'block' : 'none';
    }
});

DOM.btnToggleRight.addEventListener('click', () => {
    if (App.isMobile) {
        DOM.rightPanel.classList.toggle('open');
        DOM.leftPanel.classList.remove('open');
    } else {
        DOM.rightPanel.style.display = DOM.rightPanel.style.display === 'none' ? 'block' : 'none';
    }
});

DOM.btnScript.addEventListener('click', () => {
    DOM.scriptPanel.classList.toggle('visible');
    DOM.scriptText.focus();
});
DOM.btnCloseScript.addEventListener('click', () => DOM.scriptPanel.classList.remove('visible'));

document.addEventListener('click', (e) => {
    if (App.isMobile) {
        const left = DOM.leftPanel;
        const right = DOM.rightPanel;
        if (!left.contains(e.target) && !e.target.closest('.header-right') && !e.target.closest('#btnToggleLeft')) {
            left.classList.remove('open');
        }
        if (!right.contains(e.target) && !e.target.closest('.header-right') && !e.target.closest('#btnToggleRight')) {
            right.classList.remove('open');
        }
    }
});

// === VOLUME ===
DOM.volumeSlider.addEventListener('input', function() {
    App.volume = parseInt(this.value) / 100;
    if (App.gainNode) {
        App.gainNode.gain.value = App.muted ? 0 : App.volume;
    }
});

DOM.voVolume.addEventListener('input', function() {
    App.voVolume = parseInt(this.value) / 100;
    DOM.voVolumeVal.textContent = this.value + '%';
    if (App.voGainNode) {
        App.voGainNode.gain.value = App.voVolume;
    }
});

DOM.bgmVolume.addEventListener('input', function() {
    App.bgmVolume = parseInt(this.value) / 100;
    DOM.bgmVolumeVal.textContent = this.value + '%';
    if (App.bgmGainNode) {
        App.bgmGainNode.gain.value = App.bgmVolume;
    }
});

// === CLEAR AUDIO ===
DOM.btnClearVO.addEventListener('click', function() {
    App.voBuffer = null;
    App.voWaveformData = null;
    DOM.voStatus.textContent = 'VO: -';
    showToast('VO dihapus', '🗑️');
    renderTimeline();
});

DOM.btnClearBGM.addEventListener('click', function() {
    App.bgmBuffer = null;
    DOM.bgmStatus.textContent = 'BGM: -';
    showToast('BGM dihapus', '🗑️');
    renderTimeline();
});

// === FADE IN/OUT ===
DOM.btnFadeIn.addEventListener('click', function() {
    if (App.voBuffer) {
        showToast('✅ Fade In VO', '🌅');
    }
    if (App.bgmBuffer) {
        showToast('✅ Fade In BGM', '🌅');
    }
});

DOM.btnFadeOut.addEventListener('click', function() {
    if (App.voBuffer) {
        showToast('✅ Fade Out VO', '🌇');
    }
    if (App.bgmBuffer) {
        showToast('✅ Fade Out BGM', '🌇');
    }
});

// === SYNC AUDIO ===
DOM.btnSyncAudio.addEventListener('click', function() {
    if (!App.voBuffer || App.clips.length === 0) {
        showToast('Butuh VO dan clip untuk sync', '⚠️');
        return;
    }

    const voDuration = App.voTrimEnd - App.voTrimStart;
    const totalClips = App.clips.length;
    const durPerClip = voDuration / totalClips;

    let cursor = 0;
    App.clips.forEach((clip, i) => {
        clip.duration = durPerClip;
        clip.start = cursor;
        clip.end = cursor + durPerClip;
        cursor += durPerClip;
    });

    App.totalDuration = cursor;
    App.selectedIdx = 0;
    renderTimeline();
    renderFrame();
    showToast(`✅ Audio sync: ${totalClips} clip disesuaikan`, '🎵');
});

// === VO TAG ===
DOM.btnAddVOTag.addEventListener('click', function() {
    const tag = DOM.voTagInput.value.trim();
    if (!tag) {
        showToast('Masukkan nama tag dulu', '⚠️');
        return;
    }
    if (App.selectedIdx < 0 || App.selectedIdx >= App.clips.length) {
        showToast('Pilih clip dulu', '⚠️');
        return;
    }
    App.clips[App.selectedIdx].voTag = tag;
    App.voTag = tag;
    DOM.voTagInput.value = '';
    renderTimeline();
    showToast(`🏷️ Tag "${tag}" diterapkan ke clip #${App.selectedIdx+1}`, '✅');
});

// === EFFECT ITEMS ===
DOM.effectItems.forEach(item => {
    item.addEventListener('click', function() {
        if (App.selectedIdx < 0 || App.selectedIdx >= App.clips.length) {
            showToast('Pilih clip di timeline dulu', '⚠️');
            return;
        }
        const clip = App.clips[App.selectedIdx];
        DOM.effectItems.forEach(el => el.classList.remove('active'));
        this.classList.add('active');

        if (this.dataset.effect) {
            clip.effect = this.dataset.effect;
            showToast(`Efek: ${this.textContent.trim()}`, '✅');
        }
        if (this.dataset.anim) {
            clip.animType = this.dataset.anim;
            showToast(`Animasi: ${this.textContent.trim()}`, '✅');
        }
        renderFrame();
        renderTimeline();
    });
});

// === APPLY ANIMATION TO ALL ===
DOM.btnApplyAllAnim.addEventListener('click', function() {
    if (App.selectedIdx < 0 || App.selectedIdx >= App.clips.length) {
        showToast('Pilih clip dulu sebagai referensi', '⚠️');
        return;
    }
    const sourceClip = App.clips[App.selectedIdx];
    let count = 0;
    App.clips.forEach((clip, i) => {
        if (i !== App.selectedIdx) {
            clip.animType = sourceClip.animType;
            clip.animSpeed = sourceClip.animSpeed;
            clip.animIntensity = sourceClip.animIntensity;
            clip.effect = sourceClip.effect;
            count++;
        }
    });
    renderTimeline();
    renderFrame();
    showToast(`✅ Diterapkan ke ${count} clip lain`, '📌');
});

// === TRANSISI ===
DOM.btnAddTransition.addEventListener('click', function() {
    if (App.clips.length < 2) {
        showToast('Butuh minimal 2 clip untuk transisi', '⚠️');
        return;
    }
    let gapIdx = -1;
    for (let i = 0; i < App.clips.length - 1; i++) {
        if (App.clips[i].end < App.clips[i + 1].start) {
            gapIdx = i;
            break;
        }
    }
    if (gapIdx === -1) {
        showToast('Buat celah antar clip dulu (drag clip)', '⚠️');
        return;
    }
    App.selectedTransitionIdx = gapIdx;
    DOM.transisiPopup.classList.add('visible');
});

DOM.transisiGrid.addEventListener('click', function(e) {
    const item = e.target.closest('.item');
    if (!item) return;
    DOM.transisiGrid.querySelectorAll('.item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
});

DOM.btnTransisiApply.addEventListener('click', function() {
    const active = DOM.transisiGrid.querySelector('.item.active');
    if (!active) return;
    const transType = active.dataset.trans;
    if (App.selectedTransitionIdx >= 0 && App.selectedTransitionIdx < App.clips.length - 1) {
        App.clips[App.selectedTransitionIdx].transition = transType;
        App.clips[App.selectedTransitionIdx].transitionDur = 0.6;
        showToast(`✅ Transisi "${active.textContent.trim()}" diterapkan`, '🔄');
        renderTimeline();
    }
    DOM.transisiPopup.classList.remove('visible');
});

DOM.btnTransisiClose.addEventListener('click', function() {
    DOM.transisiPopup.classList.remove('visible');
});

// === WAVEFORM GENERATOR ===
function generateWaveform(buffer) {
    const data = buffer.getChannelData(0);
    const samples = Math.min(data.length, 3000);
    const step = Math.floor(data.length / samples);
    App.voWaveformData = [];
    for (let i = 0; i < samples && i * step < data.length; i++) {
        const idx = i * step;
        let sum = 0;
        for (let j = 0; j < step && idx + j < data.length; j++) {
            sum += Math.abs(data[idx + j]);
        }
        App.voWaveformData.push(sum / step);
    }
}

function drawWaveform(canvas, data, color = 'rgba(99,102,241,0.7)') {
    const W = canvas.width || canvas.parentElement.offsetWidth || 100;
    const H = canvas.height || canvas.parentElement.offsetHeight || 30;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    if (!data || data.length === 0) return;

    const maxVal = Math.max(...data) || 1;
    const mid = H / 2;

    for (let i = 0; i < data.length; i++) {
        const x = (i / data.length) * W;
        const h = (data[i] / maxVal) * H * 0.85;
        const gradient = ctx.createLinearGradient(x, 0, x, H);
        gradient.addColorStop(0, color.replace('0.7', '0.9'));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, color.replace('0.7', '0.2'));
        ctx.fillStyle = gradient;
        ctx.fillRect(x, mid - h, Math.max(1.5, W / data.length), h * 2);
    }
}

// === MEDIA UPLOAD ===
DOM.mediaInput.addEventListener('change', async function() {
    const files = Array.from(this.files);
    if (!files.length) return;
    for (const file of files) {
        const url = await fileToDataURL(file);
        if (!url) continue;
        const el = document.createElement('img');
        el.src = url;
        await new Promise(r => { el.onload = r; el.onerror = r; });

        App.mediaItems.push({
            id: 'med_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
            name: file.name,
            url: url,
            el: el,
        });
    }
    this.value = '';
    renderMedia();
    showToast(`${files.length} gambar dimuat`, '📁');
    if (files.length > 0) {
        addChatMessage('🌸 Rin', `Aku lihat ${files.length} gambar baru! Mau aku bantu analisis karakternya?`, 'ai');
    }
});

DOM.voInput.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;
    try {
        const buf = await file.arrayBuffer();
        const ac = getAudioCtx();
        App.voBuffer = await ac.decodeAudioData(buf);
        App.voTrimStart = 0;
        App.voTrimEnd = App.voBuffer.duration;
        generateWaveform(App.voBuffer);
        DOM.voStatus.textContent = `VO: ${file.name}`;
        showToast('VO dimuat', '🎙️');
        addChatMessage('🌸 Rin', `VO "${file.name}" berhasil dimuat!`, 'ai');
        renderTimeline();
    } catch (e) {
        showToast('Gagal memuat VO', '❌');
    }
    this.value = '';
});

DOM.bgmInput.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;
    try {
        const buf = await file.arrayBuffer();
        const ac = getAudioCtx();
        App.bgmBuffer = await ac.decodeAudioData(buf);
        App.bgmTrimStart = 0;
        App.bgmTrimEnd = App.bgmBuffer.duration;
        DOM.bgmStatus.textContent = `BGM: ${file.name}`;
        showToast('BGM dimuat', '🎵');
        addChatMessage('🌸 Rin', `BGM "${file.name}" siap!`, 'ai');
        renderTimeline();
    } catch (e) {
        showToast('Gagal memuat BGM', '❌');
    }
    this.value = '';
});

// === MEDIA RENDER ===
function renderMedia() {
    DOM.mediaGrid.innerHTML = '';
    if (App.mediaItems.length === 0) {
        DOM.mediaGrid.innerHTML = '<div style="grid-column:span 2;text-align:center;color:var(--text3);font-size:9px;padding:12px;">Belum ada gambar</div>';
        return;
    }
    App.mediaItems.forEach((med, idx) => {
        const div = document.createElement('div');
        div.className = 'media-item';
        div.innerHTML = `
            <img src="${med.url}" alt="${med.name}">
            <span class="badge">#${idx+1}</span>
        `;
        div.addEventListener('click', () => addMediaToTimeline(med.id));
        DOM.mediaGrid.appendChild(div);
    });
}

function addMediaToTimeline(mediaId) {
    const media = getMedia(mediaId);
    if (!media) return;
    const last = App.clips.length ? App.clips[App.clips.length - 1] : null;
    const start = last ? last.end : 0;
    const dur = 4;
    const clip = makeClip(App.clips.length);
    clip.start = start;
    clip.end = start + dur;
    clip.duration = dur;
    clip.mediaId = mediaId;
    clip.panelNumber = App.clips.length + 1;
    App.clips.push(clip);
    App.totalDuration = Math.max(App.totalDuration, clip.end);
    App.selectedIdx = App.clips.length - 1;
    renderTimeline();
    renderFrame();
    showToast(`Panel #${clip.panelNumber} ditambahkan`, '📖');
}

// === TIMELINE ===
function getTimelineWidth() {
    const totalDur = Math.max(App.totalDuration, 1);
    const zoom = App.timelineZoom || 10;
    return Math.max(totalDur * zoom, DOM.timelineBody.clientWidth || 600);
}

function renderTimeline() {
    DOM.trackVideo.innerHTML = '<span class="track-label">🎬 VIDEO</span>';
    DOM.trackVO.innerHTML = '<span class="track-label">🎙️ VO</span>';
    DOM.trackBGM.innerHTML = '<span class="track-label">🎵 BGM</span>';

    const totalW = getTimelineWidth();
    const totalDur = Math.max(App.totalDuration, 1);
    const zoom = App.timelineZoom || 10;

    DOM.timelineInner.style.width = totalW + 'px';
    DOM.timelineInner.style.minWidth = '100%';

    DOM.ruler.innerHTML = '';
    const step = zoom > 20 ? 2 : (zoom > 10 ? 5 : 10);
    const timeStep = step / zoom;
    for (let t = 0; t <= totalDur; t += timeStep) {
        const x = t * zoom;
        if (x > totalW) break;
        const tick = document.createElement('div');
        tick.className = 'tick';
        tick.style.left = x + 'px';
        DOM.ruler.appendChild(tick);
        const label = document.createElement('div');
        label.className = 'tick-label';
        label.style.left = x + 'px';
        label.textContent = fmtTime(t);
        DOM.ruler.appendChild(label);
    }

    App.clips.forEach((clip, i) => {
        const x = clip.start * zoom;
        const w = (clip.end - clip.start) * zoom;
        if (w < 2) return;

        const media = clip.mediaId ? getMedia(clip.mediaId) : null;
        const track = DOM.trackVideo;

        const el = document.createElement('div');
        el.className = `clip-item clip-manga` + (i === App.selectedIdx ? ' active' : '');
        el.style.left = x + 'px';
        el.style.width = Math.max(w, 8) + 'px';
        el.dataset.idx = i;

        let thumbHtml = '';
        if (media) {
            thumbHtml = `<img class="thumb" src="${media.url}" alt="">`;
        }

        let label = `#${clip.panelNumber || i+1}`;
        if (clip.text && !clip.text.includes('buat narasi')) {
            label += ` ${clip.text.substring(0, 10)}${clip.text.length > 10 ? '...' : ''}`;
        }
        if (clip.character) {
            label += ` ✦${clip.character}`;
        }
        if (clip.voTag) {
            label += ` 🏷️${clip.voTag}`;
        }

        el.innerHTML = `
            ${thumbHtml}
            <span class="label">${label}</span>
            <div class="handle handle-left" data-action="resize-left"></div>
            <div class="handle handle-right" data-action="resize-right"></div>
        `;

        el.addEventListener('dblclick', () => {
            const text = prompt('Edit narasi untuk panel ini:', clip.text || '');
            if (text !== null) clip.text = text;
            renderTimeline();
            renderFrame();
        });

        el.addEventListener('mousedown', (e) => {
            if (e.target.dataset.action) return;
            selectClip(i);
            startDrag(i, e);
        });

        const leftHandle = el.querySelector('[data-action="resize-left"]');
        const rightHandle = el.querySelector('[data-action="resize-right"]');
        leftHandle.addEventListener('mousedown', (e) => { e.stopPropagation(); startResize(i, 'left', e); });
        rightHandle.addEventListener('mousedown', (e) => { e.stopPropagation(); startResize(i, 'right', e); });

        track.appendChild(el);

        if (i < App.clips.length - 1) {
            const gapStart = clip.end;
            const gapEnd = App.clips[i + 1].start;
            if (gapStart < gapEnd) {
                const gapX = gapStart * zoom;
                const gapW = (gapEnd - gapStart) * zoom;
                if (gapW > 2) {
                    const gap = document.createElement('div');
                    const hasTrans = clip.transition && clip.transition !== 'none';
                    gap.className = `transition-gap${hasTrans ? ' has-transition' : ''}`;
                    gap.style.left = gapX + 'px';
                    gap.style.width = Math.max(gapW, 6) + 'px';
                    const transLabel = hasTrans ? clip.transition : '+';
                    gap.innerHTML = `<span class="icon">🔄 ${transLabel}</span>`;
                    gap.title = hasTrans ? `Transisi: ${clip.transition}` : 'Klik untuk atur transisi';
                    gap.addEventListener('click', (e) => {
                        e.stopPropagation();
                        App.selectedTransitionIdx = i;
                        DOM.transisiGrid.querySelectorAll('.item').forEach(el => {
                            el.classList.toggle('active', el.dataset.trans === clip.transition);
                        });
                        DOM.transisiPopup.classList.add('visible');
                    });
                    track.appendChild(gap);
                }
            }
        }
    });

    // VO track with waveform
    if (App.voBuffer) {
        const voClip = document.createElement('div');
        voClip.className = 'clip-item clip-vo';
        const voDur = App.voTrimEnd - App.voTrimStart;
        const startOffset = App.voTrimStart;
        voClip.style.cssText = `position:absolute;left:${startOffset * zoom}px;top:2px;bottom:2px;width:${Math.max(voDur * zoom, 12)}px;border:1px solid rgba(99,102,241,0.3);border-radius:4px;overflow:hidden;`;

        const waveCanvas = document.createElement('canvas');
        waveCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
        waveCanvas.className = 'vo-waveform';
        voClip.appendChild(waveCanvas);

        const label = document.createElement('span');
        label.className = 'vo-label';
        const tagText = App.voTag || 'VO';
        label.textContent = `🎙️ ${tagText} (${fmtTime(voDur)})`;
        voClip.appendChild(label);

        if (App.voTag) {
            const tagBadge = document.createElement('span');
            tagBadge.className = 'vo-tag';
            tagBadge.textContent = `🏷️ ${App.voTag}`;
            voClip.appendChild(tagBadge);
        }

        DOM.trackVO.appendChild(voClip);

        setTimeout(() => {
            if (App.voWaveformData) {
                drawWaveform(waveCanvas, App.voWaveformData, 'rgba(99,102,241,0.7)');
            }
        }, 50);
    }

    if (App.bgmBuffer) {
        const bgmClip = document.createElement('div');
        bgmClip.className = 'clip-item clip-bgm';
        const bgmDur = App.bgmTrimEnd - App.bgmTrimStart;
        const startOffset = App.bgmTrimStart;
        bgmClip.style.cssText = `position:absolute;left:${startOffset * zoom}px;top:2px;bottom:2px;width:${Math.max(bgmDur * zoom, 8)}px;border:1px solid rgba(74,222,128,0.3);border-radius:4px;display:flex;align-items:center;justify-content:center;`;
        bgmClip.innerHTML = `<span class="bgm-label">🎵 BGM (${fmtTime(bgmDur)})</span>`;
        DOM.trackBGM.appendChild(bgmClip);
    }

    updatePlayhead();
    updateScrubber();
    updateZoomLabel();
}

// === ZOOM ===
DOM.timelineZoom.addEventListener('input', function() {
    App.timelineZoom = parseInt(this.value);
    renderTimeline();
    updateZoomLabel();
});

DOM.zoomInBtn.addEventListener('click', () => {
    DOM.timelineZoom.value = Math.min(50, parseInt(DOM.timelineZoom.value) + 2);
    DOM.timelineZoom.dispatchEvent(new Event('input'));
});

DOM.zoomOutBtn.addEventListener('click', () => {
    DOM.timelineZoom.value = Math.max(1, parseInt(DOM.timelineZoom.value) - 2);
    DOM.timelineZoom.dispatchEvent(new Event('input'));
});

function updateZoomLabel() {
    DOM.zoomLabel.textContent = App.timelineZoom + 'x';
}

DOM.timelineBody.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -2 : 2;
        DOM.timelineZoom.value = Math.max(1, Math.min(50, parseInt(DOM.timelineZoom.value) + delta));
        DOM.timelineZoom.dispatchEvent(new Event('input'));
    }
}, { passive: false });

// === DRAG ===
function startDrag(idx, e) {
    const clip = App.clips[idx];
    if (!clip) return;
    App.dragClip = idx;
    const rect = DOM.timelineBody.getBoundingClientRect();
    App.dragOffsetX = ((e.clientX - rect.left + DOM.timelineBody.scrollLeft) / App.timelineZoom) - clip.start;
    App.isDragging = true;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
}

function onDragMove(e) {
    if (!App.isDragging || App.dragClip === null) return;
    const rect = DOM.timelineBody.getBoundingClientRect();
    const zoom = App.timelineZoom;
    const newStart = ((e.clientX - rect.left + DOM.timelineBody.scrollLeft) / zoom) - App.dragOffsetX;
    const clip = App.clips[App.dragClip];
    if (!clip) return;
    const dur = clip.end - clip.start;
    const maxStart = App.totalDuration - dur;
    clip.start = Math.max(0, Math.min(maxStart, newStart));
    clip.end = clip.start + dur;
    App.clips.sort((a, b) => a.start - b.start);
    App.selectedIdx = App.clips.indexOf(clip);
    renderTimeline();
    renderFrame();
    updateScrubber();
}

function onDragEnd() {
    App.isDragging = false;
    App.dragClip = null;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
}

// === RESIZE ===
function startResize(idx, side, e) {
    const clip = App.clips[idx];
    if (!clip) return;
    const startX = e.clientX;
    const origStart = clip.start;
    const origEnd = clip.end;
    const zoom = App.timelineZoom;

    function onResizeMove(ev) {
        const rect = DOM.timelineBody.getBoundingClientRect();
        const delta = ((ev.clientX - startX) / zoom);
        if (side === 'left') {
            const newStart = Math.max(0, origStart + delta);
            if (newStart < origEnd - 0.1) clip.start = newStart;
        } else {
            const newEnd = Math.max(origStart + 0.1, origEnd + delta);
            clip.end = newEnd;
            clip.duration = clip.end - clip.start;
            App.totalDuration = Math.max(App.totalDuration, clip.end);
        }
        renderTimeline();
        renderFrame();
    }

    function onResizeEnd() {
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('mouseup', onResizeEnd);
    }

    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
}

function selectClip(idx) {
    App.selectedIdx = idx;
    document.querySelectorAll('.clip-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.idx) === idx);
    });
    const clip = App.clips[idx];
    if (clip) {
        App.currentTime = clip.start;
        renderFrame();
        updatePlayhead();
        updateScrubber();
        DOM.imgScale.value = clip.scale || 100;
        DOM.imgScaleVal.textContent = (clip.scale || 100) + '%';
        DOM.imgBlur.value = clip.bgBlur || 0;
        DOM.imgBlurVal.textContent = (clip.bgBlur || 0) + 'px';
        DOM.imgOpacity.value = clip.opacity || 100;
        DOM.imgOpacityVal.textContent = (clip.opacity || 100) + '%';
        DOM.imgBrightness.value = clip.brightness || 100;
        DOM.imgBrightnessVal.textContent = (clip.brightness || 100) + '%';
        if (clip.voTag) {
            DOM.voTagInput.value = clip.voTag;
        }
    }
}

// === IMAGE CONTROLS ===
DOM.imgScale.addEventListener('input', function() {
    DOM.imgScaleVal.textContent = this.value + '%';
    if (App.selectedIdx >= 0 && App.selectedIdx < App.clips.length) {
        App.clips[App.selectedIdx].scale = parseInt(this.value);
        renderFrame();
    }
});

DOM.imgBlur.addEventListener('input', function() {
    DOM.imgBlurVal.textContent = this.value + 'px';
    if (App.selectedIdx >= 0 && App.selectedIdx < App.clips.length) {
        App.clips[App.selectedIdx].bgBlur = parseInt(this.value);
        renderFrame();
    }
});

DOM.imgOpacity.addEventListener('input', function() {
    DOM.imgOpacityVal.textContent = this.value + '%';
    if (App.selectedIdx >= 0 && App.selectedIdx < App.clips.length) {
        App.clips[App.selectedIdx].opacity = parseInt(this.value);
        renderFrame();
    }
});

DOM.imgBrightness.addEventListener('input', function() {
    DOM.imgBrightnessVal.textContent = this.value + '%';
    if (App.selectedIdx >= 0 && App.selectedIdx < App.clips.length) {
        App.clips[App.selectedIdx].brightness = parseInt(this.value);
        renderFrame();
    }
});

DOM.btnApplyImageSettings.addEventListener('click', function() {
    if (App.selectedIdx < 0 || App.selectedIdx >= App.clips.length) {
        showToast('Pilih clip dulu', '⚠️');
        return;
    }
    const clip = App.clips[App.selectedIdx];
    clip.scale = parseInt(DOM.imgScale.value);
    clip.bgBlur = parseInt(DOM.imgBlur.value);
    clip.opacity = parseInt(DOM.imgOpacity.value);
    clip.brightness = parseInt(DOM.imgBrightness.value);
    renderFrame();
    renderTimeline();
    showToast('✅ Pengaturan gambar diterapkan', '🖼️');
});

DOM.btnAIAdjustImage.addEventListener('click', function() {
    if (App.selectedIdx < 0 || App.selectedIdx >= App.clips.length) {
        showToast('Pilih clip dulu', '⚠️');
        return;
    }
    const clip = App.clips[App.selectedIdx];
    const media = clip.mediaId ? getMedia(clip.mediaId) : null;
    if (media) {
        clip.scale = 90 + Math.random() * 30;
        clip.bgBlur = 2 + Math.random() * 6;
        clip.opacity = 85 + Math.random() * 15;
        clip.brightness = 90 + Math.random() * 20;

        DOM.imgScale.value = clip.scale;
        DOM.imgScaleVal.textContent = clip.scale + '%';
        DOM.imgBlur.value = clip.bgBlur;
        DOM.imgBlurVal.textContent = clip.bgBlur + 'px';
        DOM.imgOpacity.value = clip.opacity;
        DOM.imgOpacityVal.textContent = clip.opacity + '%';
        DOM.imgBrightness.value = clip.brightness;
        DOM.imgBrightnessVal.textContent = clip.brightness + '%';

        renderFrame();
        renderTimeline();
        showToast('✨ AI Rin menyesuaikan gambar!', '🌸');
    } else {
        showToast('Tidak ada gambar di clip ini', '⚠️');
    }
});

DOM.btnResetImage.addEventListener('click', function() {
    if (App.selectedIdx < 0 || App.selectedIdx >= App.clips.length) {
        showToast('Pilih clip dulu', '⚠️');
        return;
    }
    const clip = App.clips[App.selectedIdx];
    clip.scale = 100;
    clip.bgBlur = 0;
    clip.opacity = 100;
    clip.brightness = 100;

    DOM.imgScale.value = 100;
    DOM.imgScaleVal.textContent = '100%';
    DOM.imgBlur.value = 0;
    DOM.imgBlurVal.textContent = '0px';
    DOM.imgOpacity.value = 100;
    DOM.imgOpacityVal.textContent = '100%';
    DOM.imgBrightness.value = 100;
    DOM.imgBrightnessVal.textContent = '100%';

    renderFrame();
    renderTimeline();
    showToast('↺ Gambar direset', '🔄');
});

// === CLIP OPERATIONS ===
function addClip() {
    const last = App.clips.length ? App.clips[App.clips.length - 1] : null;
    const start = last ? last.end : 0;
    const dur = 4;
    const clip = makeClip(App.clips.length);
    clip.duration = dur;
    clip.start = start;
    clip.end = start + dur;
    clip.panelNumber = App.clips.length + 1;
    if (App.mediaItems.length > 0) {
        clip.mediaId = App.mediaItems[App.clips.length % App.mediaItems.length].id;
    }
    App.clips.push(clip);
    App.totalDuration = Math.max(App.totalDuration, clip.end);
    App.selectedIdx = App.clips.length - 1;
    renderTimeline();
    renderFrame();
    showToast(`Panel #${clip.panelNumber} ditambahkan`, '➕');
}

function deleteClip() {
    if (App.selectedIdx < 0 || App.selectedIdx >= App.clips.length) {
        showToast('Pilih clip dulu', '⚠️');
        return;
    }
    App.clips.splice(App.selectedIdx, 1);
    if (App.selectedIdx >= App.clips.length) App.selectedIdx = App.clips.length - 1;
    let cursor = 0;
    App.clips.forEach((c, i) => {
        const dur = c.duration || 4;
        c.start = cursor;
        c.end = cursor + dur;
        c.panelNumber = i + 1;
        cursor += dur;
    });
    App.totalDuration = cursor || 10;
    renderTimeline();
    renderFrame();
    showToast('Clip dihapus', '🗑️');
}

DOM.btnAddClip.addEventListener('click', addClip);
DOM.btnDeleteClip.addEventListener('click', deleteClip);

DOM.btnSplit.addEventListener('click', function() {
    const time = App.currentTime;
    if (time <= 0 || time >= App.totalDuration) {
        showToast('Pindahkan playhead ke posisi potong', '⚠️');
        return;
    }
    let clipIdx = -1;
    for (let i = 0; i < App.clips.length; i++) {
        if (time >= App.clips[i].start && time < App.clips[i].end) {
            clipIdx = i;
            break;
        }
    }
    if (clipIdx === -1) { showToast('Tidak ada clip di posisi ini', '⚠️'); return; }

    const clip = App.clips[clipIdx];
    const newClip = { ...clip, id: Date.now() + Math.random().toString(36).slice(2, 5) };
    clip.end = time;
    clip.duration = clip.end - clip.start;
    newClip.start = time;
    newClip.duration = newClip.end - newClip.start;
    newClip.panelNumber = App.clips.length + 1;
    App.clips.splice(clipIdx + 1, 0, newClip);
    App.totalDuration = Math.max(App.totalDuration, newClip.end);
    renderTimeline();
    renderFrame();
    showToast('Clip dipotong!', '✂️');
});

// === AUTO ANIMATION ===
DOM.btnAutoAnim.addEventListener('click', function() {
    if (App.clips.length === 0) {
        showToast('Tambahkan clip dulu', '⚠️');
        return;
    }

    const anims = ['pan-left', 'pan-right', 'pan-up', 'pan-down', 'zoom-in', 'zoom-out', 'bounce', 'tracking', 'elastic', 'pop'];
    let count = 0;

    App.clips.forEach((clip, i) => {
        const animIdx = i % anims.length;
        clip.animType = anims[animIdx];
        clip.animSpeed = 0.8 + Math.random() * 0.6;
        clip.animIntensity = 80 + Math.random() * 40;
        count++;
    });

    renderTimeline();
    renderFrame();
    showToast(`✅ ${count} clip di-animasi otomatis!`, '🎬');
});

// === SCRIPT PANEL ===
DOM.btnSyncScript.addEventListener('click', function() {
    const raw = DOM.scriptText.value.trim();
    if (!raw) { showToast('Tulis naskah dulu', '⚠️'); return; }
    const paragraphs = raw.split(/\n\s*\n/).filter(p => p.trim());
    if (!paragraphs.length) { showToast('Minimal 1 paragraf', '⚠️'); return; }

    const dur = 4;
    let cursor = 0;
    const newClips = paragraphs.map((text, i) => {
        const clip = makeClip(i);
        clip.text = text.trim();
        clip.duration = dur;
        clip.start = cursor;
        clip.end = cursor + dur;
        clip.panelNumber = i + 1;
        const anims = ['pan-left', 'zoom-in', 'pan-right', 'tracking', 'bounce', 'elastic'];
        clip.animType = anims[i % anims.length];
        if (App.mediaItems.length > 0) {
            clip.mediaId = App.mediaItems[i % App.mediaItems.length].id;
        }
        cursor += dur;
        return clip;
    });

    App.clips = newClips;
    App.totalDuration = cursor || 10;
    App.selectedIdx = 0;
    renderTimeline();
    renderFrame();
    showToast(`${newClips.length} clip dibuat dari script`, '📝');
    DOM.scriptPanel.classList.remove('visible');
});

// === GROQ AI CALL ===
async function callGroqAI(prompt, systemPrompt = null) {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${App.groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b',
                messages: [{
                    role: 'system',
                    content: systemPrompt || 'Kamu adalah Rin, asisten AI yang pintar dan ramah untuk membuat manga. Kamu bisa bantu buat script, analisis karakter, dan animasi. Gunakan bahasa Indonesia yang natural. Jawab dengan jelas dan detail.'
                }, {
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 800,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Groq API Error:', errorData);
            return fallbackGenerate(prompt);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.warn('Groq API Error:', error);
        return fallbackGenerate(prompt);
    }
}

function fallbackGenerate(prompt) {
    return `Maaf, aku sedang offline. Tapi aku bisa bantu dengan ide ini: ${prompt.substring(0, 100)}... Coba lagi nanti ya! 🌸`;
}

// === CHAT SYSTEM ===
function addChatMessage(sender, message, type = 'ai') {
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    const label = type === 'ai' ? '🌸 Rin' : 'Kamu';
    div.innerHTML = `<span class="label">${label}</span>${message}`;
    DOM.chatMessages.appendChild(div);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

// === SHOW SCRIPT PREVIEW ===
function showScriptPreview(panels) {
    if (!panels || panels.length === 0) return;
    DOM.scriptPreviewPanel.classList.add('visible');
    App.scriptPanels = panels;

    let html = '';
    panels.forEach((panel, i) => {
        const num = i + 1;
        let text = panel.text || panel;
        let anim = panel.animType || 'static';
        html += `
            <div class="panel-item">
                <span class="num">#${num}</span>
                <span class="text">${text}</span>
                <span class="anim">${anim}</span>
            </div>
        `;
    });
    DOM.scriptPreviewBody.innerHTML = html;
    showToast(`📄 ${panels.length} panel siap! Lihat preview.`, '🌸');
}

DOM.btnCopyScript.addEventListener('click', function() {
    const texts = App.scriptPanels.map(p => p.text || p).join('\n\n');
    if (navigator.clipboard) {
        navigator.clipboard.writeText(texts).then(() => {
            showToast('📋 Script dicopy!', '✅');
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = texts;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('📋 Script dicopy!', '✅');
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = texts;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('📋 Script dicopy!', '✅');
    }
});

DOM.btnApplyScript.addEventListener('click', function() {
    if (!App.scriptPanels || App.scriptPanels.length === 0) {
        showToast('Tidak ada script untuk diaplikasikan', '⚠️');
        return;
    }

    const dur = 4;
    let cursor = 0;
    const newClips = App.scriptPanels.map((panel, i) => {
        const clip = makeClip(i);
        clip.text = panel.text || panel;
        clip.duration = dur;
        clip.start = cursor;
        clip.end = cursor + dur;
        clip.panelNumber = i + 1;
        clip.animType = panel.animType || 'static';
        if (App.mediaItems.length > 0) {
            clip.mediaId = App.mediaItems[i % App.mediaItems.length].id;
        }
        cursor += dur;
        return clip;
    });

    App.clips = newClips;
    App.totalDuration = cursor || 10;
    App.selectedIdx = 0;
    renderTimeline();
    renderFrame();
    DOM.scriptPreviewPanel.classList.remove('visible');
    showToast(`✅ ${newClips.length} clip dibuat!`, '🎬');
});

DOM.btnClosePreview.addEventListener('click', function() {
    DOM.scriptPreviewPanel.classList.remove('visible');
});

async function sendChatMessage() {
    const input = DOM.chatInput.value.trim();
    if (!input) return;

    addChatMessage('Kamu', input, 'user');
    DOM.chatInput.value = '';

    DOM.aiStatus.textContent = '● Mengetik...';
    DOM.aiStatus.style.color = 'var(--yellow)';

    try {
        const response = await callGroqAI(
            input,
            'Kamu adalah Rin, asisten AI yang pintar dan ramah untuk membuat manga. Kamu bisa bantu buat script, analisis karakter, dan animasi. Gunakan bahasa Indonesia yang natural. Jawab dengan jelas dan detail.'
        );

        let actionMessage = response;
        let detectedPanels = [];

        const panelRegex = /(?:panel|scene|adegan)\s*(\d+)[:.]\s*(.+?)(?:\s*[-|]\s*(pan-left|pan-right|pan-up|pan-down|zoom-in|zoom-out|bounce|tracking|elastic|pop|static))?/gi;
        let match;
        while ((match = panelRegex.exec(response)) !== null) {
            const num = parseInt(match[1]);
            const text = match[2].trim();
            const anim = match[3] || 'static';
            detectedPanels.push({ text, animType: anim, panelNumber: num });
        }

        if (detectedPanels.length === 0) {
            const lines = response.split('\n').filter(l => l.trim().length > 5);
            lines.forEach((line, i) => {
                const cleanText = line.replace(/^\d+[.:]\s*/, '').trim();
                const anims = ['pan-left', 'zoom-in', 'pan-right', 'tracking', 'bounce', 'elastic'];
                detectedPanels.push({
                    text: cleanText,
                    animType: anims[i % anims.length],
                    panelNumber: i + 1
                });
            });
        }

        if (detectedPanels.length >= 2) {
            showScriptPreview(detectedPanels);
            App.scriptPanels = detectedPanels;
            DOM.scriptText.value = detectedPanels.map(p => p.text).join('\n\n');
            actionMessage += '\n\n📄 Aku sudah buat scriptnya! Cek preview di panel sebelah.';
        }

        const charMatch = response.match(/(?:karakter|tokoh)\s+(?:bernama\s+)?(\w+)/i);
        if (charMatch) {
            const charName = charMatch[1];
            if (!App.characters.includes(charName)) {
                App.characters.push(charName);
                actionMessage += `\n\n✨ Aku catat karakter "${charName}" ya!`;
            }
        }

        addChatMessage('🌸 Rin', actionMessage, 'ai');

    } catch (error) {
        addChatMessage('🌸 Rin', 'Maaf, ada masalah. Coba lagi ya! 🌸', 'ai');
    }

    DOM.aiStatus.textContent = '● Online';
    DOM.aiStatus.style.color = 'var(--green)';
}

DOM.btnChatSend.addEventListener('click', sendChatMessage);
DOM.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// === AI SCRIPT GENERATE ===
DOM.btnAIScriptGen.addEventListener('click', async function() {
    const prompt = DOM.scriptText.value.trim() || DOM.chatInput.value.trim();
    if (!prompt) {
        showToast('Tulis ide atau script dulu', '⚠️');
        return;
    }

    DOM.aiProgress.style.display = 'block';
    DOM.aiProgressFill.style.width = '0%';
    DOM.aiProgressText.textContent = '🌸 Rin sedang membuat script...';
    DOM.aiStatus.textContent = '● Membuat script...';

    try {
        const result = await callGroqAI(
            `Buat script manga dari ide ini:\n${prompt}\n\nBuat cerita yang bagus dengan 5-8 panel. Setiap panel 1-2 kalimat. Format: "Panel 1: [deskripsi] - [animasi]"`,
            'Kamu adalah Rin, asisten AI untuk membuat script manga. Buat cerita dengan 5-8 panel. Setiap panel: "Panel X: deskripsi - animasi". Animasi: pan-left, pan-right, pan-up, pan-down, zoom-in, zoom-out, bounce, tracking, elastic, pop, static.'
        );

        if (result) {
            const panels = [];
            const lines = result.split('\n').filter(l => l.trim());

            for (const line of lines) {
                const clean = line.trim();
                if (clean.length < 3) continue;

                let text = clean;
                let animType = 'static';

                const match = clean.match(/panel\s*\d+[:.]\s*(.+?)(?:\s*[-|]\s*(pan-left|pan-right|pan-up|pan-down|zoom-in|zoom-out|bounce|tracking|elastic|pop|static))?/i);
                if (match) {
                    text = match[1].trim();
                    animType = match[2] || 'static';
                }

                panels.push({ text, animType });
            }

            if (panels.length > 0) {
                showScriptPreview(panels);
                App.scriptPanels = panels;
                DOM.scriptText.value = panels.map(p => p.text).join('\n\n');
                showToast(`✅ Rin membuat ${panels.length} panel!`, '🌸');
                addChatMessage('🌸 Rin', `Aku sudah buat ${panels.length} panel! Cek preview di panel sebelah. Mau aku revisi?`, 'ai');
            } else {
                showToast('Rin: Aku tidak bisa parsing scriptnya, coba tulis ulang ya', '🌸');
            }
        }

    } catch (error) {
        showToast('Error: ' + error.message, '❌');
    }

    DOM.aiProgress.style.display = 'none';
    DOM.aiStatus.textContent = '● Online';
    DOM.scriptPanel.classList.remove('visible');
});

// === PLAYBACK ===
DOM.btnPlay.addEventListener('click', togglePlay);
DOM.btnRewind.addEventListener('click', () => {
    stopPlay();
    App.currentTime = 0;
    renderFrame();
    updatePlayhead();
    updateScrubber();
});

DOM.btnMute.addEventListener('click', function() {
    App.muted = !App.muted;
    this.textContent = App.muted ? '🔇' : '🔊';
    if (App.gainNode) {
        App.gainNode.gain.value = App.muted ? 0 : App.volume;
    }
    if (App.voGainNode) {
        App.voGainNode.gain.value = App.muted ? 0 : App.voVolume;
    }
    if (App.bgmGainNode) {
        App.bgmGainNode.gain.value = App.muted ? 0 : App.bgmVolume;
    }
});

DOM.scrubber.addEventListener('input', function() {
    const wasPlaying = App.playing;
    if (wasPlaying) stopPlay();
    App.currentTime = (parseFloat(this.value) / 100) * App.totalDuration;
    renderFrame();
    updatePlayhead();
    if (wasPlaying) startPlay();
});

function togglePlay() {
    if (App.playing) {
        stopPlay();
    } else {
        if (App.currentTime >= App.totalDuration) App.currentTime = 0;
        startPlay();
    }
}

function startPlay() {
    if (App.playing) return;
    if (App.audioCtx && App.audioCtx.state === 'suspended') App.audioCtx.resume();

    App.playing = true;
    DOM.btnPlay.textContent = '⏸';

    const ac = getAudioCtx();
    App._playStart = ac.currentTime;
    App._playOffset = App.currentTime;

    if (App.voBuffer && !App.muted) {
        const offset = App.voTrimStart + App.currentTime;
        if (offset < App.voTrimEnd) {
            try {
                App.voSource = ac.createBufferSource();
                App.voSource.buffer = App.voBuffer;
                App.voSource.connect(App.voGainNode);
                const safeOffset = Math.max(0, Math.min(offset, App.voBuffer.duration - 0.01));
                App.voSource.start(0, safeOffset);
            } catch (e) {
                console.warn('VO playback error:', e);
            }
        }
    }

    if (!App.muted && App.bgmBuffer) {
        try {
            const offset = App.bgmTrimStart + (App.currentTime % (App.bgmTrimEnd - App.bgmTrimStart));
            App.bgmSource = ac.createBufferSource();
            App.bgmSource.buffer = App.bgmBuffer;
            App.bgmSource.loop = true;
            App.bgmSource.connect(App.bgmGainNode);
            const safeOffset = Math.max(0, Math.min(offset, App.bgmBuffer.duration - 0.01));
            App.bgmSource.start(0, safeOffset);
        } catch (e) {
            console.warn('BGM playback error:', e);
        }
    }

    tickPlay();
}

function stopPlay() {
    App.playing = false;
    DOM.btnPlay.textContent = '▶';

    try {
        if (App.voSource) {
            App.voSource.stop();
            App.voSource = null;
        }
    } catch (e) {}

    try {
        if (App.bgmSource) {
            App.bgmSource.stop();
            App.bgmSource = null;
        }
    } catch (e) {}

    if (App.animFrame) {
        cancelAnimationFrame(App.animFrame);
        App.animFrame = null;
    }
}

function tickPlay() {
    if (!App.playing) return;
    const ac = getAudioCtx();
    const elapsed = ac.currentTime - App._playStart;
    App.currentTime = App._playOffset + elapsed;

    if (App.currentTime >= App.totalDuration) {
        App.currentTime = App.totalDuration;
        stopPlay();
        renderFrame();
        updatePlayhead();
        updateScrubber();
        return;
    }

    renderFrame();
    updatePlayhead();
    updateScrubber();
    App.animFrame = requestAnimationFrame(tickPlay);
}

function updatePlayhead() {
    const zoom = App.timelineZoom || 10;
    DOM.playheadLine.style.left = (App.currentTime * zoom) + 'px';
}

function updateScrubber() {
    DOM.scrubber.value = (App.currentTime / Math.max(App.totalDuration, 1)) * 100;
    DOM.currentTime.textContent = fmtTime(App.currentTime);
    DOM.totalTime.textContent = fmtTime(App.totalDuration);
}

// === RENDER FRAME ===
const ctx = DOM.playerCanvas.getContext('2d');

function getActiveClip(t) {
    return App.clips.find(c => t >= c.start && t < c.end) || null;
}

function renderSingleClip(ctx, W, H, clip) {
    const media = clip.mediaId ? getMedia(clip.mediaId) : null;
    const progress = clip.duration > 0 ? (App.currentTime - clip.start) / clip.duration : 0;
    const adj = Math.min(1, progress * (clip.animSpeed || 1));

    const scale = (clip.scale || 100) / 100;
    const posX = (clip.posX || 0) / 100;
    const posY = (clip.posY || 0) / 100;
    const rotate = (clip.rotate || 0) * Math.PI / 180;
    const opacity = (clip.opacity || 100) / 100;
    const brightness = (clip.brightness || 100) / 100;
    const intensity = (clip.animIntensity || 100) / 100;
    const blur = clip.bgBlur || 0;

    let offsetX = posX * W * 0.5 * adj;
    let offsetY = posY * H * 0.5 * adj;
    let scaleAnim = scale;
    let rotAnim = rotate;
    let opacityAnim = opacity;
    let brightnessVal = brightness;

    switch (clip.animType) {
        case 'pan-left':
            offsetX += -W * 0.3 * adj * intensity;
            break;
        case 'pan-right':
            offsetX += W * 0.3 * adj * intensity;
            break;
        case 'pan-up':
            offsetY += -H * 0.3 * adj * intensity;
            break;
        case 'pan-down':
            offsetY += H * 0.3 * adj * intensity;
            break;
        case 'zoom-in':
            scaleAnim = scale * (0.4 + 0.6 * adj * intensity);
            break;
        case 'zoom-out':
            scaleAnim = scale * (1.6 - 0.6 * adj * intensity);
            break;
        case 'bounce':
            const b = Math.sin(adj * Math.PI * 4) * (1 - adj) * 0.4 * intensity;
            offsetY += -b * H * 0.15;
            break;
        case 'tracking':
            const trackX = Math.sin(adj * Math.PI * 1.5) * 0.25 * intensity;
            const trackY = Math.cos(adj * Math.PI * 1.2) * 0.15 * intensity;
            offsetX += trackX * W * 0.3;
            offsetY += trackY * H * 0.2;
            scaleAnim = scale * (0.9 + 0.1 * Math.sin(adj * Math.PI * 2) * intensity);
            break;
        case 'elastic':
            const elastic = Math.sin(adj * Math.PI * 3) * (1 - adj) * 0.5 * intensity;
            offsetX += elastic * W * 0.1;
            scaleAnim = scale * (1 + Math.sin(adj * Math.PI * 5) * 0.1 * intensity);
            break;
        case 'pop':
            const popScale = 1 + Math.sin(adj * Math.PI * 2) * 0.3 * intensity * (1 - adj);
            scaleAnim = scale * popScale;
            offsetY += -Math.sin(adj * Math.PI * 2) * 0.1 * H * intensity * (1 - adj);
            break;
        default:
            break;
    }

    if (media) {
        const el = media.el;
        const ar = el.width ? el.width / el.height : 16 / 9;
        const canAr = W / H;
        let sw, sh, sx, sy;
        if (ar > canAr) { sh = H; sw = H * ar; sy = 0; sx = (W - sw) / 2; } else { sw = W; sh = W / ar; sx = 0; sy = (H - sh) / 2; }

        if (blur > 0) {
            ctx.save();
            ctx.filter = `blur(${blur}px)`;
            ctx.globalAlpha = 0.6;
            ctx.drawImage(el, sx - W / 2, sy - H / 2, sw, sh);
            ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = opacityAnim;
        ctx.filter = `brightness(${brightnessVal})`;
        ctx.translate(W / 2 + offsetX, H / 2 + offsetY);
        ctx.rotate(rotAnim);
        ctx.scale(scaleAnim, scaleAnim);
        ctx.drawImage(el, sx - W / 2, sy - H / 2, sw, sh);
        ctx.restore();
    } else {
        ctx.save();
        ctx.globalAlpha = opacityAnim;
        ctx.translate(W / 2 + offsetX, H / 2 + offsetY);
        ctx.fillStyle = '#111125';
        ctx.fillRect(-W / 2, -H / 2, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.font = `bold ${W*0.035}px var(--font)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${clip.panelNumber || App.clips.indexOf(clip)+1}`, 0, 0);
        ctx.restore();
    }
}

// TRANSISI FUNCTIONS
function applyTransition(ctx, W, H, fromClip, toClip, trans) {
    const p = trans.progress;

    switch (trans.type) {
        case 'fade':
            ctx.globalAlpha = p;
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'slide-left':
            ctx.translate(-(1 - p) * W, 0);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'slide-right':
            ctx.translate((1 - p) * W, 0);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'slide-up':
            ctx.translate(0, -(1 - p) * H);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'slide-down':
            ctx.translate(0, (1 - p) * H);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'zoom-in':
            const zScale = 0.5 + p * 0.5;
            ctx.translate(W / 2, H / 2);
            ctx.scale(zScale, zScale);
            ctx.translate(-W / 2, -H / 2);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'zoom-out':
            const zScale2 = 1.5 - p * 0.5;
            ctx.translate(W / 2, H / 2);
            ctx.scale(zScale2, zScale2);
            ctx.translate(-W / 2, -H / 2);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'wipe-left':
            const wipeX = p * W;
            ctx.beginPath();
            ctx.rect(0, 0, wipeX, H);
            ctx.clip();
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'wipe-right':
            const wipeX2 = (1 - p) * W;
            ctx.beginPath();
            ctx.rect(wipeX2, 0, W - wipeX2, H);
            ctx.clip();
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'cross':
            ctx.globalAlpha = Math.sin(p * Math.PI / 2);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'flash':
            const flash = Math.sin(p * Math.PI) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255,255,255,${flash * 0.3})`;
            ctx.fillRect(0, 0, W, H);
            if (p < 0.5) renderSingleClip(ctx, W, H, fromClip);
            else renderSingleClip(ctx, W, H, toClip);
            break;
        case 'bounce':
            const bounce = Math.sin(p * Math.PI * 3) * (1 - p) * 40;
            ctx.translate(0, bounce);
            ctx.globalAlpha = 1;
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'rotate':
            const rot = p * Math.PI * 0.8;
            ctx.translate(W / 2, H / 2);
            ctx.rotate(rot);
            ctx.translate(-W / 2, -H / 2);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'elastic':
            const elasticOffset = Math.sin(p * Math.PI * 4) * (1 - p) * 30;
            ctx.translate(elasticOffset, 0);
            const elasticScale = 1 + Math.sin(p * Math.PI * 5) * 0.2 * (1 - p);
            ctx.scale(elasticScale, elasticScale);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'pop':
            const popScale = 1 + Math.sin(p * Math.PI * 2) * 0.3 * (1 - p);
            ctx.translate(W / 2, H / 2);
            ctx.scale(popScale, popScale);
            ctx.translate(-W / 2, -H / 2);
            ctx.globalAlpha = Math.min(1, p * 2);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'blur':
            const blurAmount = (1 - p) * 10;
            ctx.filter = `blur(${blurAmount}px)`;
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'shutter':
            const shutterP = p < 0.5 ? p * 2 : (1 - p) * 2;
            const shutterH = shutterP * H;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, (H - shutterH) / 2, W, shutterH);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'ripple':
            const ripple = Math.sin(p * Math.PI * 4) * 5 * (1 - p);
            ctx.translate(ripple, ripple * 0.5);
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'glitch':
            if (p < 0.5) {
                const glitchX = Math.random() * 20 - 10;
                ctx.translate(glitchX, 0);
            }
            renderSingleClip(ctx, W, H, toClip);
            break;
        case 'pixelate':
            const pixelSize = Math.max(2, (1 - p) * 20);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = W / pixelSize;
            tempCanvas.height = H / pixelSize;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.drawImage(DOM.playerCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tempCanvas, 0, 0, W, H);
            break;
        case 'vortex':
            const vortex = p * Math.PI * 2;
            ctx.translate(W / 2, H / 2);
            ctx.rotate(vortex * 0.5);
            ctx.translate(-W / 2, -H / 2);
            const vScale = 1 - p * 0.2;
            ctx.scale(vScale, vScale);
            renderSingleClip(ctx, W, H, toClip);
            break;
        default:
            ctx.globalAlpha = p;
            renderSingleClip(ctx, W, H, toClip);
    }
}

function renderFrame() {
    const W = DOM.playerCanvas.width;
    const H = DOM.playerCanvas.height;
    const t = App.currentTime;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#08080e';
    ctx.fillRect(0, 0, W, H);

    // Check for transition
    let trans = null;
    let currentClip = null;
    let nextClip = null;

    for (let i = 0; i < App.clips.length - 1; i++) {
        if (t >= App.clips[i].end && t < App.clips[i + 1].start) {
            currentClip = App.clips[i];
            nextClip = App.clips[i + 1];
            const gapStart = currentClip.end;
            const gapEnd = nextClip.start;
            if (currentClip.transition && currentClip.transition !== 'none') {
                const progress = (t - gapStart) / (gapEnd - gapStart);
                trans = { type: currentClip.transition, progress: Math.min(1, Math.max(0, progress)), dur: currentClip.transitionDur || 0.6 };
            }
            break;
        }
    }

    if (trans && currentClip && nextClip) {
        ctx.save();
        renderSingleClip(ctx, W, H, currentClip);
        ctx.restore();
        ctx.save();
        applyTransition(ctx, W, H, currentClip, nextClip, trans);
        ctx.restore();
        DOM.subtitleDisplay.textContent = `🔄 ${trans.type.toUpperCase()} ${Math.round(trans.progress * 100)}%`;
        return;
    }

    const clip = getActiveClip(t);
    if (!clip) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.font = `bold ${W*0.032}px var(--font)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📖 MD8 Studio ✦ Rin AI', W / 2, H / 2 - 8);
        ctx.font = `${W*0.016}px var(--font)`;
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillText('Upload gambar atau tambah clip', W / 2, H / 2 + 20);
        DOM.subtitleDisplay.textContent = '';
        return;
    }

    renderSingleClip(ctx, W, H, clip);

    let displayText = `#${clip.panelNumber || App.clips.indexOf(clip)+1}`;
    if (clip.text && !clip.text.includes('buat narasi') && clip.text.length > 0) {
        const cleanText = clip.text.replace(/panel\s*\d+[:.]\s*/i, '').trim();
        displayText += `: ${cleanText.substring(0, 50)}${cleanText.length > 50 ? '...' : ''}`;
    }
    if (clip.character) {
        displayText += ` ✦ ${clip.character}`;
    }
    if (clip.voTag) {
        displayText += ` 🏷️${clip.voTag}`;
    }
    const fs = Math.max(13, Math.min(20, W * 0.028));
    DOM.subtitleDisplay.style.fontSize = fs + 'px';
    DOM.subtitleDisplay.textContent = displayText;
}

// === EXPORT ===
function getResolution(res) {
    const aspect = App.aspectRatio;
    const base = RATIOS[aspect] || RATIOS['16:9'];
    const ratio = base.w / base.h;

    switch (res) {
        case '4K': return { w: 3840, h: Math.round(3840 / ratio) };
        case '2K': return { w: 2560, h: Math.round(2560 / ratio) };
        case '1080p': return { w: 1920, h: Math.round(1920 / ratio) };
        case '720p': return { w: 1280, h: Math.round(1280 / ratio) };
        case '480p': return { w: 854, h: Math.round(854 / ratio) };
        default: return { w: 1920, h: Math.round(1920 / ratio) };
    }
}

DOM.resGrid.addEventListener('click', function(e) {
    const item = e.target.closest('.res-item');
    if (!item) return;
    DOM.resGrid.querySelectorAll('.res-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    App.exportResolution = item.dataset.res;
});

DOM.exportBitrate.addEventListener('input', function() {
    App.exportBitrate = parseFloat(this.value);
    DOM.exportBitrateVal.textContent = this.value + ' Mbps';
});

DOM.btnStartExport.addEventListener('click', function() {
    if (App.clips.length === 0) {
        showToast('Tidak ada clip', '⚠️');
        return;
    }
    if (App.isExporting) return;

    DOM.exportProgressBar.style.width = '0%';
    DOM.exportStatus.textContent = 'Menyiapkan...';
    DOM.exportPercent.textContent = '0%';
    DOM.exportDetail.textContent = 'Frame 0 / 0';
    DOM.exportEstimate.textContent = '⏱️ Estimasi waktu: --';

    App.isExporting = true;

    const canvas = DOM.playerCanvas;
    const previewCanvas = DOM.exportPreview;
    const res = getResolution(App.exportResolution);
    previewCanvas.width = res.w;
    previewCanvas.height = res.h;
    const pctx = previewCanvas.getContext('2d');

    const stream = canvas.captureStream(30);

    const exportCtx = new(window.AudioContext || window.webkitAudioContext)();
    const dest = exportCtx.createMediaStreamDestination();
    const exportGain = exportCtx.createGain();
    exportGain.gain.value = App.volume;
    exportGain.connect(dest);

    const voGain = exportCtx.createGain();
    voGain.gain.value = App.voVolume;
    voGain.connect(exportGain);

    const bgmGain = exportCtx.createGain();
    bgmGain.gain.value = App.bgmVolume;
    bgmGain.connect(exportGain);

    let voSource = null;
    let bgmSource = null;

    if (App.voBuffer) {
        voSource = exportCtx.createBufferSource();
        voSource.buffer = App.voBuffer;
        const offset = App.voTrimStart;
        const duration = App.voTrimEnd - App.voTrimStart;
        voSource.connect(voGain);
        voSource.start(0, offset, duration);
    }

    if (App.bgmBuffer) {
        bgmSource = exportCtx.createBufferSource();
        bgmSource.buffer = App.bgmBuffer;
        const offset = App.bgmTrimStart;
        const duration = App.bgmTrimEnd - App.bgmTrimStart;
        bgmSource.loop = true;
        bgmSource.connect(bgmGain);
        bgmSource.start(0, offset);
    }

    const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
    ]);

    const bitrate = Math.round(App.exportBitrate * 1000000);
    const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: bitrate,
        audioBitsPerSecond: 128000
    });

    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    let totalFrames = Math.ceil(App.totalDuration * 30);
    let frameCount = 0;
    let startTime = Date.now();
    let stopped = false;

    recorder.onstop = function() {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const resLabel = App.exportResolution;
        a.download = `${DOM.projectName.value || 'video'}_${resLabel}_${App.aspectRatio.replace(':', 'x')}.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        try {
            if (voSource) voSource.stop();
            if (bgmSource) bgmSource.stop();
            exportCtx.close();
        } catch (e) {}
        App.isExporting = false;
        DOM.exportModal.classList.remove('visible');
        showToast('✅ Video berhasil diekspor!', '✅');
    };

    DOM.btnCancelExport.addEventListener('click', function() {
        stopped = true;
        try { recorder.stop(); } catch (e) {}
        App.isExporting = false;
        DOM.exportModal.classList.remove('visible');
        showToast('Export dibatalkan', '⏹️');
    });

    function renderExport() {
        if (stopped) return;

        const progress = frameCount / totalFrames;
        const percent = Math.round(progress * 100);

        DOM.exportProgressBar.style.width = percent + '%';
        DOM.exportPercent.textContent = percent + '%';
        DOM.exportStatus.textContent = `Mengekspor...`;

        const elapsed = (Date.now() - startTime) / 1000;
        const estimatedTotal = elapsed / (frameCount || 1) * totalFrames;
        const remaining = Math.max(0, estimatedTotal - elapsed);
        DOM.exportEstimate.textContent = `⏱️ Estimasi waktu: ${Math.ceil(remaining)}s tersisa`;

        DOM.exportDetail.textContent = `Frame ${frameCount} / ${totalFrames}`;

        const t = frameCount / 30;
        App.currentTime = Math.min(t, App.totalDuration);
        renderFrame();
        pctx.clearRect(0, 0, res.w, res.h);
        pctx.drawImage(DOM.playerCanvas, 0, 0, res.w, res.h);

        frameCount++;

        if (frameCount < totalFrames && !stopped) {
            setTimeout(renderExport, 1000 / 30);
        } else if (!stopped) {
            DOM.exportStatus.textContent = 'Selesai!';
            DOM.exportPercent.textContent = '100%';
            DOM.exportProgressBar.style.width = '100%';
            setTimeout(() => {
                try { recorder.stop(); } catch (e) {}
            }, 500);
        }
    }

    recorder.start(1000);
    setTimeout(renderExport, 500);
});

DOM.btnExport.addEventListener('click', function() {
    DOM.exportModal.classList.add('visible');
    DOM.exportProgressBar.style.width = '0%';
    DOM.exportStatus.textContent = 'Siap ekspor...';
    DOM.exportPercent.textContent = '0%';
    DOM.exportDetail.textContent = 'Pilih resolusi';
    DOM.exportEstimate.textContent = '⏱️ Pilih resolusi dan bitrate';
});

// === SAVE PROJECT ===
DOM.btnSave.addEventListener('click', function() {
    const data = {
        name: DOM.projectName.value,
        ratio: App.aspectRatio,
        clips: App.clips.map(c => ({ ...c, mediaId: c.mediaId, panelNumber: c.panelNumber, character: c.character || '', voTag: c.voTag || '', transition: c.transition || 'none' })),
        media: App.mediaItems.map(m => ({ id: m.id, name: m.name, url: m.url })),
        voTrim: { start: App.voTrimStart, end: App.voTrimEnd },
        bgmTrim: { start: App.bgmTrimStart, end: App.bgmTrimEnd },
        voVolume: App.voVolume,
        bgmVolume: App.bgmVolume,
        voTag: App.voTag,
        characters: App.characters,
        timestamp: Date.now(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${DOM.projectName.value || 'project'}_${new Date().toISOString().slice(0,10)}.md8`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    showToast('✅ Project disimpan!', '💾');
});

// === KEYBOARD ===
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Enter' && e.target.id === 'chatInput') {
            e.preventDefault();
            sendChatMessage();
        }
        return;
    }
    switch (e.key) {
        case ' ':
            e.preventDefault();
            togglePlay();
            break;
        case 'ArrowRight':
            App.currentTime = Math.min(App.totalDuration, App.currentTime + 0.5);
            renderFrame();
            updatePlayhead();
            updateScrubber();
            break;
        case 'ArrowLeft':
            App.currentTime = Math.max(0, App.currentTime - 0.5);
            renderFrame();
            updatePlayhead();
            updateScrubber();
            break;
        case 'm':
        case 'M':
            DOM.btnMute.click();
            break;
        case 'Delete':
            deleteClip();
            break;
        case 's':
        case 'S':
            if (e.ctrlKey) { e.preventDefault(); DOM.btnSave.click(); }
            break;
        case 'e':
        case 'E':
            if (e.ctrlKey) { e.preventDefault(); DOM.btnExport.click(); }
            break;
    }
});

// === LOAD PROJECT ===
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    for (const file of files) {
        if (file.name.endsWith('.md8')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (data.name) DOM.projectName.value = data.name;
                    if (data.ratio) applyRatio(data.ratio);
                    if (data.clips) {
                        App.clips = data.clips.map(c => ({ ...c, mediaId: c.mediaId || null, panelNumber: c.panelNumber || 0, character: c.character || '', voTag: c.voTag || '', transition: c.transition || 'none' }));
                        App.totalDuration = App.clips.reduce((sum, c) => sum + c.duration, 0) || 10;
                        App.selectedIdx = App.clips.length > 0 ? 0 : -1;
                    }
                    if (data.media) {
                        App.mediaItems = data.media.map(m => {
                            const el = document.createElement('img');
                            el.src = m.url;
                            return { ...m, el: el };
                        });
                        renderMedia();
                    }
                    if (data.voTrim) {
                        App.voTrimStart = data.voTrim.start || 0;
                        App.voTrimEnd = data.voTrim.end || 0;
                    }
                    if (data.bgmTrim) {
                        App.bgmTrimStart = data.bgmTrim.start || 0;
                        App.bgmTrimEnd = data.bgmTrim.end || 0;
                    }
                    if (data.voVolume) App.voVolume = data.voVolume;
                    if (data.bgmVolume) App.bgmVolume = data.bgmVolume;
                    if (data.voTag) App.voTag = data.voTag;
                    if (data.characters) App.characters = data.characters;

                    DOM.voVolume.value = App.voVolume * 100;
                    DOM.voVolumeVal.textContent = (App.voVolume * 100) + '%';
                    DOM.bgmVolume.value = App.bgmVolume * 100;
                    DOM.bgmVolumeVal.textContent = (App.bgmVolume * 100) + '%';

                    renderTimeline();
                    renderFrame();
                    updateScrubber();
                    showToast(`✅ Project "${data.name}" dimuat!`, '📂');
                    addChatMessage('🌸 Rin', `Project "${data.name}" berhasil dimuat! Aku siap bantu lagi. ✨`, 'ai');
                } catch (err) {
                    showToast('Gagal load project: ' + err.message, '❌');
                }
            };
            reader.readAsText(file);
            showToast('📂 Memuat project...', '⏳');
            return;
        }
    }
});

// === INIT ===
function init() {
    App.isMobile = window.innerWidth <= 768;

    window.addEventListener('resize', () => {
        App.isMobile = window.innerWidth <= 768;
    });

    App.clips = [];
    App.totalDuration = 10;
    App.selectedIdx = -1;
    App.voTrimStart = 0;
    App.voTrimEnd = 0;
    App.bgmTrimStart = 0;
    App.bgmTrimEnd = 0;
    App.mediaItems = [];
    App.characters = [];
    App.scriptPanels = [];
    App.voTag = '';
    App.voWaveformData = null;

    renderMedia();
    renderTimeline();
    renderFrame();
    updateScrubber();
    applyRatio('16:9');

    DOM.aiStatus.textContent = '● Online';
    DOM.aiStatus.style.color = 'var(--green)';

    console.log('📖 MD8 Studio Pro - Full Version');
    console.log('🎬 Shortcuts: Space=Play, ←→=Seek, M=Mute, Delete=Delete');
    console.log('🖱️ Scroll mouse di timeline untuk zoom in/out');
    console.log('🔄 20+ Transisi halus');

    setTimeout(() => {
        addChatMessage('🌸 Rin',
            'Halo! Aku Rin, asisten AI-mu. 🎀\n\nAku bisa bantu:\n📝 Buat script manga dengan panel terstruktur\n🎬 Analisis karakter\n🖼️ Edit gambar & background (blur, scale, opacity, brightness)\n🎵 Tag & sync audio dengan scene\n🔄 20+ Transisi halus antar panel\n🖱️ Scroll mouse di timeline untuk zoom\n📤 Export dengan pilihan resolusi 4K, 2K, 1080p, 720p, 480p\n\nCeritakan ide mangamu! ✨',
            'ai');
    }, 500);

    showToast('🚀 MD8 Studio Pro siap!', '🎬', 3000);
}

// START
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
