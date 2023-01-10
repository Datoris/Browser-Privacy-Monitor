<template>
  <div>
    <iframe
      v-for="report in reports"
      :key="report.id"
      :src="`https://localhost/embedded/snippet/${report.id}`"
      :title="report.name"
      width="600"
      height="600"
      frameborder="0"
    ></iframe>
  </div>
</template>


<script>
export default {
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