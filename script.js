let staticChannels = [];
let shakaPlayer=null;
let currentChannel=null;

// ================= FETCH CHANNELS =================
async function fetchChannels(){
  try{
    const res = await fetch('channels.json'); // your remote JSON file
    const data = await res.json();
    staticChannels = data.channels; // expects { "channels": [ ... ] }
    render(staticChannels);
  }catch(err){
    console.error("Failed to fetch channels:", err);
    document.getElementById("channelSections").innerHTML = "<p style='text-align:center;color:red;'>Failed to load channels</p>";
  }
}

// ================= GROUP CHANNELS =================
function groupChannels(list){
  return list.reduce((g,c)=>{
    (g[c.category] ||= []).push(c);
    return g;
  },{});
}

// ================= RENDER CHANNELS =================
function render(channelsList){
  const container=document.getElementById("channelSections");
  container.innerHTML="";
  const grouped=groupChannels(channelsList);

  for(const [cat,channels] of Object.entries(grouped)){
    const h=document.createElement("h2");
    h.textContent=cat;
    container.appendChild(h);

    const row=document.createElement("div");
    row.className="horizontal-scroll";

    channels.forEach(ch=>{
      const card=document.createElement("div");
      card.className="card-item";
      card.tabIndex=0;
      card.innerHTML=`<img data-src="${ch.logo}" class="lazy"><p>${ch.name}</p>`;
      card.onclick=()=>playChannel(ch);
      row.appendChild(card);
    });

    container.appendChild(row);
  }

  // ===== LAZY LOAD =====
  const lazyImages=document.querySelectorAll("img.lazy");
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.src=entry.target.dataset.src;
        observer.unobserve(entry.target);
      }
    });
  });
  lazyImages.forEach(img=>observer.observe(img));
}

// ================= PLAY VIDEO =================
async function playChannel(ch){
  currentChannel=ch;
  const v=document.getElementById("videoPlayer");
  const yt=document.getElementById("ytFrame");
  const c=document.getElementById("videoContainer");
  const spinner=document.getElementById("spinner");

  c.style.display="flex";
  spinner.style.display="block";

  v.pause(); v.removeAttribute("src"); v.load();
  yt.src=""; yt.style.display="none";
  v.style.display="none";

  if(ch.type==="youtube"){
    yt.style.display="block";
    yt.src=`https://www.youtube.com/embed/${ch.manifestUri.split("v=")[1]}?autoplay=1`;
    spinner.style.display="none";
    return;
  }

  if(ch.type==="mp4"){
    if(shakaPlayer){ await shakaPlayer.destroy(); shakaPlayer=null; }
    v.style.display="block";
    v.src=ch.manifestUri;

    const saved=localStorage.getItem(ch.name);
    if(saved) v.currentTime=saved;

    v.onloadeddata=()=> spinner.style.display="none";
    v.ontimeupdate=()=> localStorage.setItem(ch.name,v.currentTime);
    v.play();
    return;
  }

  v.style.display="block";
  shakaPlayer ??= new shaka.Player(v);
  await shakaPlayer.unload();

  if(ch.clearKey){ shakaPlayer.configure({ drm:{ clearKeys: ch.clearKey } }); }

  try{
    await shakaPlayer.load(ch.manifestUri);
    shakaPlayer.configure({abr:{enabled:true}});
    spinner.style.display="none";
    v.play();
  }catch(e){
    spinner.style.display="none";
    alert("Playback error");
  }
}

// ================= CLOSE VIDEO =================
document.getElementById("closeBtn").addEventListener("click", ()=>{
  const v=document.getElementById("videoPlayer");
  const yt=document.getElementById("ytFrame");
  const c=document.getElementById("videoContainer");
  c.style.display="none";
  v.pause(); v.removeAttribute("src"); v.load();
  yt.src="";
});

// ================= SEARCH FUNCTION =================
document.getElementById("searchInput").addEventListener("input", (e)=>{
  const val=e.target.value.toLowerCase();
  const filtered=staticChannels.filter(ch=>
    ch.name.toLowerCase().includes(val) || ch.category.toLowerCase().includes(val)
  );
  render(filtered);
});

// ================= INIT =================
window.onload=fetchChannels;
