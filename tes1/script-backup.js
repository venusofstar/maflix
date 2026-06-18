// TMDB API CONFIGURATION
const TMDB_API_KEY = "b5632a62ba8688ec27b39712c1d5cfcc";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/multi";
const TMDB_DISCOVER_MOVIE = "https://api.themoviedb.org/3/discover/movie";
const TMDB_DISCOVER_TV = "https://api.themoviedb.org/3/discover/tv";
const TMDB_TRENDING_URL = "https://api.themoviedb.org/3/trending/all/week";
const TMDB_POPULAR_MOVIE = "https://api.themoviedb.org/3/movie/popular";
const TMDB_POPULAR_TV = "https://api.themoviedb.org/3/tv/popular";

let currentItem = null;
let currentMovieID = "";
let hideControlsTimer;
const CONTROLS_HIDE_DELAY = 10000;

// DOM ELEMENTS
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const playerModal = document.getElementById("playerModal");
const infoPage = document.getElementById("infoPage");
const topControls = document.getElementById("topControls");
const searchSection = document.getElementById("searchSection");
const homeContent = document.getElementById("homeContent");
const moviesSection = document.getElementById("moviesSection");
const seriesSection = document.getElementById("seriesSection");
const continueSection = document.getElementById("continueSection");
const searchInput = document.getElementById("movieSearchInput");
const searchBtn = document.getElementById("searchBtn");

// --- NAVIGATION ---
document.getElementById("infoBackBtn").addEventListener("click", () => {
  infoPage.style.display = "none";
  document.body.style.overflow = "auto";
  setFocus(document.querySelector(".card"));
});

document.getElementById("backPlayer").addEventListener("click", () => {
  if (document.fullscreenElement) document.exitFullscreen();
  playerModal.style.display = "none";
  document.getElementById("videoFrame").src = "";
  document.body.style.overflow = "auto";
  infoPage.style.display = "block";
  setFocus(document.querySelector(".infoPlayBtn, .episodeCard"));
});

// --- SEARCH ---
searchBtn.addEventListener("click", performSearch);
searchInput.addEventListener("keypress", e => e.key === "Enter" && (performSearch(), e.preventDefault()));

async function performSearch() {
  const query = searchInput.value.trim();
  if (!query) return;
  hideAllSections();
  searchSection.style.display = "block";
  const grid = document.getElementById("searchGrid");
  grid.innerHTML = `<div class="loading">Searching...</div>`;
  
  try {
    const res = await fetch(`${TMDB_SEARCH_URL}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);
    const data = await res.json();
    grid.innerHTML = "";
    
    if (!data.results || data.results.length === 0) { 
      grid.innerHTML = `<div class="loading">No results found</div>`; 
      return; 
    }
    
    data.results.forEach(item => {
      if(item.media_type === "movie" || item.media_type === "tv") {
        grid.appendChild(createCard(item));
      }
    });
    setTimeout(() => setFocus(grid.querySelector(".card")), 200);
  } catch (err) { 
    console.error("Search error:", err);
    grid.innerHTML = `<div class="loading">Search failed</div>`; 
  }
}

// --- SIDEBAR ---
function openSidebar() { 
  sidebar.classList.add("active"); 
  overlay.classList.add("active"); 
  document.body.style.overflow = "hidden"; 
  setTimeout(() => setFocus(document.querySelector(".sidebarLinks a")), 100); 
}
function closeSidebar() { 
  sidebar.classList.remove("active"); 
  overlay.classList.remove("active"); 
  document.body.style.overflow = "auto"; 
  setFocus(document.getElementById("menuBtn")); 
}
document.getElementById("menuBtn").addEventListener("click", openSidebar);
document.getElementById("closeMenu").addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);

function hideAllSections() {
  homeContent.style.display = "none";
  searchSection.style.display = "none";
  moviesSection.style.display = "none";
  seriesSection.style.display = "none";
  continueSection.style.display = "none";
}

function loadCategory(category) {
  closeSidebar(); 
  searchInput.value = ""; 
  hideAllSections();
  switch(category) {
    case "home": 
      homeContent.style.display = "block"; 
      loadContinueWatching(); 
      loadTrending(); 
      loadPopularMovies(); 
      loadPopularSeries(); 
      loadGenreMovies(28, "actionGrid"); 
      loadGenreMovies(27, "horrorGrid"); 
      loadGenreMovies(18, "dramaGrid"); 
      loadGenreMovies(35, "comedyGrid"); 
      loadAnime(); 
      break;
    case "movies": 
      moviesSection.style.display = "block"; 
      loadAllMovies(); 
      break;
    case "series": 
      seriesSection.style.display = "block"; 
      loadAllSeries(); 
      break;
    case "anime-tag": 
      searchInput.value = "anime"; 
      performSearch(); 
      break;
    case "drama-tag": 
      searchInput.value = "philippine drama"; 
      performSearch(); 
      break;
    case "tv-channel": 
      alert("TV Channels coming soon!"); 
      break;
    case "sports": 
      searchInput.value = "sports"; 
      performSearch(); 
      break;
    case "vivamax": 
      searchInput.value = "vivamax"; 
      performSearch(); 
      break;
    case "request": 
      alert("Send request via message"); 
      break;
  }
}

function scrollRow(rowId, direction) { 
  const row = document.getElementById(rowId); 
  if(row) row.scrollBy({ left: direction * (window.innerWidth < 768 ? 360 : 850), behavior: "smooth" }); 
}

// --- CREATE CARD ---
function createCard(item) {
  const card = document.createElement("div");
  card.className = "card"; 
  card.tabIndex = 0; 
  card.dataset.id = item.id;
  card.dataset.type = item.media_type || (item.first_air_date ? "tv" : "movie");
  const poster = item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : "https://via.placeholder.com/300x450?text=No+Poster";
  card.innerHTML = `<img src="${poster}" alt="${item.title || item.name}" loading="lazy"><p>${item.title || item.name}</p>`;
  card.addEventListener("click", () => openInfoPage(item));
  card.addEventListener("keydown", e => (e.key === "Enter" || e.key === "OK") && openInfoPage(item));
  return card;
}

// --- INFO PAGE ---
async function openInfoPage(item) {
  currentItem = item;
  document.getElementById("infoContent").innerHTML = `<div class="loading">Loading details...</div>`;
  infoPage.style.display = "block";
  document.body.style.overflow = "auto";

  try {
    const type = item.media_type || (item.first_air_date ? "tv" : "movie");
    const detailsRes = await fetch(`https://api.themoviedb.org/3/${type}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=seasons`);
    const details = await detailsRes.json();

    let html = `
      <div class="infoPoster">
        <img src="${details.poster_path ? TMDB_IMAGE_BASE + details.poster_path : "https://via.placeholder.com/300x450?text=No+Poster"}" alt="${details.title || details.name}">
      </div>
      <div class="infoDetails">
        <h1 class="infoTitle">${details.title || details.name}</h1>
        <div class="infoMeta">
          <span>📅 ${details.release_date || details.first_air_date || "Unknown"}</span>
          <span>⭐ ${details.vote_average ? details.vote_average.toFixed(1) : "0.0"}/10</span>
          <span>⏱️ ${details.runtime ? details.runtime + " min" : details.number_of_seasons ? details.number_of_seasons + " Seasons" : "Unknown"}</span>
        </div>
        <p class="infoOverview">${details.overview || "No description available."}</p>
    `;

    if(type === "movie") {
      html += `<button class="infoPlayBtn" id="infoPlayBtn" tabindex="0">▶ Play Movie</button>`;
    } else {
      html += `<h3 style="margin:25px 0 15px; font-size:22px;">Episodes</h3>`;
      if(details.seasons && details.seasons.length > 0) {
        html += `<div class="seasonSelector" id="seasonSelector">`;
        details.seasons.filter(s => s.season_number > 0).forEach(season => {
          html += `<button class="seasonBtn ${season.season_number === 1 ? "active" : ""}" data-season="${season.season_number}" tabindex="0">Season ${season.season_number}</button>`;
        });
        html += `</div><div class="episodesGrid" id="episodesContainer"></div>`;
      } else {
        html += `<p>No seasons found</p>`;
      }
    }
    html += `</div>`;
    document.getElementById("infoContent").innerHTML = html;

    if(type === "movie") {
      document.getElementById("infoPlayBtn").addEventListener("click", () => { 
        playMovie(details.id); 
        saveContinueWatching({id:details.id, title:details.title, poster_path:details.poster_path, media_type:"movie"}); 
      });
      setTimeout(() => setFocus(document.getElementById("infoPlayBtn")), 200);
    } else {
      loadEpisodes(details.id, 1);
      document.querySelectorAll(".seasonBtn").forEach(btn => btn.addEventListener("click", () => {
        document.querySelectorAll(".seasonBtn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadEpisodes(details.id, parseInt(btn.dataset.season));
      }));
    }
  } catch(err) {
    console.error("Details error:", err);
    document.getElementById("infoContent").innerHTML = `<div class="loading">Failed to load details</div>`;
  }
}

async function loadEpisodes(tvId, season) {
  const container = document.getElementById("episodesContainer");
  container.innerHTML = `<div class="loading">Loading episodes...</div>`;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${season}?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    container.innerHTML = "";
    if(!data.episodes || data.episodes.length === 0) { 
      container.innerHTML = `<div class="loading">No episodes found</div>`; 
      return; 
    }
    
    data.episodes.forEach(ep => {
      const epCard = document.createElement("div");
      epCard.className = "episodeCard";
      epCard.tabIndex = 0;
      epCard.innerHTML = `
        <img class="episodeThumb" src="${ep.still_path ? TMDB_IMAGE_BASE + ep.still_path : "https://via.placeholder.com/320x180?text=Episode+"+ep.episode_number}" alt="Episode ${ep.episode_number}">
        <div class="episodeInfo">
          <h4 class="episodeTitle">${ep.episode_number}. ${ep.name || "Episode " + ep.episode_number}</h4>
          <p class="episodeDesc">${ep.overview ? ep.overview.substring(0, 100) + "..." : "No description"}</p>
        </div>
      `;
      epCard.addEventListener("click", () => { 
        playEpisode(tvId, season, ep.episode_number); 
        saveContinueWatching({id:tvId, title:currentItem.name + " S"+season+"E"+ep.episode_number, poster_path:currentItem.poster_path, media_type:"tv"}); 
      });
      epCard.addEventListener("keydown", e => (e.key === "Enter" || e.key === "OK") && playEpisode(tvId, season, ep.episode_number));
      container.appendChild(epCard);
    });
    setTimeout(() => setFocus(container.querySelector(".episodeCard")), 200);
  } catch {
    container.innerHTML = `<div class="loading">Failed to load episodes</div>`;
  }
}

// --- PLAYER ---
function showPlayerControls() { 
  topControls.classList.add("active"); 
  clearTimeout(hideControlsTimer); 
  hideControlsTimer = setTimeout(hidePlayerControls, CONTROLS_HIDE_DELAY); 
}
function hidePlayerControls() { topControls.classList.remove("active"); }

function playMovie(tmdbID) {
  currentMovieID = tmdbID;
  document.getElementById("videoFrame").src = `https://streamimdb.ru/embed/movie/${tmdbID}`;
  infoPage.style.display = "none";
  playerModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  showPlayerControls();
  setTimeout(() => setFocus(document.getElementById("server1Btn")), 150);
}

function playEpisode(tvId, season, ep) {
  currentMovieID = `${tvId}-${season}-${ep}`;
  document.getElementById("videoFrame").src = `https://streamimdb.ru/embed/tv/${tvId}/${season}/${ep}`;
  infoPage.style.display = "none";
  playerModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  showPlayerControls();
  setTimeout(() => setFocus(document.getElementById("server1Btn")), 150);
}

document.getElementById("fullscreenBtn").addEventListener("click", () => { 
  document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); 
  showPlayerControls(); 
});
document.getElementById("server1Btn").addEventListener("click", () => { 
  if (!currentMovieID) return; 
  const parts = currentMovieID.toString().split("-"); 
  const src = parts.length === 1 
    ? `https://streamimdb.ru/embed/movie/${parts[0]}` 
    : `https://streamimdb.ru/embed/tv/${parts[0]}/${parts[1]}/${parts[2]}`; 
  document.getElementById("videoFrame").src = src; 
  showPlayerControls(); 
});
document.getElementById("server2Btn").addEventListener("click", () => { 
  if (!currentMovieID) return; 
  document.getElementById("videoFrame").src = `https://embed.maflix.dpdns.org/${currentMovieID}`; 
  showPlayerControls(); 
});

// --- CONTINUE WATCHING ---
function saveContinueWatching(item) { 
  let list = JSON.parse(localStorage.getItem("continueWatching")) || []; 
  list = list.filter(i => !(i.id === item.id && i.title === item.title)); 
  list.unshift(item); 
  if (list.length > 15) list.pop(); 
  localStorage.setItem("continueWatching", JSON.stringify(list)); 
}
function loadContinueWatching() { 
  const list = JSON.parse(localStorage.getItem("continueWatching")) || []; 
  if (!list.length) { continueSection.style.display = "none"; return; } 
  continueSection.style.display = "block"; 
  const grid = document.getElementById("continueGrid"); 
  grid.innerHTML = ""; 
  list.forEach(m => grid.appendChild(createCard(m))); 
}

// --- CONTENT LOADING ---
async function loadTrending() {
  const grid = document.getElementById("trendingGrid");
  grid.innerHTML = `<div class="loading">Loading...</div>`;
  try {
    const res = await fetch(`${TMDB_TRENDING_URL}?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    grid.innerHTML = "";
    if(data.results) data.results.forEach(item => { 
      if(item.media_type === "movie" || item.media_type === "tv") grid.appendChild(createCard(item)); 
    });
  } catch { grid.innerHTML = `<div class="loading">Failed to load</div>`; }
}

async function loadPopularMovies() {
  const grid = document.getElementById("popularGrid");
  grid.innerHTML = `<div class="loading">Loading...</div>`;
  try {
    const res = await fetch(`${TMDB_POPULAR_MOVIE}?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    grid.innerHTML = "";
    if(data.results) data.results.forEach(m => { 
      m.media_type = "movie"; 
      grid.appendChild(createCard(m)); 
    });
  } catch { grid.innerHTML = `<div class="loading">Failed to load</div>`; }
}

async function loadPopularSeries() {
  const grid = document.getElementById("seriesPopularGrid");
  grid.innerHTML = `<div class="loading">Loading...</div>`;
  try {
    const res = await fetch(`${TMDB_POPULAR_TV}?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    grid.innerHTML = "";
    if(data.results) data.results.forEach(s => { 
      s.media_type = "tv"; 
      grid.appendChild(createCard(s)); 
    });
  } catch { grid.innerHTML = `<div class="loading">Failed to load</div>`; }
}

async function loadAllMovies() {
  const grid = document.getElementById("moviesGrid");
  grid.innerHTML = `<div class="loading">Loading movies...</div>`;
  try {
    const res = await fetch(`${TMDB_DISCOVER_MOVIE}?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=1`);
    const data = await res.json();
    grid.innerHTML = "";
    if(data.results && data.results.length > 0) {
      data.results.forEach(m => { 
        m.media_type = "movie"; 
        grid.appendChild(createCard(m)); 
      });
    } else {
      grid.innerHTML = `<div class="loading">No movies found</div>`;
    }
  } catch (err) { 
    console.error("Load movies error:", err);
    grid.innerHTML = `<div class="loading">Failed to load movies</div>`; 
  }
}

async function loadAllSeries() {
  const grid = document.getElementById("seriesGrid");
  grid.innerHTML = `<div class="loading">Loading series...</div>`;
  try {
    const res = await fetch(`${TMDB_DISCOVER_TV}?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=1`);
    const data = await res.json();
    grid.innerHTML = "";
    if(data.results && data.results.length > 0) {
      data.results.forEach(s => { 
        s.media_type = "tv"; 
        grid.appendChild(createCard(s)); 
      });
    } else {
      grid.innerHTML = `<div class="loading">No series found</div>`;
    }
  } catch { grid.innerHTML = `<div class="loading">Failed to load series</div>`; }
}

async function loadGenreMovies(id, gridId) { 
  const grid = document.getElementById(gridId); 
  grid.innerHTML = `<div class="loading">Loading...</div>`; 
  try { 
    const res = await fetch(`${TMDB_DISCOVER_MOVIE}?api_key=${TMDB_API_KEY}&with_genres=${id}&sort_by=popularity.desc`); 
    const data = await res.json(); 
    grid.innerHTML = ""; 
    if(data.results) data.results.forEach(m => { 
      m.media_type = "movie"; 
      grid.appendChild(createCard(m)); 
    }); 
  } catch { grid.innerHTML = `<div class="loading">Failed to load</div>`; } 
}

async function loadAnime() { 
  const grid = document.getElementById("animeGrid"); 
  grid.innerHTML = `<div class="loading">Loading...</div>`; 
  try { 
    const res = await fetch(`${TMDB_DISCOVER_MOVIE}?api_key=${TMDB_API_KEY}&with_keywords=210024&sort_by=popularity.desc`); 
    const data = await res.json(); 
    grid.innerHTML = ""; 
    if(data.results) data.results.forEach(m => { 
      m.media_type = "movie"; 
      grid.appendChild(createCard(m)); 
    }); 
  } catch { grid.innerHTML = `<div class="loading">Failed to load</div>`; } 
}

// --- TV REMOTE NAVIGATION ---
let currentFocus = null;
function setFocus(element) { 
  if (!element || element === currentFocus) return; 
  if (currentFocus) currentFocus.classList.remove("focused"); 
  currentFocus = element; 
  currentFocus.classList.add("focused"); 
  currentFocus.focus(); 
  if (currentFocus !== searchInput) currentFocus.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); 
}

function handleKeyNav(e) {
  const isPlaying = playerModal.style.display === "flex";
  const isInfoOpen = infoPage.style.display === "block";
  const sidebarActive = sidebar.classList.contains("active");
  const isSearchActive = document.activeElement === searchInput;

  if (isPlaying) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) { 
      e.preventDefault(); 
      showPlayerControls(); 
    }
    if (e.key === "ArrowRight") { 
      if (currentFocus === document.getElementById("server1Btn")) setFocus(document.getElementById("server2Btn")); 
      else if (currentFocus === document.getElementById("server2Btn")) setFocus(document.getElementById("fullscreenBtn")); 
      else if (currentFocus === document.getElementById("fullscreenBtn")) setFocus(document.getElementById("backPlayer")); 
      return; 
    }
    if (e.key === "ArrowLeft") { 
      if (currentFocus === document.getElementById("backPlayer")) setFocus(document.getElementById("fullscreenBtn")); 
      else if (currentFocus === document.getElementById("fullscreenBtn")) setFocus(document.getElementById("server2Btn")); 
      else if (currentFocus === document.getElementById("server2Btn")) setFocus(document.getElementById("server1Btn")); 
      return; 
    }
    if (["Escape", "Backspace"].includes(e.key) || e.keyCode === 461 || e.keyCode === 10009) { 
      document.getElementById("backPlayer").click(); 
      e.preventDefault(); 
      return; 
    }
    if (e.key === "Enter" || e.key === "OK") { 
      if (currentFocus?.click) currentFocus.click(); 
      e.preventDefault(); 
      return; 
    }
    return;
  }

  if (isInfoOpen) {
    if (["Escape", "Backspace"].includes(e.key) || e.keyCode === 461 || e.keyCode === 10009) { 
      document.getElementById("infoBackBtn").click(); 
      e.preventDefault(); 
      return; 
    }
    if (e.key === "Enter" || e.key === "OK") { 
      if (currentFocus?.click) currentFocus.click(); 
      e.preventDefault(); 
      return; 
    }
    return;
  }

  if (sidebarActive) {
    const items = Array.from(document.querySelectorAll(".sidebarLinks a")).filter(el => el.offsetParent);
    if (!items.length) return;
    const idx = currentFocus ? items.indexOf(currentFocus) : 0;
    if (e.key === "ArrowDown") { 
      const n = (idx + 1) % items.length; 
      setFocus(items[n]); 
      e.preventDefault(); 
    }
    if (e.key === "ArrowUp") { 
      const p = (idx - 1 + items.length) % items.length; 
      setFocus(items[p]); 
      e.preventDefault(); 
    }
    if (e.key === "ArrowRight") { 
      closeSidebar(); 
      e.preventDefault(); 
    }
    if ((e.key === "Enter" || e.key === "OK") && currentFocus) { 
      const cat = currentFocus.getAttribute("href").replace("go:", ""); 
      loadCategory(cat); 
      e.preventDefault(); 
    }
    if (["Escape", "Backspace"].includes(e.key)) { 
      closeSidebar(); 
      e.preventDefault(); 
    }
    return;
  }

  if (isSearchActive) {
    if (["Escape", "Backspace"].includes(e.key)) { 
      searchInput.value = ""; 
      hideAllSections(); 
      homeContent.style.display = "block"; 
      setFocus(document.getElementById("menuBtn")); 
      searchInput.blur(); 
      e.preventDefault(); 
    }
    return;
  }

  const rows = Array.from(document.querySelectorAll(".row")).filter(r => r.offsetParent);
  if (!rows.length) return;

  const focusableAll = Array.from(document.querySelectorAll('button, a, input, .card, .seasonBtn, .episodeCard')).filter(el => el.offsetParent);
  if (!focusableAll.length) return;

  const currentIndex = currentFocus ? focusableAll.indexOf(currentFocus) : 0;

  if (e.key === "ArrowDown") {
    let nextRow = null;
    const currentRect = currentFocus.getBoundingClientRect();
    for (let r of rows) {
      const rRect = r.getBoundingClientRect();
      if (rRect.top > currentRect.top + 20) {
        if (!nextRow || rRect.top < nextRow.getBoundingClientRect().top) nextRow = r;
      }
    }
    if (nextRow) {
      const cards = Array.from(nextRow.querySelectorAll(".card")).filter(el => el.offsetParent);
      if (cards.length > 0) {
        const best = cards.reduce((closest, card) => {
          const cRect = card.getBoundingClientRect();
          const diff = Math.abs(cRect.left + cRect.width/2 - currentRect.left - currentRect.width/2);
          if (!closest || diff < closest.diff) return {el: card, diff};
          return closest;
        }, null);
        if (best) setFocus(best.el);
      }
    } else {
      const nextIdx = (currentIndex + 1) % focusableAll.length;
      setFocus(focusableAll[nextIdx]);
    }
    e.preventDefault();
  }

  if (e.key === "ArrowUp") {
    let prevRow = null;
    const currentRect = currentFocus.getBoundingClientRect();
    for (let r of rows) {
      const rRect = r.getBoundingClientRect();
      if (rRect.bottom < currentRect.bottom - 20) {
        if (!prevRow || rRect.bottom > prevRow.getBoundingClientRect().bottom) prevRow = r;
      }
    }
    if (prevRow) {
      const cards = Array.from(prevRow.querySelectorAll(".card")).filter(el => el.offsetParent);
      if (cards.length > 0) {
        const best = cards.reduce((closest, card) => {
          const cRect = card.getBoundingClientRect();
          const diff = Math.abs(cRect.left + cRect.width/2 - currentRect.left - currentRect.width/2);
          if (!closest || diff < closest.diff) return {el: card, diff};
          return closest;
        }, null);
        if (best) setFocus(best.el);
      }
    } else {
      const prevIdx = (currentIndex - 1 + focusableAll.length) % focusableAll.length;
      setFocus(focusableAll[prevIdx]);
    }
    e.preventDefault();
  }

  if (e.key === "ArrowRight") {
    const row = currentFocus.closest(".row");
    if (row) {
      const items = Array.from(row.querySelectorAll(".card")).filter(el => el.offsetParent);
      const idx = items.indexOf(currentFocus);
      if (idx >= 0 && idx < items.length - 1) setFocus(items[idx + 1]);
      else row.scrollBy({ left: 400, behavior: "smooth" });
    } else {
      const nextIdx = (currentIndex + 1) % focusableAll.length;
      setFocus(focusableAll[nextIdx]);
    }
    e.preventDefault();
  }

  if (e.key === "ArrowLeft") {
    const row = currentFocus.closest(".row");
    if (row) {
      const items = Array.from(row.querySelectorAll(".card")).filter(el => el.offsetParent);
      const idx = items.indexOf(currentFocus);
      if (idx > 0) setFocus(items[idx - 1]);
      else row.scrollBy({ left: -400, behavior: "smooth" });
    } else {
      const prevIdx = (currentIndex - 1 + focusableAll.length) % focusableAll.length;
      setFocus(focusableAll[prevIdx]);
    }
    e.preventDefault();
  }

  if (e.key === "Enter" || e.key === "OK") {
    if (currentFocus?.click) currentFocus.click();
    e.preventDefault();
  }

  if (["Escape", "Backspace"].includes(e.key) || e.keyCode === 461 || e.keyCode === 10009) {
    if (sidebar.classList.contains("active")) closeSidebar();
    else if (infoPage.style.display === "block") { document.getElementById("infoBackBtn").click(); }
    else if (document.activeElement === searchInput) { searchInput.blur(); searchInput.value = ""; }
    else { openSidebar(); }
    e.preventDefault();
  }
}

document.addEventListener("keydown", handleKeyNav);

// Initialize App
window.addEventListener("load", () => {
  loadCategory("home");
  setTimeout(() => {
    const firstCard = document.querySelector(".card");
    if (firstCard) setFocus(firstCard);
  }, 800);
});
