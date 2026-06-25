// js/app.js
import { navigate } from "./router.js";
import { isLoggedIn } from "./services/userService.js";

function startApp() {
  const urlParams = new URLSearchParams(window.location.search);
  let initialPage = urlParams.get("page") || "categories";

  if (!isLoggedIn() && initialPage !== "login") {
    initialPage = "login";
  }

  navigate(initialPage, false);
}

startApp();