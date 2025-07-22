// TechniquesListDebug.tsx - Minimal test component to isolate the toString() error
"use client";

import React from "react";

export default function TechniquesListDebug() {
  console.log("🔍 DEBUG: TechniquesListDebug starting");

  try {
    // Test basic operations that might call toString() - NO HOOKS
    const testComplexity = 5;
    console.log(
      "🔍 DEBUG: testComplexity:",
      testComplexity,
      "toString():",
      testComplexity.toString(),
    );

    const testUrl = new URLSearchParams();
    testUrl.set("test", "value");
    console.log("🔍 DEBUG: URLSearchParams toString():", testUrl.toString());

    // Test other potential toString() calls
    const testObj = { complexity_max: 5 };
    console.log(
      "🔍 DEBUG: testObj.complexity_max.toString():",
      testObj.complexity_max.toString(),
    );

    console.log("🔍 DEBUG: TechniquesListDebug completed successfully");

    return (
      <div>
        <h1>Debug Component</h1>
        <p>If you can see this, the basic component works!</p>
        <p>Check console for debug logs.</p>
        <p>Testing basic toString() operations without hooks.</p>
      </div>
    );
  } catch (error) {
    console.error("🚨 ERROR in TechniquesListDebug:", error);
    throw error;
  }
}
