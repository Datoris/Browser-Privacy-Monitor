<template>
  <table v-if="cookies.length">
    <caption>
      Third-party cookies
    </caption>
    <thead>
      <tr>
        <th>domain</th>
        <th>expirationDate</th>
        <th>hostOnly</th>
        <th>httpOnly</th>
        <th>name</th>
        <th>path</th>
        <th>sameSite</th>
        <th>secure</th>
        <th>session</th>
        <th>storeId</th>
        <th>value</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="cookie in cookies"
        :key="`${cookie.domain}_${cookie.name}_${cookie.path}`"
      >
        <td>{{ cookie.domain }}</td>
        <td>{{ cookie.expirationDate }}</td>
        <td>{{ cookie.hostOnly }}</td>
        <td>{{ cookie.httpOnly }}</td>
        <td>{{ cookie.name }}</td>
        <td>{{ cookie.path }}</td>
        <td>{{ cookie.sameSite }}</td>
        <td>{{ cookie.secure }}</td>
        <td>{{ cookie.session }}</td>
        <td>{{ cookie.storeId }}</td>
        <td>{{ cookie.value }}</td>
      </tr>
    </tbody>
  </table>
</template>


<script>
import sortBy from "lodash.sortby";
export default {
  data() {
    return {
      cookies: [],
    };
  },
  async created() {
    this.cookies = sortBy(
      await chrome.runtime.sendMessage({ message: "popup init" }),
      "domain"
    );
  },
};
</script>