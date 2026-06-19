import { apiRequest } from "./apiClient.js";
import { ENDPOINTS, CLOUDINARY_CONFIG } from "../config/api.js";
import { createId } from "../utils/id.js";

export async function uploadImageToCloudinary(file) {
  const cloudName = CLOUDINARY_CONFIG.cloudName || "dgdmx2cn0";
  const uploadPreset = CLOUDINARY_CONFIG.uploadPreset || "qmpszqij";

  console.log("=== UPLOAD CLOUDINARY ===");
  console.log("Cloud Name:", cloudName);
  console.log("Upload Preset:", uploadPreset);
  console.log("File:", file.name, file.size, file.type);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  
  formData.append("timestamp", Date.now());

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  console.log("URL:", url);

  try {
    const response = await fetch(url, { 
      method: "POST",
      body: formData
    });
    
    console.log("Status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Détails Erreur Cloudinary :", errorData);
      
      // Message d'erreur plus explicite
      if (errorData.error?.message) {
        throw new Error(`Cloudinary: ${errorData.error.message}`);
      }
      throw new Error("Échec de l'envoi de l'image vers Cloudinary.");
    }

    const data = await response.json();
    console.log("Upload réussi:", data.secure_url);
    return data.secure_url;
  } catch (err) {
    console.error("Erreur Fetch Cloudinary :", err);
    throw err;
  }
}


function normalizeProduit(data) {
  return {
    id: data.id,
    libelle: String(data.libelle).trim(),
    prix: Number(data.prix) || 0,
    quantite: Number(data.quantite) || 0,
    categorieId: data.categorieId,
    image: data.image || ""
  };
}

export async function getProduits() {
  const data = await apiRequest(ENDPOINTS.produits, {}, "Impossible de charger les produits.");
  return Array.isArray(data) ? data.map(normalizeProduit) : [];
}

export async function createProduit(produitData) {
  const rawProduit = {
    id: createId("prod"),
    ...produitData
  };
  const normalized = normalizeProduit(rawProduit);
  return await apiRequest(
    ENDPOINTS.produits,
    {
      method: "POST",
      body: JSON.stringify(normalized)
    },
    "Impossible de créer le produit."
  );
}

export async function updateProduit(id, produitData) {
  if (!id) throw new Error("Identifiant produit manquant pour la modification.");
  const normalized = normalizeProduit({ id, ...produitData });
  return await apiRequest(
    `${ENDPOINTS.produits}/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(normalized)
    },
    "Impossible de modifier le produit."
  );
}

export async function deleteProduit(id) {
  if (!id) throw new Error("Identifiant produit manquant pour la suppression.");
  return await apiRequest(
    `${ENDPOINTS.produits}/${id}`,
    {
      method: "DELETE"
    },
    "Impossible de supprimer le produit."
  );
}