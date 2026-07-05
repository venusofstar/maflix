const CONFIG = {
    mainUrl: "https://m.prectv50.sbs",
    swKey: "4F5A9C3D9A86FA54EACEDDD635185/64f9535b-bd2e-4483-b234-89060b1e631c",
    headers: { "User-Agent": "Dart/3.7 (dart:io)", "Referer": "https://twitter.com/" }
};

// Page setup
const categories = [
    { name: "Live TV", path: "/api/channel/by/filtres/0/0/PAGE/" },
    { name: "Latest Movies", path: "/api/movie/by/filtres/0/created/PAGE/" },
    { name: "Latest Series", path: "/api/serie/by/filtres/0/created/PAGE/" },
    { name: "Action", path: "/api/movie/by/filtres/1/created/PAGE/" },
    { name: "Comedy", path: "/api/movie/by/filtres/3/created/PAGE/" },
    { name: "Drama", path: "/api/movie/by/filtres/2/created/PAGE/" }
];

// DOM Elements
const catContainer = document.getElementById("categories");
const contentGrid = document.getElementById("contentGrid");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("playerModal");
const closeBtn = document.querySelector(".close-btn");
const video = document.getElementById("videoPlayer");
const playerInfo = document.getElementById("playerInfo");

// Init
window.addEventListener("load", () => {
    renderCategories();
    loadContent(categories[0], 0);
    setupSearch();
    setupModal();
    setupRemoteSupport();
});

// Render category buttons
function renderCategories() {
    categories.forEach((cat, idx) => {
        const btn = document.createElement("button");
        btn.className = "cat-btn";
        btn.textContent = cat.name;
        btn.onclick = () => {
            document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            loadContent(cat, 0);
        };
        catContainer.appendChild(btn);
    });
    catContainer.firstChild.classList.add("active");
}

// Fetch & render content
async function loadContent(category, page = 0) {
    contentGrid.innerHTML = "<p>Loading...</p>";
    try {
        const res = await fetch(`${CONFIG.mainUrl}${category.path.replace("PAGE", page)}${CONFIG.swKey}/`, { headers: CONFIG.headers });
        if (!res.ok) throw new Error("API unavailable");
        const data = await res.json();
        renderItems(Array.isArray(data) ? data : []);
    } catch (err) {
        contentGrid.innerHTML = `<p style="color:red;">Failed to load: ${err.message}</p>`;
    }
}

// Render items into grid
function renderItems(items) {
    contentGrid.innerHTML = "";
    if (!items.length) { contentGrid.innerHTML = "<p>No results found</p>"; return; }
    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.tabIndex = 0;
        card.innerHTML = `
            <img src="${item.image || 'placeholder.jpg'}" alt="${item.title}">
            <h3>${item.title || "Untitled"}</h3>
        `;
        card.onclick = () => openPlayer(item);
        card.onkeydown = (e) => e.key === "Enter" && openPlayer(item);
        contentGrid.appendChild(card);
    });
}

// Search function
function setupSearch() {
    let timer;
    searchInput.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
            const q = searchInput.value.trim();
            if (!q) return loadContent(categories[0], 0);
            try {
                const res = await fetch(`${CONFIG.mainUrl}/api/search/${encodeURIComponent(q)}/${CONFIG.swKey}/`, { headers: CONFIG.headers });
                const data = await res.json();
                const results = [...(data.channels || []), ...(data.posters || [])];
                renderItems(results);
            } catch (err) {
                contentGrid.innerHTML = `<p style="color:red;">Search error</p>`;
            }
        }, 400);
    });
}

// Open player modal
function openPlayer(item) {
    modal.style.display = "block";
    playerInfo.innerHTML = `<h3>${item.title}</h3><p>${item.description || ""}</p>`;
    loadStream(item.sources || [{ url: item.url, type: "m3u8" }]);
}

// Load stream with HLS/Shaka
function loadStream(sources) {
    video.src = "";
    video.innerHTML = "";
    if (window.hls) hls.destroy();
    if (window.shakaPlayer) shakaPlayer.destroy();

    const source = sources[0];
    if (!source) { playerInfo.innerHTML += "<br>No stream available"; return; }

    if (source.url.includes(".m3u8")) {
        if (Hls.isSupported()) {
            const hls = new Hls({ xhrSetup: xhr => { xhr.setRequestHeader("Referer", CONFIG.headers.Referer); } });
            hls.loadSource(source.url);
            hls.attachMedia(video);
            window.hls = hls;
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source.url;
        }
    } else if (source.url.includes(".mpd")) {
        const player = new shaka.Player(video);
        player.load(source.url);
        window.shakaPlayer = player;
    } else {
        video.src = source.url;
    }
    video.play().catch(() => {});
}

// Modal controls
function setupModal() {
    closeBtn.onclick = () => { modal.style.display = "none"; video.pause(); };
    window.onclick = e => { if (e.target === modal) { modal.style.display = "none"; video.pause(); } };
}

// TV Remote navigation
function setupRemoteSupport() {
    document.addEventListener("keydown", e => {
        const focusable = Array.from(document.querySelectorAll(".cat-btn, .item-card, input"));
        const index = focusable.indexOf(document.activeElement);
        if (index === -1) return;
        switch(e.key) {
            case "ArrowRight": focusable[index + 1]?.focus(); break;
            case "ArrowLeft": focusable[index - 1]?.focus(); break;
            case "ArrowDown": focusable[Math.min(index + 4, focusable.length - 1)]?.focus(); break;
            case "ArrowUp": focusable[Math.max(index - 4, 0)]?.focus(); break;
        }
    });
}
