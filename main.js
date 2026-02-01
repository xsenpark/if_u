const list = document.getElementById("list");
const empty = document.getElementById("empty");
const searchInput = document.getElementById("search");
const deptSelect = document.getElementById("dept");
const typeSelect = document.getElementById("type");
const yearSelect = document.getElementById("year");

let data = [];

const parseCsvLine = (line) => {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  out.push(current);
  return out.map((value) => value.trim());
};

const loadCsv = async () => {
  const response = await fetch("/data.csv");
  if (!response.ok) {
    throw new Error("데이터 파일을 불러오지 못했습니다.");
  }
  const text = await response.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] ?? "";
    });
    return item;
  });
};

const unique = (items, key) =>
  Array.from(new Set(items.map((item) => item[key]).filter(Boolean))).sort();

const populateSelect = (select, values) => {
  select.innerHTML = '<option value="">전체</option>';
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
};

const TYPE_ORDER = ["과제", "퀴즈", "중간고사", "기말고사"];

const orderTypes = (items) => {
  const seen = new Set(items);
  return TYPE_ORDER.filter((type) => seen.has(type));
};

const normalizeTitle = (value) => {
  if (!value) return "";
  const blacklist = [
    "공개",
    "기출",
    "문제",
    "연습문제",
    "모음",
    "안내",
    "과제",
    "퀴즈",
    "중간고사",
    "기말고사",
    "중간",
    "기말",
  ];
  let result = String(value);
  blacklist.forEach((word) => {
    result = result.replaceAll(word, "");
  });
  return result.replace(/\s+/g, " " ).trim();
};

const populateYearSelect = (startYear) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= startYear; year -= 1) {
    years.push(String(year));
  }
  populateSelect(yearSelect, years);
};

const render = (items) => {
  list.innerHTML = "";
  if (items.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = normalizeTitle(item.title) || item.title;

    const badges = document.createElement("div");
    badges.className = "badges";

    const type = document.createElement("span");
    type.className = "badge";
    type.textContent = item.type;

    const year = document.createElement("span");
    year.className = "badge badge-muted";
    year.textContent = `${item.year}`;

    const instructor = document.createElement("span");
    instructor.className = "badge badge-muted";
    instructor.textContent = `${item.instructor}`;

    badges.append(type, year, instructor);

    card.append(title, badges);
    list.appendChild(card);
  });
};

const filter = () => {
  const keyword = searchInput.value.trim().toLowerCase();
  const dept = deptSelect.value;
  const type = typeSelect.value;
  const year = yearSelect.value;

  const filtered = data.filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.title.toLowerCase().includes(keyword) ||
      item.instructor.toLowerCase().includes(keyword) ||
      item.summary.toLowerCase().includes(keyword);
    const matchesDept = !dept || item.department === dept;
    const matchesType = !type || item.type === type;
    const matchesYear = !year || item.year === year;

    return matchesKeyword && matchesDept && matchesType && matchesYear;
  });

  render(filtered);
};

[searchInput, deptSelect, typeSelect, yearSelect].forEach((el) => {
  el.addEventListener("input", filter);
  el.addEventListener("change", filter);
});

loadCsv()
  .then((rows) => {
    data = rows;
    populateSelect(deptSelect, unique(data, "department"));
    populateSelect(typeSelect, orderTypes(unique(data, "type")));
    populateYearSelect(2010);
    render(data);
  })
  .catch((error) => {
    empty.style.display = "block";
    empty.textContent = error.message;
  });
