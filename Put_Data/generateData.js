// Full Corrected and Complete Version with All Branches
const fs = require('fs');

const selectedBranches = ["CSE", "AIML", "CIC", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "CSIT"];
const firstYearSem1 = ["M1", "CHEMISTRY", "BCME", "ENGLISH", "CP", "IT WORK SHOP", "CHEMISTRY LAB", "ENGINEERING WORKSHOP", "CP LAB", "YOGA & SPORTS"];
const firstYearSem2 = ["M2", "PHYSICS", "BEEE", "CS LAB", "EG-DRAWING", "PHYSICS LAB", "BEEE LAB", "DS", "DS LAB", "NSS"];
const units = ["1st unit", "2nd unit", "3rd unit", "4th unit", "5th unit"];
const addedBy = "64f5f35ce7dcf0c1a8b2d312";

let data = [];

// Shared 1st Year logic for all selectedBranches
selectedBranches.forEach(branch => {
  [
    { year: "1st Year", semester: "1st sem", subjects: firstYearSem1 },
    { year: "1st Year", semester: "2nd sem", subjects: firstYearSem2 }
  ].forEach(entry => {
    entry.subjects.forEach(subject => {
      units.forEach((unit, i) => {
        data.push({
          branch,
          year: entry.year,
          semester: entry.semester,
          subject,
          unit,
          topic: `${subject} - ${unit}`,
          link: `https://example.com/${subject.toLowerCase().replace(/ /g, "-")}-unit${i + 1}.pdf`,
          addedBy
        });
      });
    });
  });
});

// Helper to add branch-specific data
function addBranchSubjects(branch, subjectMap) {
  Object.entries(subjectMap).forEach(([year, semesters]) => {
    Object.entries(semesters).forEach(([semester, subjects]) => {
      subjects.forEach(subject => {
        units.forEach((unit, i) => {
          data.push({
            branch,
            year,
            semester,
            subject,
            unit,
            topic: `${subject} - ${unit}`,
            link: `https://example.com/${subject.toLowerCase().replace(/ /g, "-")}-unit${i + 1}.pdf`,
            addedBy
          });
        });
      });
    });
  });
}

// Branch-specific subject mappings
const eceSubjects = {
  "2nd Year": { "1st sem": ["EMF", "DSD"], "2nd sem": ["STLD", "RFT"] },
  "3rd Year": { "1st sem": ["MPMC", "DICA"], "2nd sem": ["DC", "VLSI"] },
  "4th Year": { "1st sem": ["ES", "OPTICAL"] }
};
addBranchSubjects("ECE", eceSubjects);

const eeeSubjects = {
  "2nd Year": { "1st sem": ["EMF", "NA"], "2nd sem": ["PSA", "EMT"] },
  "3rd Year": { "1st sem": ["CONTROL", "MACHINES"], "2nd sem": ["PE", "PSOC"] },
  "4th Year": { "1st sem": ["HV", "FEP"] }
};
addBranchSubjects("EEE", eeeSubjects);

const civilSubjects = {
  "2nd Year": { "1st sem": ["SOM", "BMC"], "2nd sem": ["FM", "SURVEYING"] },
  "3rd Year": { "1st sem": ["RCC", "STEEL"], "2nd sem": ["WRE", "TQM"] },
  "4th Year": { "1st sem": ["CEPM", "EE"] }
};
addBranchSubjects("CIVIL", civilSubjects);

const mechSubjects = {
  "2nd Year": { "1st sem": ["MOS", "THERMO"], "2nd sem": ["KOM", "FM"] },
  "3rd Year": { "1st sem": ["DOM", "MT"], "2nd sem": ["HT", "MECHATRONICS"] },
  "4th Year": { "1st sem": ["CAD", "CAM"] }
};
addBranchSubjects("MECH", mechSubjects);

const itSubjects = {
  "2nd Year": { "1st sem": ["DS", "OOP"], "2nd sem": ["OS", "DBMS"] },
  "3rd Year": { "1st sem": ["CN", "WT"], "2nd sem": ["SE", "CD"] },
  "4th Year": { "1st sem": ["ML", "BIGDATA"] }
};
addBranchSubjects("IT", itSubjects);

const aidsSubjects = {
  "2nd Year": { "1st sem": ["ML", "PYTHON"], "2nd sem": ["DAA", "ST"] },
  "3rd Year": { "1st sem": ["NLP", "AI"], "2nd sem": ["CV", "DL"] },
  "4th Year": { "1st sem": ["RL", "XAI"] }
};
addBranchSubjects("AIDS", aidsSubjects);

const csitSubjects = {
  "2nd Year": { "1st sem": ["CN", "DS"], "2nd sem": ["OS", "DBMS"] },
  "3rd Year": { "1st sem": ["WT", "SE"], "2nd sem": ["CD", "AI"] },
  "4th Year": { "1st sem": ["DL", "ML"] }
};
addBranchSubjects("CSIT", csitSubjects);

// Write to file
fs.writeFileSync('study_data.json', JSON.stringify(data, null, 2));
console.log("✅ Data generation completed. File saved as study_data.json");
