// js/app.js
import { navigate } from "./router.js";
import { isLoggedIn, getCurrentUser } from "./services/userService.js";

function startApp() {
  const urlParams = new URLSearchParams(window.location.search);
  let initialPage = urlParams.get("page") || "categories";

  if (!isLoggedIn()) {
    initialPage = "login";
  } else {
    const user = getCurrentUser();
    // Si fournisseur, forcer produits même si l'URL dit categories/users
    if (user.role === "fournisseur" && ["categories", "users"].includes(initialPage)) {
      initialPage = "produits";
    }
  }

  navigate(initialPage, false);
}

startApp();