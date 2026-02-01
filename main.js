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
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <span>학과: ${item.department}</span>
      <span>교수: ${item.instructor}</span>
      <span>연도: ${item.year}</span>
      <span>출처: ${item.source}</span>
    `;

    const badges = document.createElement("div");
    badges.className = "badges";

    const type = document.createElement("span");
    type.className = "badge";
    type.textContent = item.type;

    badges.appendChild(type);

    const summary = document.createElement("p");
    summary.textContent = item.summary;

    const link = document.createElement("a");
    link.href = item.link || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "공식 자료 열기";

    card.append(title, meta, badges, summary, link);
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
    populateSelect(typeSelect, unique(data, "type"));
    populateSelect(yearSelect, unique(data, "year").sort((a, b) => b.localeCompare(a)));
    render(data);
  })
  .catch((error) => {
    empty.style.display = "block";
    empty.textContent = error.message;
  });
