// --- LOAD API CONFIG FROM EXTERNAL JSON ---
let TMDB_API_KEY, TMDB_IMAGE_BASE, TMDB_SEARCH_URL, TMDB_DISCOVER_MOVIE, TMDB_DISCOVER_TV, TMDB_TRENDING_URL, TMDB_POPULAR_MOVIE, TMDB_POPULAR_TV;

async function loadApiConfig() {
  try {
    const res = await fetch('api.json');
    if (!res.ok) throw new Error('Failed to load config');
    const config = await res.json();
    
    TMDB_API_KEY = config.TMDB_API_KEY;
    TMDB_IMAGE_BASE = config.TMDB_IMAGE_BASE;
    TMDB_SEARCH_URL = config.TMDB_SEARCH_URL;
    TMDB_DISCOVER_MOVIE = config.TMDB_DISCOVER_MOVIE;
    TMDB_DISCOVER_TV = config.TMDB_DISCOVER_TV;
    TMDB_TRENDING_URL = config.TMDB_TRENDING_URL;
    TMDB_POPULAR_MOVIE = config.TMDB_POPULAR_MOVIE;
    TMDB_POPULAR_TV = config.TMDB_POPULAR_TV;

    // Start app only after config loads
    initApp();
  } catch (err) {
    console.error("Config load error:", err);
    alert("Could not load API configuration");
  }
}

// Initialize everything after config is ready
function initApp() {
  // --- ALL YOUR ORIGINAL CODE STARTS HERE ---
  let currentItem = null;
  let currentMovieID = "";

  // DOM ELEMENTS
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const playerModal = document.getElementById("playerModal");
  const infoPage = document.getElementById("infoPage");
  const searchSection = document.getElementById("searchSection");
  const homeContent = document.getElementById("homeContent");
  const moviesSection = document.getElementById("moviesSection");
  const seriesSection = document.getElementById("seriesSection");
  const continueSection = document.getElementById("continueSection");
  const searchInput = document.getElementById("movieSearchInput");
  const searchBtn = document.getElementById("searchBtn");

  // Server Selector Elements
  const chooseServerBtn = document.getElementById("chooseServerBtn");
  const serverMenu = document.getElementById("serverMenu");
  const serverOptions = document.querySelectorAll(".server-option");

  // --- SERVER MENU LOGIC ---
  chooseServerBtn.addEventListener("click", () => {
    serverMenu.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#serverSelector")) {
      serverMenu.classList.remove("active");
    }
  });

  serverOptions.forEach(option => {
    option.addEventListener("click", () => {
      const serverNum = option.dataset.server;
      loadServer(serverNum);
      serverMenu.classList.remove("active");
    });
  });

  function loadServer(serverNum) {
    if (!currentMovieID) return;
    const parts = currentMovieID.toString().split("-");
    let videoSrc = "";

    switch(serverNum) {
      case "1":
        videoSrc = parts.length === 1 
          ? `https://streamimdb.ru/embed/movie/${parts[0]}` 
          : `https://streamimdb.ru/embed/tv/${parts[0]}/${parts[1]}/${parts[2]}`;
        break;
      case "2":
        videoSrc = `https://vidlink.pro/movie/${currentMovieID}?autoplay=true`;
        break;
      case "3":
        videoSrc = `https://vidsrc.to/embed/movie/${currentMovieID}`;
        break;
      case "4":
        videoSrc = `https://vidsrc.me/embed/movie/${currentMovieID}`;
        break;
      case "5":
        videoSrc = `https://multiembed.mov/?video_id=${currentMovieID}`;
        break;
      default:
        return;
    }

    document.getElementById("videoFrame").src = videoSrc;
  }

  // --- NAVIGATION ---
  function goHomeFromInfo() {
    infoPage.style.display = "none";
    document.body.style.overflow = "auto";
    hideAllSections();
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
  }

  document.getElementById("infoBackBtn").addEventListener("click", goHomeFromInfo);

  function backToInfoPage() {
    if (document.fullscreenElement) document.exitFullscreen();
    playerModal.style.display = "none";
    document.getElementById("videoFrame").src = "";
    document.body.style.overflow = "auto";
    infoPage.style.display = "block";
  }

  document.getElementById("backPlayer").addEventListener("click", backToInfoPage);

  // --- SEARCH ---
  searchBtn.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", e => e.key === "Enter" && performSearch());

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
  }
  function closeSidebar() { 
    sidebar.classList.remove("active"); 
    overlay.classList.remove("active"); 
    document.body.style.overflow = "auto"; 
  }
  document.getElementById("menuBtn").addEventListener("click", openSidebar);
  document.getElementById("closeMenu").addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);

  document.querySelectorAll('.sidebarLinks a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      loadCategory(link.dataset.cat);
    });
  });

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
    card.dataset.id = item.id;
    card.dataset.type = item.media_type || (item.first_air_date ? "tv" : "movie");
    const poster = item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : "https://via.placeholder.com/300x450?text=No+Poster";
    card.innerHTML = `<img src="${poster}" alt="${item.title || item.name}" loading="lazy"><p>${item.title || item.name}</p>`;
    card.addEventListener("click", () => openInfoPage(item));
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
        html += `<button class="infoPlayBtn" id="infoPlayBtn">▶ Play Movie</button>`;
      } else {
        html += `<h3 style="margin:25px 0 15px; font-size:22px;">Episodes</h3>`;
        if(details.seasons && details.seasons.length > 0) {
          html += `<div class="seasonSelector" id="seasonSelector">`;
          details.seasons.filter(s => s.season_number > 0).forEach(season => {
            html += `<button class="seasonBtn ${season.season_number === 1 ? "active" : ""}" data-season="${season.season_number}">Season ${season.season_number}</button>`;
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
      } else {
        loadEpisodes(details.id, 1);
        document.querySelectorAll(".seasonBtn").forEach(btn => {
          btn.addEventListener("click", () => switchSeason(btn, details.id));
        });
      }
    } catch(err) {
      console.error("Details error:", err);
      document.getElementById("infoContent").innerHTML = `<div class="loading">Failed to load details</div>`;
    }
  }

  function switchSeason(btn, tvId) {
    document.querySelectorAll(".seasonBtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadEpisodes(tvId, parseInt(btn.dataset.season));
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
        epCard.innerHTML = `
          <img class="episodeThumb" src="${ep.still_path ? TMDB_IMAGE_BASE + ep.still_path : "https://via.placeholder.com/320x180?text=Episode+"+ep.episode_number}" alt="Episode ${ep.episode_number}">
          <div class="episodeInfo">
            <h4 class="episodeTitle">${ep.episode_number}. ${ep.name || "Episode " + ep.episode_number}</h4>
            <p class="episodeDesc">${ep.overview ? ep.overview.substring(0, 100) + "..." : "No description"}</p>
          </div>
        `;
        epCard.addEventListener("click", () => playEpisode(tvId, season, ep.episode_number));
        container.appendChild(epCard);
      });
    } catch {
      container.innerHTML = `<div class="loading">Failed to load episodes</div>`;
    }
  }

  // --- PLAYER ---
  function playMovie(tmdbID) {
    currentMovieID = tmdbID;
    document.getElementById("videoFrame").src = `https://streamimdb.ru/embed/movie/${tmdbID}`;
    infoPage.style.display = "none";
    playerModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function playEpisode(tvId, season, ep) {
    currentMovieID = `${tvId}-${season}-${ep}`;
    document.getElementById("videoFrame").src = `https://streamimdb.ru/embed/tv/${tvId}/${season}/${ep}`;
    infoPage.style.display = "none";
    playerModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

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
}

// Start loading config when page loads
window.addEventListener("load", loadApiConfig);
