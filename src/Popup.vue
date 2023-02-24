<template>
  <main>
    <div v-if="cookies && !cookies.length" class="message">No cookies here.</div>
    <div v-else-if="reports.length" id="dashboard">
      <script
        v-for="report in reports"
        :key="report.id"
        type="application/javascript"
        src="chart.js"
        :id="report.id"
        fn="unpack_decrypt"
      ></script>
    </div>
    <div v-else class="message message--pulse">Collecting cookies...</div>
  </main>
</template>


<script>

import {
  sourceFieldToReportField,
  iv,
  encrypt,
  decrypt,
  pack,
  unpack,
  generateKey,
} from "./helpers";
import { csvFormat } from "d3-dsv";

export default {
  data() {
    return {
      cookies: undefined,
      reports: []
    };
  },
  async created() {
    this.cookies = await chrome.runtime.sendMessage({ message: "popup init" });

    if (!this.cookies?.length) return;

    const key = await generateKey();

    // global transform function which we supply for embedded charts
    window.unpack_decrypt = async (__) => await decrypt(unpack(__), key, iv);

    const encryptedCookies = await Promise.all(this.cookies.map(async (cookie) => {
      for (const prop in cookie) {
        if (prop === "value") delete cookie[prop];
        else cookie[prop] = pack(await encrypt(cookie[prop], key));
      }
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

          // this variable includes arguments for the sourceFieldToReportField() function
          // specifying each source field to be included in the report
          const relevantSourceFieldsAddenda = {
            id: {
              chartColumn: { sunburst: "angles" },
              position: 3,
              field: {
                aggregate: "count",
                name: "Number of cookies"
              }
            },
            "Domain type": {
              chartColumn: { sunburst: "slices_1#0" },
              position: 0
            },
            domain: {
              chartColumn: { sunburst: "slices_2#0" },
              position: 1
            },
            name: {
              chartColumn: { sunburst: "slices_3#0" },
              position: 2
            }
          }

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
                // footer enabled
                optionTypeId: 3,
                optionValue: true
              }, {
                // footer
                optionTypeId: 8,
                optionValue: "Powered by <a href='https://datoris.com' target='_blank'>Datoris.com</a>"
              }, {
                // page size
                optionTypeId: 9,
                optionValue: 1000
              }, {
                // paging enabled
                optionTypeId: 17,
                optionValue: false
              }, {
                // title
                optionTypeId: 19,
                optionValue: "Browser cookies by domain"
              }],

              // report fields
              reportFields: source.sourceFields
                .filter(({ field: { name } }) => Object.keys(relevantSourceFieldsAddenda).includes(name))
                .map((sourceField) =>
                  sourceFieldToReportField(Object.assign({}, sourceField, {
                    chartColumn: JSON.stringify(relevantSourceFieldsAddenda[sourceField.field.name].chartColumn),
                    field: Object.assign({}, sourceField.field, relevantSourceFieldsAddenda[sourceField.field.name].field),
                  }), relevantSourceFieldsAddenda[sourceField.field.name].position)
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
  }
};

</script>