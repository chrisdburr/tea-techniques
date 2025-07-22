#!/usr/bin/env node
// Test script to debug Privacy filtering

const fs = require("fs");
const path = require("path");

// Read the static data files
const techniquesPath = path.join(__dirname, "public/api/techniques.json");
const assuranceGoalsPath = path.join(
  __dirname,
  "public/api/assurance-goals.json",
);

const techniquesData = JSON.parse(fs.readFileSync(techniquesPath, "utf-8"));
const assuranceGoalsData = JSON.parse(
  fs.readFileSync(assuranceGoalsPath, "utf-8"),
);

console.log("=== Assurance Goals ===");
assuranceGoalsData.results.forEach((goal) => {
  console.log(`ID: ${goal.id}, Name: ${goal.name}`);
});

console.log("\n=== Testing Privacy Filtering (ID: 5) ===");

const goalIds = ["5"];
console.log("Filtering by goal IDs:", goalIds);

const filteredTechniques = techniquesData.results.filter((technique) => {
  const hasMatchingGoal = technique.assurance_goals.some((goal) =>
    goalIds.includes(goal.id?.toString()),
  );

  if (hasMatchingGoal) {
    console.log(
      `✅ ${technique.name} matches goals:`,
      technique.assurance_goals.map((g) => `${g.id}:${g.name}`),
    );
  }

  return hasMatchingGoal;
});

console.log(`\n=== Results ===`);
console.log(`Total techniques: ${techniquesData.results.length}`);
console.log(`Privacy techniques found: ${filteredTechniques.length}`);

if (filteredTechniques.length === 0) {
  console.log("\n❌ NO PRIVACY TECHNIQUES FOUND!");

  // Debug: Show some techniques with their assurance goals
  console.log("\n=== Sample technique assurance goals for debugging ===");
  techniquesData.results.slice(0, 10).forEach((technique) => {
    console.log(
      `${technique.name}:`,
      technique.assurance_goals.map((g) => `${g.id}:${g.name}`),
    );
  });

  // Find any technique that mentions "Privacy" in its goals
  console.log('\n=== Techniques that have "Privacy" in goal name ===');
  techniquesData.results.forEach((technique) => {
    const hasPrivacyGoal = technique.assurance_goals.some((goal) =>
      goal.name.includes("Privacy"),
    );
    if (hasPrivacyGoal) {
      console.log(
        `${technique.name}:`,
        technique.assurance_goals.map((g) => `${g.id}:${g.name}`),
      );
    }
  });
} else {
  console.log("\n✅ Privacy techniques found:");
  filteredTechniques.forEach((tech) => console.log(`- ${tech.name}`));
}
