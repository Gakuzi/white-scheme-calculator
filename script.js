let currentStep = 1;
const steps = document.querySelectorAll(".step");
const nextBtns = document.querySelectorAll(".next");
const prevBtns = document.querySelectorAll(".prev");

let selectedRegion = null;

// ======= Регионы (вшиты в скрипт) =======
const regions = [
  {region_code: "29", region_name: "Архангельская область", rk: 1.2, sever: 0.5, rosstat_url: "https://rosstat.gov.ru/folder/11109?print=29"},
  {region_code: "77", region_name: "Москва", rk: 1.0, sever: 0.0, rosstat_url: "https://rosstat.gov.ru/folder/11109?print=77"},
  {region_code: "51", region_name: "Мурманская область", rk: 1.3, sever: 0.6, rosstat_url: "https://rosstat.gov.ru/folder/11109?print=51"}
];

// ======= Работа с регионом =======
const regionSelect = document.getElementById("regionSelect");
const nextStep1 = document.getElementById("nextStep1");

// Заполняем select
regions.forEach(r => {
  const opt = document.createElement("option");
  opt.value = r.region_code;
  opt.textContent = r.region_name;
  regionSelect.appendChild(opt);
});

// Выбор региона
regionSelect.addEventListener("change", () => {
  const code = regionSelect.value;
  selectedRegion = regions.find(r => r.region_code === code);
  if(selectedRegion) {
    document.getElementById("regionInfo").innerHTML = `
      РК: ${selectedRegion.rk}, Северная надбавка: ${selectedRegion.sever} 
      (<a href="${selectedRegion.rosstat_url}" target="_blank">Росстат</a>)
    `;
    nextStep1.disabled = false;
  } else {
    document.getElementById("regionInfo").innerHTML = "";
    nextStep1.disabled = true;
  }
});

// ======= Навигация шагов =======
nextBtns.forEach(btn => btn.addEventListener("click", () => {
  if(currentStep < steps.length) {
    steps[currentStep-1].classList.remove("active");
    currentStep++;
    steps[currentStep-1].classList.add("active");
    if(currentStep===3) generateRisks();
    if(currentStep===5) calculateResults();
    if(currentStep===6) showArguments();
    if(currentStep===7) showScales();
  }
}));

prevBtns.forEach(btn => btn.addEventListener("click", () => {
  if(currentStep > 1) {
    steps[currentStep-1].classList.remove("active");
    currentStep--;
    steps[currentStep-1].classList.add("active");
  }
}));

// ======= Чек-лист рисков =======
const riskFactors = [
  "Доля «технических» контрагентов",
  "Средняя ЗП vs. регион",
  "Доля наличных расходов",
  "Отклонение налоговой нагрузки",
  "Смена юрадреса/директора",
  "Дробление бизнеса"
];

function generateRisks() {
  const risksDiv = document.getElementById("risks");
  risksDiv.innerHTML = "";
  riskFactors.forEach(f => {
    const div = document.createElement("div");
    div.innerHTML = `<label>${f}: 
      <select data-risk="${f}">
        <option value="0">0</option>
        <option value="0.5">0.5</option>
        <option value="1">1</option>
      </select>
    </label>`;
    risksDiv.appendChild(div);
  });
}

// ======= Расчёты =======
function calculateResults() {
  const W = parseFloat(document.getElementById("W").value);
  const MROT = parseFloat(document.getElementById("MROT").value);
  const p = parseFloat(document.getElementById("p").value)/100;
  const c = parseFloat(document.getElementById("c").value)/100;
  const t = parseFloat(document.getElementById("t").value)/100;
  const k = parseFloat(document.getElementById("k").value)/100;
  const phi = parseFloat(document.getElementById("phi").value);

  const N = parseInt(document.getElementById("numEmployees").value);

  const b_white = parseFloat(document.getElementById("b_white").value)/N;
  const b_grey = parseFloat(document.getElementById("b_grey").value)/N;
  const b_black = parseFloat(document.getElementById("b_black").value)/N;
  const y_white = parseFloat(document.getElementById("y_white").value)/N;
  const y_grey = parseFloat(document.getElementById("y_grey").value)/N;
  const y_black = parseFloat(document.getElementById("y_black").value)/N;
  const serv_black = parseFloat(document.getElementById("serv_black").value)/N;
  const servers = parseFloat(document.getElementById("servers").value)/N;
  const S_med = parseFloat(document.getElementById("S_med").value);

  const risks = Array.from(document.querySelectorAll("[data-risk]")).map(s=>parseFloat(s.value));
  const R = risks.reduce((a,b)=>a+b,0)/risks.length;
  const P_m3 = R*0.3;
  const P_m = P_m3/36;

  const rk = selectedRegion ? selectedRegion.rk : 1.2;
  const sever = selectedRegion ? selectedRegion.sever : 0.5;
  const M = rk*(1+sever);
  const G = W/(1-p);
  const G_min = MROT*M;
  const W_min = G_min*(1-p);
  const E = W - W_min;

  const C_white = ((1-t)*(1+c)*G) + b_white + y_white - S_med;
  const C_grey = ((1-t)*(1+c)*G_min) + (1+k)*E + b_grey + y_grey + serv_black + servers + P_m*t*E*phi;
  const C_black = (1+k)*W + b_black + y_black + serv_black + servers + P_m*t*W*phi;

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = `
  <table>
    <tr><th>Схема</th><th>Месяц ₽</th><th>Год ₽</th><th>Экономия vs белая</th></tr>
    <tr><td>Белая</td><td>${C_white.toFixed(0)}</td><td>${(C_white*12).toFixed(0)}</td><td>-</td></tr>
    <tr><td>Серая</td><td>${C_grey.toFixed(0)}</td><td>${(C_grey*12).toFixed(0)}</td><td>${(C_white-C_grey).toFixed(0)}</td></tr>
    <tr><td>Чёрная</td><td>${C_black.toFixed(0)}</td><td>${(C_black*12).toFixed(0)}</td><td>${(C_white-C_black).toFixed(0)}</td></tr>
  </table>`;

  // Chart.js
  const ctx = document.getElementById("chart").getContext("2d");
  if(window.myChart) window.myChart.destroy();
  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Белая', 'Серая', 'Чёрная'],
      datasets: [{
        label: 'Месячная стоимость на сотрудника',
        data: [C_white.toFixed(0), C_grey.toFixed(0), C_black.toFixed(0)],
        backgroundColor: ['#4caf50','#ff9800','#f44336']
      }]
    },
    options: { responsive:true, maintainAspectRatio:false }
  });

  window.finalValues = {C_white,C_grey,C_black};
}

// ======= Аргументы =======
function showArguments() {
  document.getElementById("arguments").innerHTML = `
  <ul>
    <li>Лояльность сотрудников повышается на 30-40% (HH.ru)</li>
    <li>Поиск и привлечение 1 сотрудника стоит 3–6 окладов</li>
    <li>Белая ЗП снижает ставки по кредитам компании на 1–2%</li>
    <li>Прозрачная бухгалтерия позволяет участвовать в госзакупках (ФЗ-44/223)</li>
    <li>Снижение риска проверок, налоговых штрафов</li>
    <li>Возможность перевода бухгалтерии и юристов в облако с безопасным хранением</li>
  </ul>`;
}

// ======= Анимация весов =======
function showScales() {
  const scalesDiv = document.getElementById("scales");
  const {C_white,C_grey,C_black} = window.finalValues;
  const totalRisk = C_grey + C_black;
  scalesDiv.innerHTML = `
  <svg width="400" height="200">
    <line x1="50" y1="100" x2="350" y2="100" stroke="#333" stroke-width="4"/>
    <circle cx="${200-50*(totalRisk-C_white)/totalRisk}" cy="100" r="30" fill="#4caf50"/>
    <circle cx="${200+50*(totalRisk-C_white)/totalRisk}" cy="100" r="30" fill="#f44336"/>
    <text x="${200-50*(totalRisk-C_white)/totalRisk-15}" y="105" fill="white">${C_white.toFixed(0)}</text>
    <text x="${200+50*(totalRisk-C_white)/totalRisk-15}" y="105" fill="white">${totalRisk.toFixed(0)}</text>
  </svg>`;
}