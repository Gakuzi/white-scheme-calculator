let currentStep = 1;
let regions = [];
let argumentsData = [];

function nextStep(step) {
  document.getElementById("step"+currentStep).style.display = "none";
  document.getElementById("step"+step).style.display = "block";
  currentStep = step;
}

function prevStep(step) {
  document.getElementById("step"+currentStep).style.display = "none";
  document.getElementById("step"+step).style.display = "block";
  currentStep = step;
}

async function loadData() {
  regions = await fetch('regions.json').then(r=>r.json());
  argumentsData = await fetch('arguments.json').then(r=>r.json());
  const select = document.getElementById("regionSelect");
  regions.forEach(r=>{
    const option = document.createElement("option");
    option.value = r.region_code;
    option.text = r.region_name;
    if(r.region_name === "Архангельская область") option.selected = true;
    select.add(option);
  });
}

function calculate() {
  const salary = parseFloat(document.getElementById("salary").value);
  const numEmployees = parseInt(document.getElementById("numEmployees").value);
  const accountant = parseFloat(document.getElementById("accountant").value);
  const lawyer = parseFloat(document.getElementById("lawyer").value);

  const riskTech = parseFloat(document.getElementById("riskTech").value);
  const riskSalary = parseFloat(document.getElementById("riskSalary").value);
  const riskCash = parseFloat(document.getElementById("riskCash").value);

  const avgRisk = (riskTech + riskSalary + riskCash)/3;
  const P = avgRisk*0.3/36;

  const G = salary / 0.87; // пример
  const G_min = 19242 * 1.2 * (1+0.5);
  const W_min = G_min * 0.87;
  const E = salary - W_min;

  const C_white = G + accountant + lawyer;
  const C_grey = G_min + E + accountant + lawyer + P*E*1.2;
  const C_black = salary + accountant + lawyer + P*salary*1.2;

  // Chart
  const ctx = document.getElementById('chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Белая','Серая','Чёрная'],
      datasets: [{
        label: 'Месячная стоимость',
        data: [C_white, C_grey, C_black],
        backgroundColor: ['#34C759','#FF9500','#FF3B30']
      }]
    }
  });

  // Arguments
  const list = document.getElementById("argumentsList");
  list.innerHTML = '';
  argumentsData.forEach(arg=>{
    const li = document.createElement("li");
    li.innerHTML = `<strong>${arg.title}:</strong> ${arg.description} <a href="${arg.source}" target="_blank">Источник</a>`;
    list.appendChild(li);
  });

  nextStep(4);
}

window.onload = loadData;