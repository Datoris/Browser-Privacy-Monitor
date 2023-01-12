const initScript = document.currentScript;
initScript.onload = function () { this.remove(); }
const origin = DOMAIN;
// __webpack_public_path__ = `${origin}/embed/`;
const root = document.createElement("div");
initScript.parentNode.insertBefore(root, initScript.nextSibling);

fetch(`${origin}/embedded/report/${initScript.id}`)
.then(response => response.json())
.then(({ payload: report }) => {
    root.id = `datoris-${report.id}_${Math.max(-1, ...[...document.querySelectorAll(`[id^=datoris-${report.id}]`)].map(({ id }) => id.split("_")[1])) + 1}`;
    const visualizationType = (report.reportOptions.find(({ optionTypeId }) => optionTypeId === 1) || { optionValue: "table" }).optionValue;
    const embedScript = document.createElement("script");
    embedScript.onload = function () { this.remove(); }
    embedScript.$origin = origin;
    embedScript.$report = report;
    embedScript.src = `charts/datoris_${visualizationType}.js`;
    embedScript.type ="application/javascript";
    root.parentNode.insertBefore(embedScript, root.nextElementSibling);
});