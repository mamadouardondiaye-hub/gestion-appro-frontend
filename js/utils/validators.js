export function required(value, message) {
  if (!String(value ?? "").trim()) {
    throw new Error(message);
  }
}

export function validateForm(data, rules) {
  const errors = {};

  for (const field in rules) {
    const value = data[field];
    const fieldRules = rules[field];

    if (fieldRules.required) {
      if (!String(value ?? "").trim()) {
        errors[field] = fieldRules.requiredMessage || "Ce champ est obligatoire.";
        continue;
      }
    }

    if (fieldRules.isPositiveNumber) {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        errors[field] = fieldRules.numberMessage || "Veuillez entrer une valeur positive.";
      }
    }
  }

  return errors;
}