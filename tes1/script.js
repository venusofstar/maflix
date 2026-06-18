// --------------------------
// SERVER TOGGLE LOGIC (NEW)
// --------------------------
const serverToggleBtn = document.getElementById('serverToggleBtn');
const serverMenu = document.getElementById('serverMenu');

serverToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isVisible = serverMenu.style.display === 'flex';
  serverMenu.style.display = isVisible ? 'none' : 'flex';
});

document.addEventListener('click', () => {
  serverMenu.style.display = 'none';
});

serverMenu.addEventListener('click', (e) => {
  e.stopPropagation();
});


// --------------------------
// ORIGINAL FULL SCRIPT
// --------------------------
const TMDB_API_KEY = 'b5632a62ba8688ec27b39712c1d5cfcc'; // Replace with your actual TMDB key
const BASE_IMG = 'https://image.tmdb.org/t/p/w500';
let currentData = null;
let selectedServer = 1; // Default server

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar Navigation
  const sidebarLinks = document.querySelectorAll('.sidebarLinks a');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const goTo = link.getAttribute('href').replace('go:', '');
      navigate(goTo);
      closeSidebar();
    });
  });

  document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('overlay').classList.add('active');
  });

  document.getElementById('closeMenu').addEventListener('click', closeSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
  }

  // Search
  document.getElementById('searchBtn').addEventListener('click', searchContent);
  document.getElementById('movieSearchInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') searchContent();
  });

  // Hero Buttons
  document.getElementById('heroPlay').addEventListener('click', () => {
    if (currentData) playMovie(currentData.id);
  });
  document.getElementById('heroInfo').addEventListener('click', () => {
    if (currentData) showInfo(currentData);
  });

  // Player Back
  document.getElementById('backPlayer').addEventListener('click', () => {
    document.getElementById('playerModal').style.display = 'none';
    document.getElementById('videoFrame').src = '';
  });

  // Server Selection
  document.getElementById('server1Btn').addEventListener('click', () => {
    selectedServer = 1;
    if (currentData) playMovie(currentData.id);
    serverMenu.style.display = 'none';
  });

  document.getElementById('server2Btn').addEventListener('click', () => {
    selectedServer = 2;
    if (currentData) playMovie(currentData.id);
    serverMenu.style.display = 'none';
  });

  // Load initial content
  loadHomeContent();
});

// --------------------------
// NAVIGATION & CONTENT LOADING
// --------------------------
function navigate(page) {
  document.querySelectorAll('.section, #homeContent').forEach(el => el.style.display = 'none');
  
  switch(page) {
    case 'home':
      document.getElementById('homeContent').style.display = 'block';
      loadHomeContent();
      break;
    case 'movies':
      document.getElementById('moviesSection').style.display = 'block';
      loadMovies();
      break;
    case 'series':
      document.getElementById('seriesSection').style.display = 'block';
      loadTVShows();
      break;
    case 'anime-tag':
      document.getElementById('moviesSection').style.display = 'block';
      loadAnime();
      break;
    case 'drama-tag':
      document.getElementById('moviesSection').style.display = 'block';
      loadDrama();
      break;
    case 'sports':
      document.getElementById('moviesSection').style.display = 'block';
      loadSports();
      break;
    case 'vivamax':
      document.getElementById('moviesSection').style.display = 'block';
      loadVivaMax();
      break;
    case 'search':
      document.getElementById('searchSection').style.display = 'block';
      break;
  }
  window.scrollTo({top:0});
}

async function loadHomeContent() {
  try {
    const trendingRes = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}`);
    const trending = await trendingRes.json();
    renderCards('trendingGrid', trending.results);
    currentData = trending.results[0];

    const popularMovieRes = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`);
    const popularMovies = await popularMovieRes.json();
    renderCards('popularGrid', popularMovies.results);

    const popularTVRes = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}`);
    const popularTV = await popularTVRes.json();
    renderCards('seriesPopularGrid', popularTV.results);

    const actionRes = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=28`);
    const action = await actionRes.json();
    renderCards('actionGrid', action.results);

    const horrorRes = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=27`);
    const horror = await horrorRes.json();
    renderCards('horrorGrid', horror.results);

    const dramaRes = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=18`);
    const drama = await dramaRes.json();
    renderCards('dramaGrid', drama.results);

    const comedyRes = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=35`);
    const comedy = await comedyRes.json();
    renderCards('comedyGrid', comedy.results);

    const animeRes = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=16&with_keywords=210024`);
    const anime = await animeRes.json();
    renderCards('animeGrid', anime.results);

  } catch(e) { console.error(e); }
}

async function loadMovies() {
  const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`);
  const data = await res.json();
  renderCards('moviesGrid', data.results);
}

async function loadTVShows() {
  const res = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}`);
  const data = await res.json();
  renderCards('seriesGrid', data.results);
}

async function loadAnime() {
  const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`);
  const data = await res.json();
  renderCards('moviesGrid', data.results);
}

async function loadDrama() {
  const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=18&sort_by=popularity.desc`);
  const data = await res.json();
  renderCards('moviesGrid', data.results);
}

async function loadSports() {
  const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_keywords=223937&sort_by=popularity.desc`);
  const data = await res.json();
  renderCards('moviesGrid', data.results);
}

async function loadVivaMax() {
  const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=VivaMax&include_adult=true`);
  const data = await res.json();
  renderCards('moviesGrid', data.results);
}

async function searchContent() {
  const q = document.getElementById('movieSearchInput').value.trim();
  if(!q) return;
  navigate('search');
  const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`);
  const data = await res.json();
  renderCards('searchGrid', data.results);
}

// --------------------------
// RENDERING
// --------------------------
function renderCards(containerId, list) {
  const cont = document.getElementById(containerId);
  cont.innerHTML = '';
  if(!list || list.length === 0) {
    cont.innerHTML = `<div class="loading">No content found</div>`;
    return;
  }
  list.forEach(item => {
    const title = item.title || item.name || 'Untitled';
    const poster = item.poster_path ? BASE_IMG + item.poster_path : 'placeholder.jpg';
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <img src="${poster}" alt="${title}" loading="lazy">
      <p>${title}</p>
    `;
    div.addEventListener('click', () => showInfo(item));
    cont.appendChild(div);
  });
}

function showInfo(item) {
  currentData = item;
  const title = item.title || item.name;
  const desc = item.overview || 'No description available.';
  const poster = item.poster_path ? BASE_IMG + item.poster_path : '';

  document.getElementById('infoContent').innerHTML = `
    <div class="infoPoster"><img src="${poster}" alt="${title}"></div>
    <div class="infoDetails">
      <h2 class="infoTitle">${title}</h2>
      <div class="infoMeta">
        <span>⭐ ${item.vote_average?.toFixed(1) || 'N/A'}</span>
        <span>📅 ${item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A'}</span>
      </div>
      <p class="infoOverview">${desc}</p>
      <button class="infoPlayBtn" onclick="playMovie(${item.id}, '${item.media_type || (item.title ? 'movie' : 'tv')}')">▶ Watch Now</button>
    </div>
  `;
  document.getElementById('infoPage').style.display = 'block';
  window.scrollTo({top:0});
}

// --------------------------
// PLAYER & SERVER LOGIC
// --------------------------
function playMovie(id, type = 'movie') {
  document.getElementById('infoPage').style.display = 'none';
  document.getElementById('playerModal').style.display = 'flex';

  // Your embed URLs - change these to your actual server links
  let embedUrl;
  if(selectedServer === 1) {
    embedUrl = `https://streamimdb.ru/embed/movie/${type}/${id}`;
  } else {
    embedUrl = `https://embed.maflix.dpdns.org/${type}?id=${id}`;
  }

  document.getElementById('videoFrame').src = embedUrl;
}

// --------------------------
// SCROLL ROWS
// --------------------------
function scrollRow(id, dir) {
  const row = document.getElementById(id);
  if(!row) return;
  const amt = row.clientWidth * 0.8;
  row.scrollBy({left: dir * amt, behavior: 'smooth'});
}
