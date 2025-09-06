let currentStep = 1;
let regions = [];
let argumentsData = [];

// Загрузка данных регионов и аргументов
async function loadData() {
  regions = await fetch('regions.json').then(r => r.json());
  argumentsData = await fetch('arguments.json').then(r => r.json());
  const select = document.getElementById("regionSelect");
  regions.forEach(r => {
    const option = document.createElement("option");
    option.value = r.region_code;
    option.text = r.region_name;
    if(r.region_name === "Архангельская область") option.selected = true;
    select.add(option);
  });

  document.getElementById("regionSearch").addEventListener("input", e => {
    const val = e.target.value.toLowerCase();
    select.innerHTML = "";
    regions.filter(r => r.region_name.toLowerCase().includes(val) || r.region_code.includes(val))
           .forEach(r => {
             const opt = document.createElement("option");
             opt.value = r.region_code;
             opt.text = r.region_name;
             select.add(opt);
           });
  });
}

// Шаги
function nextStep(step){
  document.getElementById("step"+currentStep).style.display="none";
  document.getElementById("step"+step).style.display="block";
  currentStep = step;
}
function prevStep(step){
  document.getElementById("step"+currentStep).style.display="none";
  document.getElementById("step"+step).style.display="block";
  currentStep = step;
}

// Расчёты
function calculate(){
  const salary = parseFloat(document.getElementById("salary").value);
  const numEmployees = parseInt(document.getElementById("numEmployees").value);
  const accountant = parseFloat(document.getElementById("accountant").value)/numEmployees;
  const lawyer = parseFloat(document.getElementById("lawyer").value)/numEmployees;
  const otherCosts = parseFloat(document.getElementById("otherCosts").value)/numEmployees;

  const regionCode = document.getElementById("regionSelect").value;
  const region = regions.find(r=>r.region_code===regionCode);

  const R = (parseFloat(document.getElementById("riskTech").value)
            + parseFloat(document.getElementById("riskSalary").value)
            + parseFloat(document.getElementById("riskCash").value)
            + parseFloat(document.getElementById("riskTax").value)
            + parseFloat(document.getElementById("riskDirector").value)
            + parseFloat(document.getElementById("riskSplit").value))/6;
  const P_month = (R*0.3)/36;

  const W = salary;
  const M = region.RK*(1+region.north);
  const G = W/(1-region.p);
  const G_min = region.MROT*M;
  const W_min = G_min*(1-region.p);
  const E = W-W_min;

  const C_white = (1-region.t)*(1+region.c)*G + accountant + lawyer - region.S_med;
  const C_grey = (1-region.t)*(1+region.c)*G_min + (1+region.k)*E + accountant*1.2 + lawyer*1.3 + otherCosts + P_month*region.t*E*region.phi;
  const C_black = (1+region.k)*W + accountant*1.5 + lawyer*1.7 + otherCosts + P_month*region.t*W*region.phi;

  // График
  const ctx = document.getElementById('chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Белая', 'Серая', 'Чёрная'],
      datasets: [{
        label: 'Стоимость схемы (₽/мес)',
        data: [C_white,C_grey,C_black],
        backgroundColor: ['#007aff','#ff9500','#ff3b30']
      }]
    }
  });

  // Аргументы
  const argList = document.getElementById("argumentsList");
  argList.innerHTML = '';
  argumentsData.forEach(a=>{
    const li = document.createElement("li");
    li.innerHTML = `<a href="${a.link}" target="_blank">${a.text}</a>`;
    argList.appendChild(li);
  });

  nextStep(4);
}

window.onload = loadData;