import { Innertube, UniversalCache } from 'youtubei.js';

let youtube = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsList = document.getElementById('resultsList');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const trackThumbnail = document.getElementById('trackThumbnail');
const audioElement = document.getElementById('audioElement');
const playBtn = document.getElementById('playBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

// Initialize InnerTube for Browser usage
async function initInnertube() {
    try {
        youtube = await Innertube.create({ 
            cache: new UniversalCache(true),
            lang: 'en',
            location: 'US'
        });
        console.log("InnerTube initialized successfully!");
    } catch (error) {
        console.error("Failed to initialize InnerTube:", error);
    }
}

initInnertube();

// Search functionality
searchBtn.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (!query || !youtube) return;

    resultsList.innerHTML = '<li>Searching...</li>';
    
    try {
        const searchResults = await youtube.music.search(query, { type: 'song' });
        resultsList.innerHTML = '';

        searchResults.contents.forEach(song => {
            if (!song.id) return;
            
            const li = document.createElement('li');
            li.textContent = `${song.title} — ${song.artist?.name || 'Unknown Artist'}`;
            li.addEventListener('click', () => loadTrack(song.id, song.title, song.artist?.name, song.thumbnail));
            resultsList.appendChild(li);
        });
    } catch (err) {
        console.error("Search error:", err);
        resultsList.innerHTML = '<li>Error loading search results.</li>';
    }
});

// Load and Play selected track via InnerTube payload
async function loadTrack(videoId, title, artist, thumbnails) {
    trackTitle.textContent = title;
    trackArtist.textContent = artist || 'Unknown Artist';
    if (thumbnails && thumbnails.length > 0) {
        trackThumbnail.src = thumbnails[thumbnails.length - 1].url;
    }

    try {
        trackTitle.textContent = "Loading stream...";
        
        const info = await youtube.getInfo(videoId);
        const format = info.chooseFormat({ type: 'audio', quality: 'best' });
        const streamingUrl = format.decipher(youtube.session.player);

        audioElement.src = streamingUrl;
        audioElement.play();
        
        playBtn.disabled = false;
        playBtn.textContent = 'Pause';
        trackTitle.textContent = title;
    } catch (error) {
        console.error("Stream loading failed:", error);
        trackTitle.textContent = "Playback Error";
    }
}

// Play/Pause button logic
playBtn.addEventListener('click', () => {
    if (audioElement.paused) {
        audioElement.play();
        playBtn.textContent = 'Pause';
    } else {
        audioElement.pause();
        playBtn.textContent = 'Play';
    }
});

// Audio progress updater
audioElement.addEventListener('timeupdate', () => {
    if (audioElement.duration) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressBar.value = progress;
        currentTimeEl.textContent = formatTime(audioElement.currentTime);
        durationEl.textContent = formatTime(audioElement.duration);
    }
});

progressBar.addEventListener('input', () => {
    if (audioElement.duration) {
        audioElement.currentTime = (progressBar.value / 100) * audioElement.duration;
    }
});

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}
