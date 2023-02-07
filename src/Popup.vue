<template>
  <div>
    <div v-if="reports.length">
      <script
        v-for="report in reports"
        :key="report.id"
        type="application/javascript"
        src="chart.js"
        :id="report.id"
        fn="unpack_decrypt"
      ></script>
    </div>
  </div>
</template>


<script>
function sourceFieldToReportField ({ field: { aggregate, dataType, id, format, formula, name, sort }, chartColumn }, position) {
  return {
    aggregate,
    chartColumn,
    dataType: "TEXT",
    fieldId: id,
    format: null,
    formula,
    name,
    position,
    sort
  }
}

async function generateKey() {
  return window.crypto.subtle.generateKey({
    name: "AES-GCM",
    length: 256,
  }, true, ["encrypt", "decrypt"]);
}


// initialization vector for encryption
const iv = window.crypto.getRandomValues(new Uint8Array(12));

// encryption function using AES specification with Galois/Counter mode
async function encrypt(data, key) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  const cipher = await window.crypto.subtle.encrypt({
    name: "AES-GCM",
    iv
  }, key, encoded);
  return cipher;
}

async function decrypt(cipher, key, iv) {
  if (cipher.byteLength) {
    const decoder = new TextDecoder();
    try {
      const encoded = await window.crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: iv,
      }, key, cipher);
      return decoder.decode(encoded);
    } catch (err) {};
  }
  return "";
}

// packing function for transforming the ArrayBuffer type ciphertext returned by encryption into base64 string
function pack(buffer) {
  return window.btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

function unpack(packed) {
  const string = window.atob(packed);
  const buffer = new ArrayBuffer(string.length);
  const bufferView = new Uint8Array(buffer);
  for (let i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i);
  }
  return buffer;
}

export default {
  data() {
    return {
      reports: []
    };
  },
  async created() {
    const cookies = (
      await chrome.runtime.sendMessage({ message: "popup init" })
    );

    const { csvFormat } = await import("d3-dsv");
    const key = await generateKey();

    // global transform function which we supply for embedded charts
    window.unpack_decrypt = async (__) => await decrypt(unpack(__), key, iv);

    const encryptedCookies = await Promise.all(cookies.map(async (cookie) => {
      for (const prop in cookie) cookie[prop] = pack(await encrypt(cookie[prop], key));
      return cookie;
    }));
    const csv = csvFormat(encryptedCookies);

    if (csv) {
      // new source form required fields
      const formData = new FormData();
      formData.append("name", `extension_browser-privacy-monitor_${Math.random().toString(36).substring(7)}`);
      formData.append("baseName", "CsvFile");
      formData.append("file", new File([csv], "cookies.csv", { type: "text/csv;charset=utf-8" }));
      formData.append("sourceSettings", JSON.stringify({
        "File name": { name: "File name" },
        "Database table name": { name: "Database table name", sourceSettingValue: "" },
        "Database URL": { name: "Database URL", sourceSettingValue: "" },
      }));

      try {
        // POST new source with form data as body
        const responseSource = await fetch(`${DOMAIN}/source`, {
          method: "POST",
          body: formData
        });

        const jsonSource = await responseSource.json();
        if (jsonSource.response === "success") {
          const source = jsonSource.payload;

          // POST new report
          const responseReport = await fetch(`${DOMAIN}/report`, {
            method: "POST",
            body: JSON.stringify({
              name: Math.random().toString(36).substring(7),

              // report/chart options
              reportOptions: [{
                // visualization type
                optionTypeId: 1,
                optionValue: "sunburst"
              }, {
                // page size
                optionTypeId: 9,
                optionValue: cookies.length
              }],

              // report fields
              reportFields: source.sourceFields
                .filter(({ field: { name } }) => ["Domain type", "domain", "name", "value"].includes(name))
                .map((sourceField, i) =>
                  sourceFieldToReportField(Object.assign({}, sourceField, {
                    chartColumn: JSON.stringify({
                      // chart roles
                      sunburst: sourceField.field.name === "value" ? "angles" : `slices_${{
                        "Domain type": 1,
                        domain: 2,
                        name: 3
                      }[sourceField.field.name]}#0`
                    })
                  }), i)
                ),

              sourceId: source.id
            })
          });

          const jsonReport = await responseReport.json();
          if (jsonReport.response === "success") {
            const report = jsonReport.payload;
            await fetch(`${DOMAIN}/embedded/report/${report.id}`, { method: "POST" });
            this.reports = [report];
          } else {}
        } else {}
      } catch (err) { return Promise.reject(new Error(err)); }
    } else console.log("Blank CSV");
  },
};
</script>