const DEFAULTS = {
  vatRate: 8,
  tndnRate: 20,
  cpqlRate: 9,
  hoaHongRate: 0.3,
  vonVay: 0,
  laiSuatNam: 0,
  qty: 100,
  giaMuaFull: 690000,
  giaBanFull: 700000,
};

const STORAGE_KEY = "autotax_v2_quoclong_final_inputs";
const BATCH_KEY = "autotax_v2_quoclong_final_batch";

const inputIds = [
  "vatRate",
  "tndnRate",
  "cpqlRate",
  "hoaHongRate",
  "vonVay",
  "laiSuatNam",
  "qty",
  "giaMuaFull",
  "giaBanFull",
];

function $(id) {
  return document.getElementById(id);
}

function getNumber(id) {
  const value = Number($(id).value);
  return Number.isFinite(value) ? value : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function formatPercent(value) {
  return `${(value || 0).toFixed(2)}%`;
}

function setText(id, value) {
  const el = $(id);
  el.textContent = formatNumber(value);
  el.classList.toggle("negative", value < 0);
}

function saveInputs(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  flashSaved();
}

function loadInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setInputs(values) {
  inputIds.forEach((id) => {
    if (values && values[id] !== undefined && values[id] !== null) {
      $(id).value = values[id];
    }
  });
}

let saveTimer = null;
function flashSaved() {
  const el = $("saveStatus");
  el.textContent = "Đã lưu tự động";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    el.textContent = "Đang dùng dữ liệu đã lưu";
  }, 1400);
}

function calcOneRow({ qty, giaMuaFull, giaBanFull, vatRate, tndnRate, cpqlRate, hoaHongRate, vonVay, laiSuatNam }) {
  const vat = vatRate / 100;
  const tndn = tndnRate / 100;
  const cpql = cpqlRate / 100;
  const hoaHong = hoaHongRate / 100;
  const lsNam = laiSuatNam / 100;

  const giaMuaChuaVAT = giaMuaFull / (1 + vat);
  const vatDauVao = giaMuaFull - giaMuaChuaVAT;

  const giaBanChuaVAT = giaBanFull / (1 + vat);
  const vatDauRa = giaBanFull - giaBanChuaVAT;

  const vatPhaiNopChiec = vatDauRa - vatDauVao;
  const cpqlChiec = giaBanFull * cpql;
  const hoaHongChiec = giaBanFull * hoaHong;

  // Lãi vay là chi phí chung cho cả lô
  const laiVayThang = vonVay * lsNam / 12;
  const laiVayPhanBo = qty > 0 ? laiVayThang / qty : 0;

  const lnTruocThueChiec =
    giaBanChuaVAT - giaMuaChuaVAT - cpqlChiec - hoaHongChiec - laiVayPhanBo;

  const thueTndnChiec = Math.max(0, lnTruocThueChiec) * tndn;
  const laiRongChiec = lnTruocThueChiec - thueTndnChiec;

  const doanhThuTong = giaBanChuaVAT * qty;
  const giaVonTong = giaMuaChuaVAT * qty;
  const cpqlTong = cpqlChiec * qty;
  const hoaHongTong = hoaHongChiec * qty;
  const laiVayTong = laiVayThang; // chi phí chung, không nhân qty

  const lnTruocThueTong =
    doanhThuTong - giaVonTong - cpqlTong - hoaHongTong - laiVayTong;

  const thueTndnTong = Math.max(0, lnTruocThueTong) * tndn;
  const laiRongTong = lnTruocThueTong - thueTndnTong;
  const vatPhaiNopTong = vatPhaiNopChiec * qty;

  const grossMargin = doanhThuTong ? (lnTruocThueTong / doanhThuTong) * 100 : 0;
  const netMargin = doanhThuTong ? (laiRongTong / doanhThuTong) * 100 : 0;

  return {
    giaMuaChuaVAT,
    vatDauVao,
    giaBanChuaVAT,
    vatDauRa,
    vatPhaiNopChiec,
    cpqlChiec,
    hoaHongChiec,
    laiVayThang,
    laiVayPhanBo,
    lnTruocThueChiec,
    thueTndnChiec,
    laiRongChiec,
    doanhThuTong,
    giaVonTong,
    cpqlTong,
    hoaHongTong,
    laiVayTong,
    lnTruocThueTong,
    thueTndnTong,
    laiRongTong,
    vatPhaiNopTong,
    grossMargin,
    netMargin,
  };
}

let currentMainResult = null;

function calculateMain() {
  const inputs = {
    vatRate: getNumber("vatRate"),
    tndnRate: getNumber("tndnRate"),
    cpqlRate: getNumber("cpqlRate"),
    hoaHongRate: getNumber("hoaHongRate"),
    vonVay: getNumber("vonVay"),
    laiSuatNam: getNumber("laiSuatNam"),
    qty: getNumber("qty"),
    giaMuaFull: getNumber("giaMuaFull"),
    giaBanFull: getNumber("giaBanFull"),
  };

  saveInputs(inputs);
  currentMainResult = calcOneRow(inputs);

  setText("giaMuaChuaVAT", currentMainResult.giaMuaChuaVAT);
  setText("vatDauVao", currentMainResult.vatDauVao);
  setText("giaBanChuaVAT", currentMainResult.giaBanChuaVAT);
  setText("vatDauRa", currentMainResult.vatDauRa);
  setText("vatPhaiNopChiec", currentMainResult.vatPhaiNopChiec);
  setText("lnTruocThueChiec", currentMainResult.lnTruocThueChiec);
  setText("thueTndnChiec", currentMainResult.thueTndnChiec);
  setText("laiRongChiec", currentMainResult.laiRongChiec);
  setText("cpqlChiec", currentMainResult.cpqlChiec);
  setText("hoaHongChiec", currentMainResult.hoaHongChiec);
  setText("laiVayChiec", currentMainResult.laiVayPhanBo);

  setText("doanhThuTong", currentMainResult.doanhThuTong);
  setText("giaVonTong", currentMainResult.giaVonTong);
  setText("lnTruocThueTong", currentMainResult.lnTruocThueTong);
  setText("thueTndnTong", currentMainResult.thueTndnTong);
  setText("laiRongTong", currentMainResult.laiRongTong);
  setText("vatPhaiNopTong", currentMainResult.vatPhaiNopTong);
  setText("laiVayTong", currentMainResult.laiVayTong);

  $("grossMargin").textContent = formatPercent(currentMainResult.grossMargin);
  $("netMargin").textContent = formatPercent(currentMainResult.netMargin);

  renderBatch();
}

function copyMainResult() {
  if (!currentMainResult) return;
  const inputs = {
    vatRate: getNumber("vatRate"),
    tndnRate: getNumber("tndnRate"),
    cpqlRate: getNumber("cpqlRate"),
    hoaHongRate: getNumber("hoaHongRate"),
    vonVay: getNumber("vonVay"),
    laiSuatNam: getNumber("laiSuatNam"),
    qty: getNumber("qty"),
    giaMuaFull: getNumber("giaMuaFull"),
    giaBanFull: getNumber("giaBanFull"),
  };

  const text = [
    "PHƯƠNG PHÁP TÍNH GIÁ - QUỐC LONG",
    "------------------------",
    `VAT rate: ${inputs.vatRate}%`,
    `TNDN rate: ${inputs.tndnRate}%`,
    `CPQL rate: ${inputs.cpqlRate}% doanh thu FULL VAT`,
    `Hoa hồng rate: ${inputs.hoaHongRate}%`,
    `Vốn vay: ${formatNumber(inputs.vonVay)}`,
    `Lãi suất năm: ${inputs.laiSuatNam}%`,
    `Lãi vay tháng (chi phí chung): ${formatNumber(currentMainResult.laiVayThang)}`,
    `Số lượng: ${formatNumber(inputs.qty)}`,
    `Giá mua FULL VAT: ${formatNumber(inputs.giaMuaFull)}`,
    `Giá bán FULL VAT: ${formatNumber(inputs.giaBanFull)}`,
    "",
    `Giá mua chưa VAT/chiếc: ${formatNumber(currentMainResult.giaMuaChuaVAT)}`,
    `Giá bán chưa VAT/chiếc: ${formatNumber(currentMainResult.giaBanChuaVAT)}`,
    `Chi phí quản lý/chiếc: ${formatNumber(currentMainResult.cpqlChiec)}`,
    `Hoa hồng/chiếc: ${formatNumber(currentMainResult.hoaHongChiec)}`,
    `Lãi vay phân bổ/chiếc: ${formatNumber(currentMainResult.laiVayPhanBo)}`,
    `VAT phải nộp/chiếc: ${formatNumber(currentMainResult.vatPhaiNopChiec)}`,
    `LN trước thuế/chiếc: ${formatNumber(currentMainResult.lnTruocThueChiec)}`,
    `Thuế TNDN/chiếc: ${formatNumber(currentMainResult.thueTndnChiec)}`,
    `Lãi ròng/chiếc: ${formatNumber(currentMainResult.laiRongChiec)}`,
    "",
    `Doanh thu chưa VAT (tổng): ${formatNumber(currentMainResult.doanhThuTong)}`,
    `Lãi vay tháng (chi phí chung): ${formatNumber(currentMainResult.laiVayTong)}`,
    `LN trước thuế (tổng): ${formatNumber(currentMainResult.lnTruocThueTong)}`,
    `Thuế TNDN (tổng): ${formatNumber(currentMainResult.thueTndnTong)}`,
    `Lãi ròng (tổng): ${formatNumber(currentMainResult.laiRongTong)}`,
    `VAT phải nộp (tổng): ${formatNumber(currentMainResult.vatPhaiNopTong)}`,
    `Biên lãi trước thuế: ${formatPercent(currentMainResult.grossMargin)}`,
    `Biên lãi ròng: ${formatPercent(currentMainResult.netMargin)}`,
  ].join("\n");

  navigator.clipboard.writeText(text).then(() => {
    const btn = $("btnCopyResult");
    const old = btn.textContent;
    btn.textContent = "Đã copy";
    setTimeout(() => (btn.textContent = old), 1300);
  });
}

function resetQuick() {
  setInputs(DEFAULTS);
  calculateMain();
}

function clearSaved() {
  localStorage.removeItem(STORAGE_KEY);
  resetQuick();
}

function loadBatchRows() {
  try {
    const raw = localStorage.getItem(BATCH_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return [
      { note: "Dòng 1", qty: 100, giaMuaFull: 690000, giaBanFull: 700000 },
      { note: "Dòng 2", qty: 50, giaMuaFull: 715000, giaBanFull: 739000 },
    ];
  } catch {
    return [{ note: "Dòng 1", qty: 100, giaMuaFull: 690000, giaBanFull: 700000 }];
  }
}

let batchRows = loadBatchRows();

function saveBatchRows() {
  localStorage.setItem(BATCH_KEY, JSON.stringify(batchRows));
}

function addBatchRow(row = null) {
  batchRows.push(
    row || {
      note: `Dòng ${batchRows.length + 1}`,
      qty: 1,
      giaMuaFull: 0,
      giaBanFull: 0,
    }
  );
  saveBatchRows();
  renderBatch();
}

function removeBatchRow(index) {
  batchRows.splice(index, 1);
  if (!batchRows.length) addBatchRow();
  saveBatchRows();
  renderBatch();
}

function clearBatch() {
  batchRows = [{ note: "Dòng 1", qty: 1, giaMuaFull: 0, giaBanFull: 0 }];
  saveBatchRows();
  renderBatch();
}

function renderBatch() {
  const body = $("batchBody");
  body.innerHTML = "";

  let totalDoanhThu = 0;
  let totalLNTT = 0;
  let totalTNDN = 0;
  let totalLaiRong = 0;
  let totalVAT = 0;

  const common = {
    vatRate: getNumber("vatRate"),
    tndnRate: getNumber("tndnRate"),
    cpqlRate: getNumber("cpqlRate"),
    hoaHongRate: getNumber("hoaHongRate"),
    vonVay: getNumber("vonVay"),
    laiSuatNam: getNumber("laiSuatNam"),
  };

  batchRows.forEach((row, index) => {
    const result = calcOneRow({
      ...common,
      qty: Number(row.qty) || 0,
      giaMuaFull: Number(row.giaMuaFull) || 0,
      giaBanFull: Number(row.giaBanFull) || 0,
    });

    totalDoanhThu += result.doanhThuTong;
    totalLNTT += result.lnTruocThueTong;
    totalTNDN += result.thueTndnTong;
    totalLaiRong += result.laiRongTong;
    totalVAT += result.vatPhaiNopTong;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="text" value="${escapeHtml(row.note || "")}" data-field="note" data-index="${index}" placeholder="Ví dụ: SP A" /></td>
      <td><input type="number" value="${row.qty}" data-field="qty" data-index="${index}" /></td>
      <td><input type="number" value="${row.giaMuaFull}" data-field="giaMuaFull" data-index="${index}" /></td>
      <td><input type="number" value="${row.giaBanFull}" data-field="giaBanFull" data-index="${index}" /></td>
      <td><div class="batch-result ${result.laiRongTong < 0 ? "negative" : ""}">${formatNumber(result.laiRongTong)}</div></td>
      <td><div class="batch-result ${result.vatPhaiNopTong < 0 ? "negative" : ""}">${formatNumber(result.vatPhaiNopTong)}</div></td>
      <td class="row-actions"><button class="icon-btn" type="button" data-remove="${index}">×</button></td>
    `;
    body.appendChild(tr);
  });

  saveBatchRows();

  setText("batchDoanhThu", totalDoanhThu);
  setText("batchLNTT", totalLNTT);
  setText("batchTNDN", totalTNDN);
  setText("batchLaiRong", totalLaiRong);
  setText("batchVAT", totalVAT);

  body.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const index = Number(e.target.dataset.index);
      const field = e.target.dataset.field;
      batchRows[index][field] = field === "note" ? e.target.value : Number(e.target.value || 0);
      saveBatchRows();
      renderBatch();
    });
  });

  body.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => removeBatchRow(Number(btn.dataset.remove)));
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildExportRows() {
  const common = {
    vatRate: getNumber("vatRate"),
    tndnRate: getNumber("tndnRate"),
    cpqlRate: getNumber("cpqlRate"),
    hoaHongRate: getNumber("hoaHongRate"),
    vonVay: getNumber("vonVay"),
    laiSuatNam: getNumber("laiSuatNam"),
  };

  return batchRows.map((row) => {
    const result = calcOneRow({
      ...common,
      qty: Number(row.qty) || 0,
      giaMuaFull: Number(row.giaMuaFull) || 0,
      giaBanFull: Number(row.giaBanFull) || 0,
    });

    return {
      "Mã / Ghi chú": row.note || "",
      "Số lượng": row.qty || 0,
      "Giá mua FULL VAT": row.giaMuaFull || 0,
      "Giá bán FULL VAT": row.giaBanFull || 0,
      "Giá mua chưa VAT": Math.round(result.giaMuaChuaVAT),
      "Giá bán chưa VAT": Math.round(result.giaBanChuaVAT),
      "Chi phí quản lý / chiếc": Math.round(result.cpqlChiec),
      "Hoa hồng / chiếc": Math.round(result.hoaHongChiec),
      "Lãi vay phân bổ / chiếc": Math.round(result.laiVayPhanBo),
      "Lãi vay tháng / lô": Math.round(result.laiVayTong),
      "VAT phải nộp / chiếc": Math.round(result.vatPhaiNopChiec),
      "LN trước thuế / chiếc": Math.round(result.lnTruocThueChiec),
      "Thuế TNDN / chiếc": Math.round(result.thueTndnChiec),
      "Lãi ròng / chiếc": Math.round(result.laiRongChiec),
      "Doanh thu chưa VAT (tổng)": Math.round(result.doanhThuTong),
      "LN trước thuế (tổng)": Math.round(result.lnTruocThueTong),
      "Thuế TNDN (tổng)": Math.round(result.thueTndnTong),
      "Lãi ròng (tổng)": Math.round(result.laiRongTong),
      "VAT phải nộp (tổng)": Math.round(result.vatPhaiNopTong),
    };
  });
}

function exportExcel() {
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet([
    {
      "Tiêu đề": "Phương Pháp Tính Giá - Quốc Long",
      "VAT rate (%)": getNumber("vatRate"),
      "TNDN rate (%)": getNumber("tndnRate"),
      "CPQL rate (%)": getNumber("cpqlRate"),
      "Hoa hồng (%)": getNumber("hoaHongRate"),
      "Vốn vay": getNumber("vonVay"),
      "Lãi suất năm (%)": getNumber("laiSuatNam"),
      "Lãi vay tháng / lô": Math.round(currentMainResult?.laiVayTong || 0),
      "Qty": getNumber("qty"),
      "Giá mua FULL VAT": getNumber("giaMuaFull"),
      "Giá bán FULL VAT": getNumber("giaBanFull"),
      "Lãi ròng tổng": Math.round(currentMainResult?.laiRongTong || 0),
      "VAT phải nộp tổng": Math.round(currentMainResult?.vatPhaiNopTong || 0),
    },
  ]);

  const batchSheet = XLSX.utils.json_to_sheet(buildExportRows());

  XLSX.utils.book_append_sheet(wb, summarySheet, "Main");
  XLSX.utils.book_append_sheet(wb, batchSheet, "Batch");

  XLSX.writeFile(wb, "Phuong-Phap-Tinh-Gia-Quoc-Long-v2-final.xlsx");
}

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

  let y = 40;
  const lh = 20;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Phuong Phap Tinh Gia - Quoc Long", 40, y);
  y += 28;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const inputs = [
    `VAT: ${getNumber("vatRate")}%`,
    `TNDN: ${getNumber("tndnRate")}%`,
    `CPQL: ${getNumber("cpqlRate")}% doanh thu FULL VAT`,
    `Hoa hong: ${getNumber("hoaHongRate")}%`,
    `Von vay: ${formatNumber(getNumber("vonVay"))}`,
    `Lai suat nam: ${getNumber("laiSuatNam")}%`,
    `Lai vay thang / lo: ${formatNumber(currentMainResult?.laiVayTong || 0)}`,
    `Qty: ${formatNumber(getNumber("qty"))}`,
    `Gia mua FULL VAT: ${formatNumber(getNumber("giaMuaFull"))}`,
    `Gia ban FULL VAT: ${formatNumber(getNumber("giaBanFull"))}`,
  ];
  inputs.forEach((line) => {
    pdf.text(line, 40, y);
    y += lh;
  });

  y += 8;
  pdf.setFont("helvetica", "bold");
  pdf.text("Ket qua main", 40, y);
  y += lh;
  pdf.setFont("helvetica", "normal");

  const mainLines = [
    ["Gia mua chua VAT / chiec", currentMainResult?.giaMuaChuaVAT],
    ["Gia ban chua VAT / chiec", currentMainResult?.giaBanChuaVAT],
    ["Chi phi quan ly / chiec", currentMainResult?.cpqlChiec],
    ["Hoa hong / chiec", currentMainResult?.hoaHongChiec],
    ["Lai vay phan bo / chiec", currentMainResult?.laiVayPhanBo],
    ["Lai vay thang / lo", currentMainResult?.laiVayTong],
    ["VAT phai nop / chiec", currentMainResult?.vatPhaiNopChiec],
    ["LN truoc thue / chiec", currentMainResult?.lnTruocThueChiec],
    ["Thue TNDN / chiec", currentMainResult?.thueTndnChiec],
    ["Lai rong / chiec", currentMainResult?.laiRongChiec],
    ["Doanh thu chua VAT (tong)", currentMainResult?.doanhThuTong],
    ["LN truoc thue (tong)", currentMainResult?.lnTruocThueTong],
    ["Thue TNDN (tong)", currentMainResult?.thueTndnTong],
    ["Lai rong (tong)", currentMainResult?.laiRongTong],
    ["VAT phai nop (tong)", currentMainResult?.vatPhaiNopTong],
  ];

  mainLines.forEach(([label, value]) => {
    pdf.text(`${label}: ${formatNumber(value || 0)}`, 40, y);
    y += lh;
  });

  y += 8;
  pdf.setFont("helvetica", "bold");
  pdf.text("Batch tom tat", 40, y);
  y += lh;
  pdf.setFont("helvetica", "normal");

  buildExportRows().forEach((row, idx) => {
    if (y > 760) {
      pdf.addPage();
      y = 40;
    }
    pdf.text(
      `${idx + 1}. ${row["Mã / Ghi chú"]} | Qty ${formatNumber(row["Số lượng"])} | Lai rong ${formatNumber(row["Lãi ròng (tổng)"])} | VAT ${formatNumber(row["VAT phải nộp (tổng)"])}`,
      40,
      y
    );
    y += lh;
  });

  pdf.save("Phuong-Phap-Tinh-Gia-Quoc-Long-v2-final.pdf");
}

inputIds.forEach((id) => $(id).addEventListener("input", calculateMain));

$("btnDemo").addEventListener("click", () => {
  setInputs(DEFAULTS);
  calculateMain();
});

$("btnResetQuick").addEventListener("click", resetQuick);
$("btnClearSaved").addEventListener("click", clearSaved);
$("btnCopyResult").addEventListener("click", copyMainResult);
$("btnExportExcel").addEventListener("click", exportExcel);
$("btnExportPDF").addEventListener("click", exportPDF);
$("btnAddRow").addEventListener("click", () => addBatchRow());
$("btnClearBatch").addEventListener("click", clearBatch);

setInputs(loadInputs() || DEFAULTS);
calculateMain();
