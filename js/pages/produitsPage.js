// js/pages/produitsPage.js
import { pageHeader } from "../components/pageHeader.js";
import { renderTable } from "../components/table.js";
import { openModal, openConfirm } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { validateForm } from "../utils/validators.js";
import { getCategories } from "../services/categorieService.js";
import { 
  getProduits, 
  createProduit, 
  updateProduit, 
  deleteProduit, 
  uploadImageToCloudinary 
} from "../services/produitService.js";
import { getCurrentUser, isAdmin, isFournisseur } from "../services/userService.js";

let currentView = "liste";

function produitFormBody(produit, categories) {
  const options = categories
    .map((cat) => {
      const selected = cat.id === produit?.categorieId ? "selected" : "";
      return `<option value="${escapeHtml(cat.id)}" ${selected}>${escapeHtml(cat.libelle)}</option>`;
    })
    .join("");

  return `
    <div class="space-y-4">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="produitLibelle">Libellé *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" type="text" id="produitLibelle" value="${escapeHtml(produit?.libelle || "")}" placeholder="ex: Clavier Mécanique" autocomplete="off" />
        <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_libelle"></p>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="produitPrix">Prix Unitaire (€) *</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" type="number" step="0.01" id="produitPrix" value="${produit?.prix ?? ""}" placeholder="0.00" />
          <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_prix"></p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="produitQuantite">Quantité Stock *</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" type="number" id="produitQuantite" value="${produit?.quantite ?? ""}" placeholder="0" />
          <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_quantite"></p>
        </div>
      </div>
      
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="produitCategorie">Catégorie *</label>
        <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" id="produitCategorie">
          <option value="">-- Choisir une catégorie --</option>
          ${options}
        </select>
        <p class="mt-1 hidden text-xs font-semibold text-rose-600" id="error_categorieId"></p>
      </div>

      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="produitImage">Image de l'article</label>
        <input class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" type="file" id="produitImage" accept="image/*" />
        <div class="mt-3 flex items-center gap-3">
          <div id="imgPreviewContainer" class="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
            ${produit?.image ? `<img src="${produit.image}" class="h-full w-full object-cover" />` : `<i class="fa-solid fa-image text-lg"></i>`}
          </div>
          <p class="text-xs text-slate-400">Format accepté : JPG, PNG, WEBP. Stocké sur Cloudinary.</p>
        </div>
      </div>
    </div>
  `;
}

function handleFormErrors(modal, errors) {
  modal.querySelectorAll("[id^='error_']").forEach(el => {
    el.classList.add("hidden");
    el.textContent = "";
  });

  Object.entries(errors).forEach(([field, message]) => {
    const errContainer = modal.querySelector(`#error_${field}`);
    if (errContainer) {
      errContainer.textContent = message;
      errContainer.classList.remove("hidden");
    }
  });
}

function openProduitForm(produit = null, categories = []) {
  // Vérification : Si on modifie un produit, vérifier les droits
  if (produit) {
    const user = getCurrentUser();
    if (!isAdmin() && produit.fournisseurId !== user?.id) {
      showToast("Vous ne pouvez pas modifier ce produit. Vous n'êtes pas le fournisseur.", "error");
      return;
    }
  }

  // Vérification : Il faut au moins une catégorie
  if (categories.length === 0) {
    showToast("Veuillez d'abord enregistrer au moins une catégorie.", "error");
    return;
  }

  openModal({
    title: produit ? "Modifier le produit" : "Nouveau produit",
    icon: "fa-box",
    body: produitFormBody(produit, categories),
    confirmLabel: produit ? "Enregistrer" : "Créer",
    onConfirm: async (modal) => {
      const libelle = modal.querySelector("#produitLibelle").value;
      const prix = modal.querySelector("#produitPrix").value;
      const quantite = modal.querySelector("#produitQuantite").value;
      const categorieId = modal.querySelector("#produitCategorie").value;
      const imageFileInput = modal.querySelector("#produitImage");

      // Règles de validation
      const rules = {
        libelle: { required: true, requiredMessage: "Le libellé est requis." },
        prix: { 
          required: true, 
          isPositiveNumber: true, 
          requiredMessage: "Le prix est requis.", 
          numberMessage: "Prix valide requis." 
        },
        quantite: { 
          required: true, 
          isPositiveNumber: true, 
          requiredMessage: "La quantité est requise.", 
          numberMessage: "Quantité valide requise." 
        },
        categorieId: { required: true, requiredMessage: "Sélectionnez une catégorie." }
      };

      const errors = validateForm({ libelle, prix, quantite, categorieId }, rules);

      if (Object.keys(errors).length > 0) {
        handleFormErrors(modal, errors);
        return false;
      }

      try {
        let imageUrl = produit?.image || "";

        // Upload de l'image si une nouvelle est sélectionnée
        if (imageFileInput.files && imageFileInput.files[0]) {
          showToast("Envoi de l'image vers Cloudinary...", "info");
          imageUrl = await uploadImageToCloudinary(imageFileInput.files[0]);
        }

        const dataProduit = { 
          libelle, 
          prix: Number(prix), 
          quantite: Number(quantite), 
          categorieId, 
          image: imageUrl 
        };

        // Si c'est un nouveau produit, le fournisseurId sera ajouté automatiquement par le service
        if (produit) {
          await updateProduit(produit.id, dataProduit);
          showToast("Le produit a bien été mis à jour.");
        } else {
          await createProduit(dataProduit);
          showToast("Nouveau produit ajouté au catalogue.");
        }

        await renderProduitsPage();
        return true;
      } catch (err) {
        showToast(err.message, "error");
        return false;
      }
    }
  });

  // Aperçu instantané de l'image
  const inputImg = document.getElementById("produitImage");
  if (inputImg) {
    inputImg.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const preview = document.getElementById("imgPreviewContainer");
      if (file && preview) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          preview.innerHTML = `<img src="${evt.target.result}" class="h-full w-full object-cover" />`;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function renderCardsView(produits, categoryMap) {
  if (produits.length === 0) {
    return `<div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">Aucun produit enregistré.</div>`;
  }

  const isFournisseurUser = isFournisseur();

  return `
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      ${produits.map((prod) => {
        const catLabel = categoryMap.get(prod.categorieId) || "Non classé";
        const imageSrc = prod.image || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=500&q=80";
        const qte = Number(prod.quantite);
        const badgeColor = qte === 0 ? "bg-rose-50 text-rose-700 ring-rose-600/10" : qte <= 5 ? "bg-amber-50 text-amber-700 ring-amber-600/10" : "bg-slate-50 text-slate-700 ring-slate-600/10";

        return `
          <div class="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
            <div class="h-48 w-full bg-slate-100 border-b border-slate-100">
              <img src="${imageSrc}" alt="${escapeHtml(prod.libelle)}" class="h-full w-full object-cover transition duration-300 hover:scale-105" />
            </div>
            
            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div class="mb-3 flex items-center justify-between gap-2">
                  <span class="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                    ${escapeHtml(catLabel)}
                  </span>
                  <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${badgeColor}">
                    Stock : ${qte}
                  </span>
                </div>
                <h3 class="text-base font-black tracking-tight text-slate-950">${escapeHtml(prod.libelle)}</h3>
                <p class="mt-1 text-xl font-extrabold text-indigo-600">${Number(prod.prix).toFixed(2)} €</p>
              </div>

              <div class="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                ${isFournisseurUser ? `
                  <span class="flex-1 text-center text-xs text-slate-400 py-2.5">🔒 Lecture seule</span>
                ` : `
                  ${canModifyProduct(prod) ? `
                    <button class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50" data-edit="${escapeHtml(prod.id)}">
                      <i class="fa-solid fa-pen"></i> Modifier
                    </button>
                  ` : ''}
                  ${canDeleteProduct(prod) ? `
                    <button class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-extrabold text-white transition hover:bg-rose-700" data-delete="${escapeHtml(prod.id)}">
                      <i class="fa-solid fa-trash"></i> Supprimer
                    </button>
                  ` : ''}
                  ${!canModifyProduct(prod) && !canDeleteProduct(prod) ? `
                    <span class="flex-1 text-center text-xs text-slate-400 py-2.5">🔒 Lecture seule</span>
                  ` : ''}
                `}
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

// Fonctions de vérification des droits
function canModifyProduct(produit) {
  const user = getCurrentUser();
  if (!user) return false;
  if (isAdmin()) return true;
  if (isFournisseur()) {
    return produit.fournisseurId === user.id;
  }
  return false;
}

function canDeleteProduct(produit) {
  const user = getCurrentUser();
  if (!user) return false;
  // Seul l'admin peut supprimer des produits
  return isAdmin();
}

export async function renderProduitsPage() {
  const app = document.getElementById("app");

  const produits = await getProduits();
  const categories = await getCategories();
  const categoryMap = new Map(categories.map((c) => [c.id, c.libelle]));

  const activeBtnClass = "bg-slate-950 text-white shadow-sm";
  const inactiveBtnClass = "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50";

  const user = getCurrentUser();
  const isFournisseurUser = isFournisseur();
  const isAdminUser = isAdmin();

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Stock",
        title: "Produits",
        subtitle: "Gérer l'ensemble des articles et des stocks matières.",
        actionLabel: isFournisseurUser ? "" : "Nouveau produit",
        actionId: "addProduitBtn",
        actionIcon: "fa-box"
      })}

      <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 class="text-xl font-black text-slate-950">Catalogue Articles</h2>
          <p class="text-sm text-slate-500">${produits.length} produit(s) enregistré(s).</p>
          ${user ? `<p class="text-xs text-slate-400">Connecté en tant que : ${user.email} (${user.role === 'admin' ? '👑 Administrateur' : '🤝 Fournisseur'})</p>` : ''}
        </div>
        
        <div class="flex items-center gap-1 rounded-2xl bg-slate-200/60 p-1">
          <button id="viewListBtn" class="flex h-9 w-10 items-center justify-center rounded-xl transition text-sm ${currentView === "liste" ? activeBtnClass : inactiveBtnClass}">
            <i class="fa-solid fa-list"></i>
          </button>
          <button id="viewCardsBtn" class="flex h-9 w-10 items-center justify-center rounded-xl transition text-sm ${currentView === "cartes" ? activeBtnClass : inactiveBtnClass}">
            <i class="fa-solid fa-table-cells-large"></i>
          </button>
        </div>
      </div>

      <div id="productsViewContainer">
        ${currentView === "liste" ? renderTable({
          columns: [
            { 
              label: "Visuel", 
              render: (p) => {
                const src = p.image || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=80&q=80";
                return `<img src="${src}" class="h-10 w-10 rounded-xl object-cover border border-slate-200 shadow-xs" />`;
              }
            },
            { label: "Libellé", key: "libelle" },
            { label: "Catégorie", render: (p) => escapeHtml(categoryMap.get(p.categorieId) || "Sans catégorie") },
            { label: "Prix", render: (p) => `${Number(p.prix).toFixed(2)} €` },
            { label: "Quantité", render: (p) => `<span class="font-bold ${Number(p.quantite) === 0 ? 'text-rose-600' : 'text-slate-800'}">${p.quantite}</span>` },
            { 
              label: "Fournisseur", 
              render: (p) => {
                return p.fournisseurId ? `<span class="text-xs text-slate-500">ID: ${escapeHtml(p.fournisseurId)}</span>` : '-';
              }
            },
            {
              label: "Actions",
              render: (p) => {
                // Si l'utilisateur est fournisseur, on n'affiche pas les actions
                if (isFournisseurUser) {
                  return `<span class="text-xs text-slate-400">🔒 Lecture seule</span>`;
                }
                
                const canModify = canModifyProduct(p);
                const canDelete = canDeleteProduct(p);
                
                return `
                  <div class="flex items-center gap-2">
                    ${canModify ? `
                      <button class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50" data-edit="${escapeHtml(p.id)}">
                        <i class="fa-solid fa-pen"></i> Modifier
                      </button>
                    ` : ''}
                    ${canDelete ? `
                      <button class="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-rose-700" data-delete="${escapeHtml(p.id)}">
                        <i class="fa-solid fa-trash"></i> Supprimer
                      </button>
                    ` : ''}
                    ${!canModify && !canDelete && !isFournisseurUser ? `
                      <span class="text-xs text-slate-400">🔒 Lecture seule</span>
                    ` : ''}
                  </div>
                `;
              }
            }
          ],
          rows: produits,
          emptyMessage: "Aucun article enregistré pour le moment."
        }) : renderCardsView(produits, categoryMap)}
      </div>
    </section>
  `;

  // Événements d'IHM
  document.getElementById("viewListBtn").addEventListener("click", () => { 
    currentView = "liste"; 
    renderProduitsPage(); 
  });
  
  document.getElementById("viewCardsBtn").addEventListener("click", () => { 
    currentView = "cartes"; 
    renderProduitsPage(); 
  });
  
  // Bouton "Nouveau produit" - visible uniquement pour les admins
  const addBtn = document.getElementById("addProduitBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      // Vérifier si l'utilisateur peut créer un produit
      if (!user) {
        showToast("Vous devez être connecté pour créer un produit.", "error");
        return;
      }
      if (isFournisseurUser) {
        showToast("Les fournisseurs ne peuvent pas créer de produits.", "error");
        return;
      }
      openProduitForm(null, categories);
    });
  }

  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prod = produits.find((x) => x.id === btn.dataset.edit);
      if (prod) {
        // Vérifier les droits avant d'ouvrir le formulaire
        if (!canModifyProduct(prod)) {
          showToast("Vous n'avez pas le droit de modifier ce produit.", "error");
          return;
        }
        openProduitForm(prod, categories);
      }
    });
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.delete;
      const prod = produits.find((x) => x.id === id);
      
      if (!prod) return;
      
      // Vérifier les droits avant de supprimer
      if (!canDeleteProduct(prod)) {
        showToast("Seul un administrateur peut supprimer des produits.", "error");
        return;
      }
      
      openConfirm({
        title: "Confirmer la suppression",
        message: "Êtes-vous certain de vouloir retirer définitivement cet article de l'inventaire ? Cette action est irréversible.",
        confirmLabel: "Supprimer",
        onConfirm: async () => {
          try {
            await deleteProduit(id);
            showToast("Produit supprimé avec succès.");
            await renderProduitsPage();
          } catch (err) {
            showToast(err.message, "error");
          }
        }
      });
    });
  });
}