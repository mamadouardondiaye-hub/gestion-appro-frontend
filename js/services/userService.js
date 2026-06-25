// js/services/userService.js
import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";

let currentUser = null;

export function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  if (user) {
    currentUser = JSON.parse(user);
    return currentUser;
  }
  return null;
}

export function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  } else {
    localStorage.removeItem("currentUser");
  }
}

export function isLoggedIn() {
  return getCurrentUser() !== null;
}

export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === "admin";
}

export function isFournisseur() {
  const user = getCurrentUser();
  return user && user.role === "fournisseur";
}

export function isFournisseurOfProduct(produit) {
  const user = getCurrentUser();
  if (!user) return false;
  if (isAdmin()) return true;
  return user.role === "fournisseur" && produit.fournisseurId === user.id;
}

export async function getUsers() {
  return apiRequest(ENDPOINTS.users, {}, "Impossible de charger les utilisateurs.");
}

export async function getUserById(id) {
  return apiRequest(`${ENDPOINTS.users}/${id}`, {}, "Impossible de charger l'utilisateur.");
}

export async function createUser(userData) {
  const user = {
    id: createId("user"),
    ...userData,
    createdAt: new Date().toISOString()
  };
  return apiRequest(
    ENDPOINTS.users,
    {
      method: "POST",
      body: JSON.stringify(user)
    },
    "Impossible de créer l'utilisateur."
  );
}

export async function updateUser(id, userData) {
  return apiRequest(
    `${ENDPOINTS.users}/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(userData)
    },
    "Impossible de modifier l'utilisateur."
  );
}

export async function deleteUser(id) {
  return apiRequest(
    `${ENDPOINTS.users}/${id}`,
    {
      method: "DELETE"
    },
    "Impossible de supprimer l'utilisateur."
  );
}

export async function login(email, password) {
  const users = await getUsers();
  const user = users.find(
    u => u.email === email && u.password === password
  );
  
  if (!user) {
    throw new Error("Email ou mot de passe incorrect.");
  }
  
  setCurrentUser(user);
  return user;
}

export function logout() {
  setCurrentUser(null);
  localStorage.removeItem("currentUser");
}