const fileInput = document.getElementById("videoFile");
const previewWrap = document.getElementById("previewWrap");
const videoPreview = document.getElementById("videoPreview");
const fileName = document.getElementById("fileName");
const fileMeta = document.getElementById("fileMeta");
const prepareButton = document.getElementById("prepareButton");
const briefCard = document.getElementById("briefCard");
const briefDetails = document.getElementById("briefDetails");
let selectedFile = null;
let previewUrl = null;

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("video/")) {
    alert("Escolha um arquivo de vídeo.");
    fileInput.value = "";
    return;
  }
  selectedFile = file;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  videoPreview.src = previewUrl;
  previewWrap.hidden = false;
  fileName.textContent = file.name;
  fileMeta.textContent = formatSize(file.size) + " • Pré-visualização local";
  briefCard.hidden = true;
});

prepareButton.addEventListener("click", () => {
  const instruction = document.getElementById("instruction").value.trim();
  if (!selectedFile) {
    alert("Primeiro escolha um vídeo do seu celular.");
    return;
  }
  if (!instruction) {
    alert("Escreva o que você quer mudar no vídeo.");
    document.getElementById("instruction").focus();
    return;
  }
  const formatSelect = document.getElementById("format");
  const approvalSelect = document.getElementById("approval");
  const formatLabel = formatSelect.options[formatSelect.selectedIndex].text;
  const approvalLabel = approvalSelect.value === "yes"
    ? "Você aprova o plano antes da renderização"
    : "Execução automática (quando disponível)";

  const rows = [
    ["Arquivo", selectedFile.name + " (" + formatSize(selectedFile.size) + ")"],
    ["Formato de saída", formatLabel],
    ["Modo de trabalho", approvalLabel],
    ["Instruções", instruction]
  ];
  briefDetails.replaceChildren();
  rows.forEach(([label, value]) => {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    wrapper.append(term, description);
    briefDetails.append(wrapper);
  });
  briefCard.hidden = false;
  briefCard.scrollIntoView({ behavior: "smooth", block: "start" });
});

window.addEventListener("beforeunload", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});
