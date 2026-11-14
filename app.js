const $ = (id) => document.getElementById(id);
let place = {name:"Nandurbar", admin1:"Maharashtra", country:"India", latitude:21.3667, longitude:74.25, timezone:"Asia/Kolkata"};
let fahrenheit = false, hourlyChart = null, historyChart = null, searchTimer = null;
const weatherCodes = {0:["Clear sky","sun","sun"],1:["Mainly clear","cloud-sun","cloud-sun"],2:["Partly cloudy","cloud-sun","cloud-sun"],3:["Overcast","cloud","cloud"],45:["Fog","cloud-fog","cloud-fog"],48:["Rime fog","cloud-fog","cloud-fog"],51:["Light drizzle","cloud-drizzle","cloud-drizzle"],53:["Drizzle","cloud-drizzle","cloud-drizzle"],55:["Dense drizzle","cloud-drizzle","cloud-drizzle"],61:["Slight rain","cloud-rain","cloud-rain"],63:["Moderate rain","cloud-rain","cloud-rain"],65:["Heavy rain","cloud-rain","cloud-rain"],71:["Slight snow","cloud-snow","cloud-snow"],73:["Moderate snow","cloud-snow","cloud-snow"],75:["Heavy snow","snowflake","snowflake"],80:["Rain showers","cloud-rain","cloud-rain"],81:["Rain showers","cloud-rain","cloud-rain"],82:["Violent rain showers","cloud-lightning","cloud-lightning"],95:["Thunderstorm","cloud-lightning","cloud-lightning"],96:["Thunderstorm with hail","cloud-lightning","cloud-lightning"],99:["Thunderstorm with hail","cloud-lightning","cloud-lightning"]};
const temp = n => n == null ? "--" : `${Math.round(fahrenheit ? n*9/5+32 : n)}°${fahrenheit?"F":"C"}`;
const dateFmt = (s, opts={month:"short",day:"numeric"}) => new Date(s+"T12:00:00").toLocaleDateString(undefined,opts);
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function setBusy(id,busy){const el=$(id);el.disabled=busy;el.style.opacity=busy?".6":"1"}
async function json(url){const r=await fetch(url);if(!r.ok)throw new Error(`Data service returned ${r.status}`);return r.json()}
function locationLabel(p){return [p.name,p.admin1,p.country].filter(Boolean).join(", ")}
async function loadPlace(p){
  place=p; $("placeName").textContent=locationLabel(p); $("placeMeta").textContent=`${p.latitude.toFixed(3)}°, ${p.longitude.toFixed(3)}° · ${p.timezone||"Local time"}`;
  $("updatedAt").textContent="UPDATING";
  try{
    const [w,a]=await Promise.all([
      json(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=auto`),
      json(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${p.latitude}&longitude=${p.longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,us_aqi&timezone=auto`)
    ]);
    renderWeather(w);renderAir(a);renderHourly(w);renderForecast(w);
    $("updatedAt").textContent=`UPDATED ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`;
    $("startDate").value=w.daily.time[0];$("endDate").value=w.daily.time[Math.min(6,w.daily.time.length-1)];
    await loadHistory();
  }catch(e){console.error(e);$("updatedAt").textContent="DATA UNAVAILABLE";toast("Could not load live data. Check your connection and try again.");}
}
function renderWeather(w){
  const c=w.current, code=weatherCodes[c.weather_code]||["Weather conditions","◌"];
  $("temperature").textContent=temp(c.temperature_2m);$("condition").textContent=code[0];$("weatherSymbol").innerHTML=`<i data-lucide="${code[1]}"></i>`; setSky(c.weather_code,c.is_day,code[0],code[1]);
  $("feelsLike").textContent=temp(c.apparent_temperature);$("humidity").textContent=`${c.relative_humidity_2m}%`;
  $("wind").textContent=`${Math.round(c.wind_speed_10m)} km/h`;$("windDir").textContent=`${Math.round(c.wind_direction_10m)}°`;
  $("pressure").textContent=`${Math.round(c.pressure_msl)} hPa`;
}
function aqiBand(v){if(v<=50)return["Good","#72e0b0"];if(v<=100)return["Moderate","#d4dc75"];if(v<=150)return["Unhealthy for sensitive groups","#ffbf76"];if(v<=200)return["Unhealthy","#ff927c"];if(v<=300)return["Very unhealthy","#d98bbd"];return["Hazardous","#b978d7"]}
function setSky(code,isDay,description,iconName){
  const scene=$("skyScene");
  const kind = [95,96,99,82].includes(code) ? "storm" : [51,53,55,61,63,65,80,81].includes(code) ? "rainy" : [71,73,75].includes(code) ? "snowy" : [45,48].includes(code) ? "cloudy" : code===3 ? "cloudy" : "clear";
  scene.className=`sky-scene sky-${isDay===0?"night":kind}`;
  if(isDay===0) scene.className="sky-scene sky-night";
  $("skyCaption").textContent=isDay===0 ? `A calm night · ${description}` : `${description} over your location`;
  $("skyConditionIcon").innerHTML=`<i data-lucide="${iconName}"></i>`;
  refreshIcons();
}
function refreshIcons(){if(window.lucide)window.lucide.createIcons();}
function renderAir(a){
  const c=a.current||{}, v=c.us_aqi;const [label,color]=v==null?["Unavailable","#8290a8"]:aqiBand(v);
  $("aqiValue").textContent=v==null?"—":Math.round(v);$("aqiValue").style.color=color;$("aqiStatus").textContent=label;
  $("aqiMeterFill").style.width=`${Math.min(100,(v||0)/300*100)}%`;
  $("pm25").textContent=c.pm2_5==null?"—":`${c.pm2_5.toFixed(1)} µg/m³`;
  $("pm10").textContent=c.pm10==null?"—":`${c.pm10.toFixed(1)} µg/m³`;
  $("ozone").textContent=c.ozone==null?"—":`${c.ozone.toFixed(1)} µg/m³`;
  $("no2").textContent=c.nitrogen_dioxide==null?"—":`${c.nitrogen_dioxide.toFixed(1)} µg/m³`;
}
function chartDefaults(){return{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:"index"},plugins:{legend:{display:false},tooltip:{backgroundColor:"#101d30",borderColor:"#30435e",borderWidth:1,titleColor:"#eaf2ff",bodyColor:"#aabbd2"}},scales:{x:{grid:{display:false},ticks:{color:"#7889a4",maxTicksLimit:8,font:{size:10}},border:{display:false}},y:{grid:{color:"rgba(157,181,220,.09)"},ticks:{color:"#7889a4",font:{size:10}},border:{display:false}}}}}
function renderHourly(w){
  const times=w.hourly.time.slice(0,24), labels=times.map(t=>new Date(t).toLocaleTimeString([], {hour:"numeric"}));
  const cfg=chartDefaults();cfg.scales.y.title={display:true,text:fahrenheit?"°F":"°C",color:"#8290a8"};
  if(hourlyChart)hourlyChart.destroy();
  hourlyChart=new Chart($("hourlyChart"),{type:"line",data:{labels,datasets:[{data:w.hourly.temperature_2m.slice(0,24).map(v=>fahrenheit?v*9/5+32:v),borderColor:"#63e3e8",backgroundColor:"#63e3e81c",fill:true,tension:.35,pointRadius:0,borderWidth:2,yAxisID:"y"},{data:w.hourly.precipitation_probability.slice(0,24),borderColor:"#769cff",borderDash:[4,4],tension:.3,pointRadius:0,borderWidth:1.5,yAxisID:"y1"}]},options:{...cfg,scales:{...cfg.scales,y:{...cfg.scales.y},y1:{position:"right",min:0,max:100,grid:{display:false},ticks:{color:"#7889a4",callback:v=>v+"%"},border:{display:false}}}}});
}
function renderForecast(w){
  $("forecastGrid").innerHTML=w.daily.time.map((d,i)=>{const code=weatherCodes[w.daily.weather_code[i]]||["","cloud","cloud"];return `<div class="forecast-card"><div class="forecast-day">${i===0?"TODAY":dateFmt(d,{weekday:"short"}).toUpperCase()}</div><div class="forecast-icon"><i data-lucide="${code[2]}"></i></div><div class="forecast-temps">${temp(w.daily.temperature_2m_max[i])}<span>${temp(w.daily.temperature_2m_min[i])}</span></div><div class="forecast-rain"><i data-lucide="droplets"></i> ${w.daily.precipitation_probability_max[i]??0}%</div></div>`}).join("");
  refreshIcons();
}
async function searchCities(q){
  if(!q.trim())return [];
  const data=await json(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=en&format=json`);
  return data.results||[];
}
function showSuggestions(items){
  const box=$("suggestions");if(!items.length){box.classList.add("hidden");return}
  box.innerHTML=items.map((p,i)=>`<button data-index="${i}">${locationLabel(p)} <span style="color:#8290a8"> · ${p.latitude.toFixed(2)}, ${p.longitude.toFixed(2)}</span></button>`).join("");
  box.classList.remove("hidden");box.querySelectorAll("button").forEach((b,i)=>b.addEventListener("click",()=>{const p=items[i];$("citySearch").value=p.name;box.classList.add("hidden");loadPlace(p)}));
}
$("citySearch").addEventListener("input",e=>{clearTimeout(searchTimer);const q=e.target.value;searchTimer=setTimeout(async()=>{try{showSuggestions(await searchCities(q))}catch{showSuggestions([])}},350)});
$("searchBtn").addEventListener("click",async()=>{setBusy("searchBtn",true);try{const r=await searchCities($("citySearch").value);if(r[0]){showSuggestions(r);$("suggestions").querySelector("button")?.click()}else toast("No matching place found.")}catch{toast("Place search failed.")}finally{setBusy("searchBtn",false)}});
$("citySearch").addEventListener("keydown",e=>{if(e.key==="Enter")$("searchBtn").click()});
document.querySelectorAll(".quick-city").forEach(b=>b.addEventListener("click",async()=>{const r=await searchCities(b.dataset.city);if(r[0]){$("citySearch").value=r[0].name;loadPlace(r[0])}}));
document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))$("suggestions").classList.add("hidden")});
$("unitToggle").addEventListener("click",()=>{fahrenheit=!fahrenheit;$("unitToggle").textContent=fahrenheit?"°F":"°C";loadPlace(place)});
async function loadHistory(){
  const start=$("startDate").value,end=$("endDate").value;if(!start||!end)return;
  if(start>end){toast("Start date must be before end date.");return}
  const days=(new Date(end)-new Date(start))/86400000;if(days>3650){toast("Please select a range of 10 years or less for a responsive chart.");return}
  $("historyMessage").textContent="Loading archive data…";setBusy("historyBtn",true);
  try{
    const url=`https://archive-api.open-meteo.com/v1/archive?latitude=${place.latitude}&longitude=${place.longitude}&start_date=${start}&end_date=${end}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean&timezone=auto`;
    const d=await json(url), mins=d.daily.temperature_2m_min, maxs=d.daily.temperature_2m_max, means=d.daily.temperature_2m_mean;
    const validMin=mins.map((v,i)=>({v,i})).filter(x=>x.v!=null),validMax=maxs.map((v,i)=>({v,i})).filter(x=>x.v!=null);
    if(!validMin.length||!validMax.length)throw new Error("No archive values for this period.");
    const cold=validMin.reduce((a,b)=>b.v<a.v?b:a),hot=validMax.reduce((a,b)=>b.v>a.v?b:a);
    const avg=means.filter(v=>v!=null).reduce((a,b)=>a+b,0)/means.filter(v=>v!=null).length;
    $("coldRecord").textContent=temp(cold.v);$("coldDate").textContent=dateFmt(d.daily.time[cold.i],{day:"numeric",month:"long",year:"numeric"});
    $("hotRecord").textContent=temp(hot.v);$("hotDate").textContent=dateFmt(d.daily.time[hot.i],{day:"numeric",month:"long",year:"numeric"});
    $("avgRecord").textContent=temp(avg);$("historyMessage").textContent=`Showing ${d.daily.time.length} daily records for ${locationLabel(place)}.`;
    const cfg=chartDefaults();cfg.scales.y.title={display:true,text:fahrenheit?"°F":"°C",color:"#8290a8"};
    if(historyChart)historyChart.destroy();
    historyChart=new Chart($("historyChart"),{type:"line",data:{labels:d.daily.time,datasets:[{label:"Daily maximum",data:maxs.map(v=>v==null?null:fahrenheit?v*9/5+32:v),borderColor:"#ffbf76",pointRadius:0,borderWidth:1.5,tension:.2},{label:"Daily mean",data:means.map(v=>v==null?null:fahrenheit?v*9/5+32:v),borderColor:"#63e3e8",pointRadius:0,borderWidth:2,tension:.2},{label:"Daily minimum",data:mins.map(v=>v==null?null:fahrenheit?v*9/5+32:v),borderColor:"#769cff",pointRadius:0,borderWidth:1.5,tension:.2}]},options:{...cfg,plugins:{...cfg.plugins,legend:{display:true,labels:{color:"#9aabc2",usePointStyle:true,boxWidth:7,font:{size:10}}}},scales:{...cfg.scales,x:{...cfg.scales.x,ticks:{...cfg.scales.x.ticks,maxTicksLimit:10}}}}});
  }catch(e){console.error(e);$("historyMessage").textContent="Historical data unavailable for this date range or location. Try a shorter/different range.";toast("Could not retrieve historical weather data.")}finally{setBusy("historyBtn",false)}
}
$("historyBtn").addEventListener("click",loadHistory);
$("startDate").max=new Date().toISOString().slice(0,10);$("endDate").max=new Date().toISOString().slice(0,10);
loadPlace(place);
\nrefreshIcons();\n