<template>
  <div>
    <script
      v-for="report in reports"
      :key="report.id"
      type="application/javascript"
      src="chart.js"
      :id="report.id"
    ></script>
  </div>
</template>

<script>
export default {
  DOMAIN: DOMAIN,
  data() {
    return {
      reports: [],
    };
  },
  async created() {
    this.reports = await chrome.runtime.sendMessage({ message: "index init" });
  },
};
</script>