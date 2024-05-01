const queryWords = {
  expense: [
    { find: "d", key: "อาหาร" },
    { find: "t", key: "เดินทาง" },
    { find: "b", key: "หนังสือ" },
    { find: "h", key: "ช็อปปิ้ง" },
    { find: "c", key: "cloud" },
    { find: "l", key: "ที่พัก" },
    { find: "w", key: "ส่งส่วย" },
    { find: "q", key: "ที่บ้าน" },
    { find: "f", key: "กองทุน" },
    { find: "s", key: "หุ้น" },
    { find: "g", key: "ทอง" },
    { find: "o", key: "อื่นๆ" },
  ],
  income: [
    { find: "im", key: "เงินเดือน" },
    { find: "ib", key: "โบนัส" },
    { find: "ir", key: "ของขวัญ" },
    { find: "if", key: "กองทุน" },
    { find: "is", key: "หุ้น" },
    { find: "ig", key: "ทอง" },
  ],
};

const sel_year = document.querySelector("#sel_year");
const sel_month = document.querySelector("#sel_month");
const sel_type = document.querySelector("#sel_type");
const sel_cat = document.querySelector("#sel_cat");

const label_year = document.querySelector("#label_year");

const data = [];

// #region : login page

const page_loading = document.querySelector("#page_loading");
const page_login = document.querySelector("#page_login");
const page_data = document.querySelector("#page_data");
const input_username = document.querySelector("#username");
const input_password = document.querySelector("#password");
const rememberMe = document.querySelector("#rememberMe");
const btn_login = document.querySelector("#btn_login");
const passwordAlert = document.querySelector("#passwordAlert");

const url =
  "https://script.google.com/macros/s/AKfycbzlqKDIK1tH38Dzx4D0qlm32rxZt57hRomKmw4mMUbxXd4s87cgCROk4nRqf5tjRip_/exec";

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedPassword = hashArray.map((byte) => String.fromCharCode(byte)).join("");
  return btoa(hashedPassword);
}

// auto login
if (localStorage.getItem("username") != "") login();

btn_login.addEventListener("click", async () => {
  login();
});
async function login() {
  const username = input_username.value.trim();
  // const password = await hashPassword(input_password.value);
  const password = input_password.value;
  const saved_username = localStorage.getItem("username");
  const saved_password = localStorage.getItem("password");

  if (username == "" && saved_username == "") return;

  const data = {
    username: username || saved_username,
    password: username ? password : saved_password,
  };

  if (username && rememberMe.checked) {
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
  }

  console.log(data);
  page_loading.style.display = "flex";

  fetch(url, {
    redirect: "follow",
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-type": "text/plain;charset=utf-8",
    },
  })
    .then((response) => response.text())
    .then((json) => {
      const output = JSON.parse(json);
      page_loading.style.display = "none";
      console.log(output);
      if (output.status == "failed") {
        passwordAlert.style.display = "flex";
      } else if (output.status == "success") {
        passwordAlert.style.display = "none";
        fetchGoogleSheet(output.output);
        page_login.style.display = "none";
        page_data.style.display = "block";
      }
    });
}

// toggle password
document.querySelectorAll(".password-toggle-icon").forEach((el) => {
  el.addEventListener("click", (e) => {
    el.parentNode.querySelector("input").type = el.textContent == "visibility" ? "text" : "password";
    el.textContent = el.textContent == "visibility" ? "visibility_off" : "visibility";
  });
});

// #endregion

// wait for reply TODO:
const fetchGoogleSheet = (SHEET_ID) => {
  // let SHEET_ID = "1airNMRq7M7NusUwce1iHdOStXRnmRnQ5tDDcX0HiAdE";
  let SHEET_TITLE = "database";

  let FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}`;

  fetch(FULL_URL)
    .then((res) => res.text())
    .then((rep) => {
      let rawdata = JSON.parse(rep.substr(47).slice(0, -2));
      let outputdata = rawdata.table.rows;

      // dataArray
      var rowKey = ["time", "date", "type", "category", "value", "note"];
      for (let i = 1; i < rawdata.table.rows.length; i++) {
        var rowData = {};
        for (let j = 0; j < rowKey.length; j++) {
          var parseObj = outputdata[i].c[j];
          var parseData = parseObj == null ? "" : parseObj.v;
          parseData = parseData == null ? "" : parseData;
          if (rowKey[j] == "date") {
            const dateArray = parseData
              .replaceAll("Date(", "")
              .replaceAll(")", "")
              .split(",")
              .map((el) => Number(el));
            rowData["date"] = dateArray;
          } else rowData[rowKey[j]] = parseData;
        }
        data.push(rowData);
      }

      gen_year();
      remain();
      chart_year();
      chart_month();
      chart_category();
    })
    .catch((error) => {
      console.log("fetch google sheet fail");
    });
};
// fetchGoogleSheet();

// gen month + year
const monthTxt_dict = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthNum_dict = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};
function gen_month() {
  const month = [];
  data.forEach((el) => {
    const dateMonth = el.date[1];
    if (!month.includes(dateMonth)) month.push(dateMonth);
  });
  sel_month.innerHTML = "";
  month.forEach((el) => {
    sel_month.innerHTML += `<option>${monthTxt_dict[el]}</option>`;
  });
}
function gen_year() {
  const year = [];
  data.forEach((el) => {
    const dateYear = el.date[0];
    if (!year.includes(dateYear)) year.push(dateYear);
  });

  // gen year
  year.forEach((el) => {
    sel_year.innerHTML += `<option>${el}</option>`;
  });

  // gen month
  gen_month();
}

// gen category list
function gen_category() {
  sel_cat.innerHTML = "";
  switch (sel_type.value) {
    case "income":
      sel_cat.innerHTML += `<option>all</option>`;
      [...queryWords.income].forEach((el) => (sel_cat.innerHTML += `<option>${el.key}</option>`));
      break;
    case "expense":
      sel_cat.innerHTML += `<option>all</option>`;
      [...queryWords.expense].forEach((el) => (sel_cat.innerHTML += `<option>${el.key}</option>`));
      break;
    case "both":
      sel_cat.innerHTML += `<option>all</option><optgroup label="income">`;
      [...queryWords.income].forEach((el) => (sel_cat.innerHTML += `<option>${el.key}</option>`));
      sel_cat.innerHTML += `</optgroup><optgroup label="expense">`;
      [...queryWords.expense].forEach((el) => (sel_cat.innerHTML += `<option>${el.key}</option>`));
      sel_cat.innerHTML += `</optgroup>`;
      break;
  }
}
gen_category();

sel_year.addEventListener("input", () => {
  chart_year();
  chart_month();
  chart_category();
});
sel_month.addEventListener("input", () => {
  chart_month();
  chart_category();
});
sel_type.addEventListener("input", () => {
  gen_category();
  chart_month();
  chart_category();
});
sel_cat.addEventListener("input", () => {
  chart_category();
});

function remain() {
  var remain = 0;
  data.forEach((el) => (remain += el.value * (el.type == "expense" ? -1 : 1)));
  document.querySelector("#balance").textContent = `฿ ${remain.toLocaleString()}`;
  document.querySelector("#balance").style.color = remain >= 0 ? "#fff" : "#fb8072";
}

var chartObj_year;
const incomeArray = [];
const expenseArray = [];
function chart_year() {
  // calculate data
  const array = {};
  for (let i = 0; i < data.length; i++) {
    const month = data[i].date[1];
    const plus = data[i].type == "income" ? true : false;
    const value = data[i].value;

    // get only data from select year
    if (data[i].date[0] != sel_year.value) continue;

    if (!array[month]) array[month] = { month: month, income: 0, expense: 0 };

    if (plus) array[month].income += value;
    else array[month].expense += value;
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthArray = [];

  for (let month in array) {
    monthArray.push(monthNames[month]);
    incomeArray.push(array[month].income);
    expenseArray.push(array[month].expense);
  }

  const totals = incomeArray.map((income, index) => income + expenseArray[index]);
  const incomePerc = incomeArray.map((income, index) => (income / totals[index]) * 100);
  const expensePerc = expenseArray.map((expense, index) => (expense / totals[index]) * 100);

  // show data
  const chart_year = {
    type: "bar",
    data: {
      labels: monthArray,
      datasets: [
        {
          label: "Income",
          data: incomePerc,
          borderWidth: 2,
          borderColor: "#1a1a1a",
          backgroundColor: "#8dd3c7",
        },
        {
          label: "Expense",
          data: expensePerc,
          borderWidth: 2,
          borderColor: "#1a1a1a",
          backgroundColor: "#fb8072",
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const dataset = context.dataset.label == "Income" ? incomeArray : expenseArray;
              var label = context.dataset.label || "";
              if (label) label += ` : ฿ ${dataset[context.dataIndex].toLocaleString()}`;
              return label;
            },
          },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          stacked: true,
        },
        y: {
          display: false,
          stacked: true,
        },
      },
      barPercentage: 1,
    },
  };

  if (chartObj_year) chartObj_year.destroy();
  chartObj_year = new Chart(document.querySelector("#chart_year"), chart_year);
}

var chartObj_month;
function chart_month() {
  // update data
  const month_fullname = [
    ["Jan", "Janurary"],
    ["Feb", "Feburary"],
    ["Mar", "March"],
    ["Apr", "April"],
    ["May", "May"],
    ["Jun", "June"],
    ["Jul", "July"],
    ["Aug", "August"],
    ["Sep", "September"],
    ["Oct", "October"],
    ["Nov", "November"],
    ["Dec", "December"],
  ];

  for (let i = 0; i < month_fullname.length; i++) {
    if (sel_month.value == month_fullname[i][0]) {
      label_year.textContent = month_fullname[i][1];
      break;
    }
  }

  const getmonth = monthNum_dict[sel_month.value];

  // calculate data
  const array = {};
  for (let i = 0; i < data.length; i++) {
    const month = data[i].date[1];
    const plus = data[i].type == "income" ? true : false;
    const category = data[i].category;
    const value = data[i].value;

    if (data[i].date[0] != sel_year.value) continue;
    if (month != getmonth) continue;
    if (sel_type.value != "both" && plus != (sel_type.value == "income")) continue;

    if (!array[category]) array[category] = plus ? value : -value;
    else array[category] += plus ? value : -value;
  }

  // show data
  const chart_month = {
    type: "pie",
    data: {
      labels: Object.keys(array),
      datasets: [
        {
          label: "",
          data: Object.values(array),
          borderWidth: 2,
          borderColor: "#1a1a1a",
          backgroundColor: ["#fb8072", "#fccdd5", "#fdb462", "#ffffb3", "#bbe27a", "#8dd3c7", "#62d9a1"],
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || "";
              const value = context.raw.toLocaleString();
              if (label) return `${label}: ฿ ${value}`;
              return ` ฿ ${value}`;
            },
          },
        },
        legend: {
          display: false,
        },
      },
    },
  };

  if (chartObj_month) chartObj_month.destroy();
  chartObj_month = new Chart(document.querySelector("#chart_month"), chart_month);
}

var chartObj_category;
function chart_category() {
  const getmonth = monthNum_dict[sel_month.value];

  // calculate data

  // each month
  const array = {};
  for (let i = 0; i < data.length; i++) {
    const month = data[i].date[1];
    const plus = data[i].type == "income" ? true : false;
    const category = data[i].category;
    const value = data[i].value;

    if (data[i].date[0] != sel_year.value) continue;
    if (month != getmonth) continue;
    if (sel_cat.value != category && sel_cat.value != "all") continue;

    if (sel_type.value != "both" && plus != (sel_type.value == "income")) continue;

    if (!array[category]) array[category] = plus ? value : -value;
    else array[category] += plus ? value : -value;
  }

  // each year
  const yearArray = {};
  for (let i = 0; i < data.length; i++) {
    const mo = data[i].date[1];
    const plus = data[i].type == "income" ? true : false;
    const category = data[i].category;
    var value = plus ? data[i].value : -data[i].value;

    if (data[i].date[0] != sel_year.value) continue;
    if (sel_cat.value != category && sel_cat.value != "all") continue;
    if (sel_type.value != "both" && plus != (sel_type.value == "income")) continue;

    if (!yearArray.hasOwnProperty(mo)) yearArray[mo] = { month: mo, categories: {} };
    if (!yearArray[mo].categories.hasOwnProperty(category)) yearArray[mo].categories[category] = value;
    else yearArray[mo].categories[category] += value;
  }

  const colorArray = [
    "#fccdd5",
    "#8dd3c7",
    "#88e5b9",
    "#ffffb3",
    "#fb8072",
    "#9ea6d9",
    "#96bfd6",
    "#bbe27a",
    "#fdb462",
    "#fca7a4",
  ];
  const monthArray = [];
  const categoriesArray = [];
  for (let el of Object.values(yearArray)) {
    monthArray.push(monthTxt_dict[el.month]);
    categoriesArray.push(el.categories);
  }

  const rawResult = [];
  const result = Object.keys(
    categoriesArray.reduce((acc, obj) => {
      Object.keys(obj).forEach((key) => (acc[key] = (acc[key] || []).concat(obj[key])));
      return acc;
    }, {})
  ).map((key, index) => {
    const rawData = categoriesArray.map((obj) => obj[key] || 0);
    rawResult.push({ label: key, data: rawData });
    const logTransform = (value) => {
      if (value > 0) {
        return Math.log(value);
      } else if (value < 0) {
        return -Math.log(Math.abs(value));
      } else {
        return 0;
      }
    };
    return {
      label: key,
      data: rawData.map((value) =>
        sel_type.value == "expense" ? Math.abs(logTransform(value)) : logTransform(value) || 0
      ),
      order: 2,
      backgroundColor: colorArray[index],
    };
  });

  if (sel_cat.value == "all") {
    result.push(
      {
        label: "Income",
        data: incomeArray.map((el) => (el != 0 ? Math.log(el) : 0)),
        type: "line",
        order: 1,
        borderColor: "#62d9a1",
        tension: 0.5,
        borderDash: [24, 8, 16, 8, 8, 8, 16, 8],
        borderCapStyle: "round",
      },
      {
        label: "Expense",
        data: expenseArray.map((el) => (el != 0 ? Math.log(el) : 0)),
        type: "line",
        order: 1,
        borderColor: "#ff4949",
        tension: 0.5,
        borderDash: [24, 8, 16, 8, 8, 8, 16, 8],
        borderCapStyle: "round",
      }
    );
  }

  // show data
  const chart_category = {
    type: "bar",
    data: {
      datasets: result,
      labels: monthArray,
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || "";
              var value;
              for (el of rawResult) {
                if (el.label != context.dataset.label) continue;
                value = Math.abs(el.data[context.dataIndex]).toLocaleString();
              }
              if (label == "Expense" || label == "Income")
                value =
                  label == "Expense"
                    ? expenseArray[context.dataIndex].toLocaleString()
                    : incomeArray[context.dataIndex].toLocaleString();

              if (label) return `${label}: ฿ ${value}`;
              return ` ฿ ${value}`;
            },
          },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          display: false,
        },
      },
    },
    plugins: [
      {
        afterDraw: function (chart, easing) {
          var maxCount = 0;
          chart.data.labels.forEach((label, index) => {
            var stackCount = chart.data.datasets.reduce((total, dataset) => {
              if (dataset.data[index] !== 0) {
                total++;
              }
              return total;
            }, 0);
            maxCount = Math.max(maxCount, stackCount);
          });
          document.querySelector(".chart-container.scroll").style.width = maxCount > 5 ? "150vw" : "78vw";
        },
      },
    ],
  };

  if (chartObj_category) chartObj_category.destroy();
  chartObj_category = new Chart(document.querySelector("#chart_category"), chart_category);
}

const chartScroll = document.querySelector(".chart-scroll");
chartScroll.addEventListener("wheel", (e) => {
  chartScroll.scrollLeft = chartScroll.scrollLeft + e.deltaY * 0.8;
});
