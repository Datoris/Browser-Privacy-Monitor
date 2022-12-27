import Vue from "vue";
import Popup from "./Popup.vue";
import "./styles/popup.scss";

new Vue({
  el: "#app",
  render: h => h(Popup),
});