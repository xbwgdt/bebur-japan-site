export const approvedPageSlugs = [
  "overview",
  "company-profile",
  "certifications",
  "culture",
  "history",
  "exhibitions",
  "industry-solutions",
  "electric-power-industry",
  "food-industry",
  "environmental-protection",
  "hydraulic-industry",
  "medical-pharmaceutical",
  "chemical-industry",
  "municipal-water-treatment",
  "liquid-cooling-industry",
  "liquid-cooling-cases",
  "plate-heat-exchanger-cleanliness",
  "manifold-cleanliness",
  "bt8200-cold-plate-liquid-cooling",
  "bt8200-liquid-cooling",
  "liquid-cooled-plate-cleanliness",
  "municipal-water-cases",
  "online-disinfectant-analyzer-waterworks",
  "bt8200-jiangnan-water-plant",
  "scm520-waterworks",
  "chemical-cases",
  "msf8100-metallurgical-industry",
  "medical-pharmaceutical-cases",
  "liquid-particle-counter-pharmaceutical",
  "hydraulic-cases",
  "environmental-protection-cases",
  "gt-3280-ou-landfill",
  "food-beverage-cases",
  "water-ozone-analyzer-beverage",
  "power-industry-cases",
  "scm530-power-plant-dosing",
  "scm530-jiangsu-power-plant",
  "home",
  "product-index",
  "application-index",
  "application-case-index",
  "insight-index",
  "contact",
  "cleanliness",
  "dosing",
  "water-quality",
  "gas-detection",
  "flow-level",
].toSorted();

const approvedPageIds = approvedPageSlugs.map((slug) => `page--${slug}`);

function exactSet(values) {
  return [...values].toSorted();
}

function matchesApprovedSet(actual, approved) {
  return actual.length === approved.length && actual.every((value, index) => value === approved[index]);
}

export function validateApprovedPageIdentities(documents) {
  const ids = exactSet(documents.map(({ _id }) => _id));
  if (!matchesApprovedSet(ids, approvedPageIds)) {
    throw new Error("Refusing import: page NDJSON IDs must exactly match the approved page IDs.");
  }

  const slugs = exactSet(documents.map((document) => document.slug?.current));
  if (!matchesApprovedSet(slugs, approvedPageSlugs)) {
    throw new Error("Refusing import: page NDJSON slugs must exactly match the approved page slugs.");
  }

  for (const document of documents) {
    if (document._id !== `page--${document.slug?.current}`) {
      throw new Error(`Refusing import: page ID and slug must match for ${document._id}.`);
    }
  }
}
