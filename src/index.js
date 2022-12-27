import Vue from "vue";
import Index from "./Index.vue";
import "./styles/index.scss";

new Vue({
  el: "#app",
  render: h => h(Index),
});