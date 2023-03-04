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

import { sourceFieldToReportField } from "./lib/reporting";
import {
  initializationVector,
  encrypt,
  decrypt,
  pack,
  unpack,
  generateKey,
} from "./lib/cryptography";
import { csvFormat } from "d3-dsv";

export default {
  data() {
    return {
      cookies: undefined,
      reports: []
    };
  },
  created() {
    chrome.runtime.sendMessage({ message: "popup init" });

    chrome.runtime.onMessage.addListener(async ({ message, payload }) => {
      if (message === "cookies") {
        this.cookies = payload;

        if (!this.cookies?.length) return;

        const key = await generateKey();

        // global transform function which we supply for embedded charts
        window.unpack_decrypt = async (__) => await decrypt(unpack(__), key, initializationVector);

        const encryptedCookies = await Promise.all(this.cookies.map(async (cookie) => {
            const sourceFields = {
                domain: pack(await encrypt(cookie.domain, key)),
                //expirationDate: cookie.expirationDate,
                //hostOnly: cookie.hostOnly,
                //httpOnly: cookie.httpOnly,
                name: pack(await encrypt(cookie.name, key)),
                //sessionId: cookie.sessionId,
                //path: cookie.path,
                //sameSite: cookie.sameSite,
                //secure: cookie.secure,
                //session: cookie.session,
                //storeId: cookie.storeId,
                //value: cookie.value,
                domainType: pack(await encrypt(cookie.domainType, key))
            };
            return sourceFields;
        }));
        const sourceCsv = csvFormat(encryptedCookies);

        if (sourceCsv) {
          // new source form required fields
          const formData = new FormData();
          formData.append("name", `extension_browser-privacy-monitor_${Math.random().toString(36).substring(7)}`);
          formData.append("baseName", "CsvFile");
          formData.append("file", new File([sourceCsv], "cookies.csv", { type: "text/csv;charset=utf-8" }));
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
                  "reportFields":[
                      {"aggregate":"groupBy","chartColumn":"{\"sunburst\":\"slices_1#0\"}","dataType":"TEXT","fieldId":source.sourceFields[0].fieldId,"format":null,"formula":"\"domainType\"","name":"Domain type","position":0,"sort":null},
                      {"aggregate":"groupBy","chartColumn":"{\"sunburst\":\"slices_2#0\"}","dataType":"TEXT","fieldId":source.sourceFields[0].fieldId,"format":null,"formula":"\"domain\"","name":"domain","position":1,"sort":null},
                      {"aggregate":"groupBy","chartColumn":"{\"sunburst\":\"slices_3#0\"}","dataType":"TEXT","fieldId":source.sourceFields[0].fieldId,"format":null,"formula":"\"name\"","name":"name","position":2,"sort":null},
                      {"aggregate":"count","chartColumn":"{\"sunburst\":\"angles\"}","dataType":"TEXT","fieldId":source.sourceFields[0].fieldId,"format":null,"formula":"\"domain\"||\"name\"","name":"Number of cookies","position":3,"sort":null}
                  ],
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
    });
  }
};

</script>