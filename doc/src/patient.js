//patient.js

import fs from "fs";

export function loadPatient(path = "./mock_patient_soumika.json") {
  const raw = fs.readFileSync(path, "utf8");
  return JSON.parse(raw);
}
