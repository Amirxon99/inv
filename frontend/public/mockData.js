
const orgs = [
  "Toshkent shahar qurilish boshqarmasi",
  "Qashqadaryo viloyati avtomobil yo'llari boshqarmasi",
  "Samarqand viloyati prokuraturasi",
  "Buxoro viloyati iqtisodiy I",
  "Xorazm viloyati ta'lim boshqarmasi",
];
const managers = ["E. M. Borisova", "X. A. Xo'jamqulov", "G. B. Xudoyorova", "N. X. Jumaev", "U. I. Inoyatov"];
const executors = ["E. M. Borisova", "X. A. Xo'jamqulov", "G. B. Xudoyorova", "N. X. Jumaev", "U. I. Inoyatov"];
const statuses = ["Jarayonda", "Bajarilgan", "Rad etilgan"];

function randomDate(startYear = 2024, endYear = 2025, idx = 0) {
 
  const year = startYear + Math.floor((idx % (endYear - startYear + 1)));
  const month = (idx % 12) + 1;
  const day = ((idx % 28) + 1);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const mockData = Array.from({ length: 150 }, (_, i) => {
  const org = orgs[i % orgs.length];
  const manager = managers[i % managers.length];
  const executor = executors[(i + 1) % executors.length];
  const status = statuses[i % statuses.length];

  return {
    id: i + 1,
    number: `2024-mb-${i + 1}`,
    date: randomDate(2024, 2025, i),
    organization: org,
    outNumber: `${String(1000 + i)}-${(i % 30) + 1}`,
    summary: `Hujjatning qisqacha mazmuni №${i + 1}.`,
    manager,
    executor,
    deadline: randomDate(2025, 2025, i % 365),
    status,
    statusClass: status === "Bajarilgan" ? "done" : status === "Jarayonda" ? "progress" : "rejected",
  };
});

export default mockData;
