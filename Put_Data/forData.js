const fs = require("fs");
const path = require('path');

const inputFilePath = path.join(__dirname, 'study_buddy.json');
const outputFilePath = path.join(__dirname, 'study_data.json');


const linkMap = {

    // M1
"M1-1.pdf": "same",
"M1-2.pdf": "same",
"M1-3.pdf": "same",
"M1-4.pdf": "same",
"M1-5.pdf": "same",

// M2 (if needed)
"M2-1.pdf": "same",
"M2-2.pdf": "same",
"M2-3.pdf": "same",
"M2-4.pdf": "same",
"M2-5.pdf": "same",

    // CN
    "CN-1.pdf": "same",
    "CN-2.pdf": "same",
    "CN-3.pdf": "same",
    "CN-4.pdf": "same",
    "CN-5.pdf": "same",
  
    // OS
    "OS-1.pdf": "same",
    "OS-2.pdf": "same",
    "OS-3.pdf": "same",
    "OS-4.pdf": "same",
    "OS-5.pdf": "same",
  
    // DBMS
    "DBMS-1.pdf": "same",
    "DBMS-2.pdf": "same",
    "DBMS-3.pdf": "same",
    "DBMS-4.pdf": "same",
    "DBMS-5.pdf": "same",
  
    // DS
    "DS-1.pdf": "same",
    "DS-2.pdf": "same",
    "DS-3.pdf": "same",
    "DS-4.pdf": "same",
    "DS-5.pdf": "same",
  
    // AI
    "AI-1.pdf": "same",
    "AI-2.pdf": "same",
    "AI-3.pdf": "same",
    "AI-4.pdf": "same",
    "AI-5.pdf": "same",
  
    // ML
    "ML-1.pdf": "same",
    "ML-2.pdf": "same",
    "ML-3.pdf": "same",
    "ML-4.pdf": "same",
    "ML-5.pdf": "same",
  
    // PYTHON
    "PYTHON-1.pdf": "same",
    "PYTHON-2.pdf": "same",
    "PYTHON-3.pdf": "same",
    "PYTHON-4.pdf": "same",
    "PYTHON-5.pdf": "same",
  
    // DAA
    "DAA-1.pdf": "same",
    "DAA-2.pdf": "same",
    "DAA-3.pdf": "same",
    "DAA-4.pdf": "same",
    "DAA-5.pdf": "same",
  
    // NLP
    "NLP-1.pdf": "same",
    "NLP-2.pdf": "same",
    "NLP-3.pdf": "same",
    "NLP-4.pdf": "same",
    "NLP-5.pdf": "same",
  
    // CV
    "CV-1.pdf": "same",
    "CV-2.pdf": "same",
    "CV-3.pdf": "same",
    "CV-4.pdf": "same",
    "CV-5.pdf": "same",
  
    // STLD
    "STLD-1.pdf": "same",
    "STLD-2.pdf": "same",
    "STLD-3.pdf": "same",
    "STLD-4.pdf": "same",
    "STLD-5.pdf": "same",
  
    // EMF
    "EMF-1.pdf": "same",
    "EMF-2.pdf": "same",
    "EMF-3.pdf": "same",
    "EMF-4.pdf": "same",
    "EMF-5.pdf": "same",
  
    // RFT
    "RFT-1.pdf": "same",
    "RFT-2.pdf": "same",
    "RFT-3.pdf": "same",
    "RFT-4.pdf": "same",
    "RFT-5.pdf": "same",
  
    // DICA
    "DICA-1.pdf": "same",
    "DICA-2.pdf": "same",
    "DICA-3.pdf": "same",
    "DICA-4.pdf": "same",
    "DICA-5.pdf": "same",
  
    // DC
    "DC-1.pdf": "same",
    "DC-2.pdf": "same",
    "DC-3.pdf": "same",
    "DC-4.pdf": "same",
    "DC-5.pdf": "same",
  
    // VLSI
    "VLSI-1.pdf": "same",
    "VLSI-2.pdf": "same",
    "VLSI-3.pdf": "same",
    "VLSI-4.pdf": "same",
    "VLSI-5.pdf": "same",
  
    // MPMC
    "MPMC-1.pdf": "same",
    "MPMC-2.pdf": "same",
    "MPMC-3.pdf": "same",
    "MPMC-4.pdf": "same",
    "MPMC-5.pdf": "same",
  
    // TOC
    "TOC-1.pdf": "same",
    "TOC-2.pdf": "same",
    "TOC-3.pdf": "same",
    "TOC-4.pdf": "same",
    "TOC-5.pdf": "same",
  
    // WT
    "WT-1.pdf": "same",
    "WT-2.pdf": "same",
    "WT-3.pdf": "same",
    "WT-4.pdf": "same",
    "WT-5.pdf": "same",
  
    // SE
    "SE-1.pdf": "same",
    "SE-2.pdf": "same",
    "SE-3.pdf": "same",
    "SE-4.pdf": "same",
    "SE-5.pdf": "same",
  
    // CN Lab
    "CNLAB-1.pdf": "same",
    "CNLAB-2.pdf": "same",
    "CNLAB-3.pdf": "same",
    "CNLAB-4.pdf": "same",
    "CNLAB-5.pdf": "same",
  
    // OS Lab
    "OSLAB-1.pdf": "same",
    "OSLAB-2.pdf": "same",
    "OSLAB-3.pdf": "same",
    "OSLAB-4.pdf": "same",
    "OSLAB-5.pdf": "same",
  };

// ✅ Replace all "same" with the current dummy link:
const dummyLink = "https://drive.google.com/file/d/109OYGdzd6YZqAQg_DhySZOyyFAU27cVr/view?usp=sharing";
for (const key in linkMap) {
  if (linkMap[key] === "same") {
    linkMap[key] = dummyLink;
  }
}

function updatePdfLinks(data) {
  for (const obj of data) {
    if ("link" in obj && "subject" in obj && "unit" in obj) {
      const subject = obj.subject.toLowerCase();
      const unitMatch = obj.unit.match(/\d+/); // Extract numeric part like "1" from "1st unit"
      const unit = unitMatch ? unitMatch[0] : "";

      let prefix = "";
      if (subject.toLowerCase().includes("network")) prefix = "CN";
      else if(subject.toLowerCase().includes("m1")) prefix="M1"
      else if(subject.toLowerCase().includes("m2")) prefix="M2"
      else if (subject.toLowerCase().includes("os")) prefix = "OS";
      else if (subject.toLowerCase().includes("dbms")) prefix = "DBMS";
      else if (subject.toLowerCase().includes("ds")) prefix = "DS";
      else if (subject.toLowerCase().includes("ai")) prefix = "AI";
      else if (subject.toLowerCase().includes("ml")) prefix = "ML";
      else if (subject.toLowerCase().includes("python")) prefix = "PYTHON";
      else if (subject.toLowerCase().includes("daa")) prefix = "DAA";
      else if (subject.toLowerCase().includes("st")) prefix = "ST";
      else if (subject.toLowerCase().includes("nlp")) prefix = "NLP";
      else if (subject.toLowerCase().includes("cv")) prefix = "CV";
      else if (subject.toLowerCase().includes("dl")) prefix = "DL";
      else if (subject.toLowerCase().includes("rl")) prefix = "RL";
      else if (subject.toLowerCase().includes("xai")) prefix = "XAI";
      else if (subject.toLowerCase().includes("oop")) prefix = "OOP";
      else if (subject.toLowerCase().includes("wt")) prefix = "WT";
      else if (subject.toLowerCase().includes("se")) prefix = "SE";
      else if (subject.toLowerCase().includes("cd")) prefix = "CD";
      else if (subject.toLowerCase().includes("bigdata")) prefix = "BIGDATA";
      else if (subject.toLowerCase().includes("emf")) prefix = "EMF";
      else if (subject.toLowerCase().includes("dsd")) prefix = "DSD";
      else if (subject.toLowerCase().includes("stld")) prefix = "STLD";
      else if (subject.toLowerCase().includes("rft")) prefix = "RFT";
      else if (subject.toLowerCase().includes("mpmc")) prefix = "MPMC";
      else if (subject.toLowerCase().includes("dica")) prefix = "DICA";
      else if (subject.toLowerCase().includes("dc")) prefix = "DC";
      else if (subject.toLowerCase().includes("vlsi")) prefix = "VLSI";
      else if (subject.toLowerCase().includes("es")) prefix = "ES";
      else if (subject.toLowerCase().includes("optical")) prefix = "OPTICAL";
      else if (subject.toLowerCase().includes("na")) prefix = "NA";
      else if (subject.toLowerCase().includes("psa")) prefix = "PSA";
      else if (subject.toLowerCase().includes("emt")) prefix = "EMT";
      else if (subject.toLowerCase().includes("control")) prefix = "CONTROL";
      else if (subject.toLowerCase().includes("machines")) prefix = "MACHINES";
      else if (subject.toLowerCase().includes("pe")) prefix = "PE";
      else if (subject.toLowerCase().includes("psoc")) prefix = "PSOC";
      else if (subject.toLowerCase().includes("hv")) prefix = "HV";
      else if (subject.toLowerCase().includes("fep")) prefix = "FEP";
      else if (subject.toLowerCase().includes("som")) prefix = "SOM";
      else if (subject.toLowerCase().includes("bmc")) prefix = "BMC";
      else if (subject.toLowerCase().includes("fm")) prefix = "FM";
      else if (subject.toLowerCase().includes("surveying")) prefix = "SURVEYING";
      else if (subject.toLowerCase().includes("rcc")) prefix = "RCC";
      else if (subject.toLowerCase().includes("steel")) prefix = "STEEL";
      else if (subject.toLowerCase().includes("wre")) prefix = "WRE";
      else if (subject.toLowerCase().includes("tqm")) prefix = "TQM";
      else if (subject.toLowerCase().includes("cepc")) prefix = "CEPM";
      else if (subject.toLowerCase().includes("ee")) prefix = "EE";
      else if (subject.toLowerCase().includes("mos")) prefix = "MOS";
      else if (subject.toLowerCase().includes("thermo")) prefix = "THERMO";
      else if (subject.toLowerCase().includes("kom")) prefix = "KOM";
      else if (subject.toLowerCase().includes("dom")) prefix = "DOM";
      else if (subject.toLowerCase().includes("mt")) prefix = "MT";
      else if (subject.toLowerCase().includes("ht")) prefix = "HT";
      else if (subject.toLowerCase().includes("mechatronics")) prefix = "MECHATRONICS";
      else if (subject.toLowerCase().includes("cad")) prefix = "CAD";
      else if (subject.toLowerCase().includes("cam")) prefix = "CAM";
      else if (subject.toLowerCase().includes("m1")) prefix = "M1";
      else if (subject.toLowerCase().includes("m2")) prefix = "M2";
      else if (subject.toLowerCase().includes("chemistry")) prefix = "CHEMISTRY";
      else if (subject.toLowerCase().includes("physics")) prefix = "PHYSICS";
      else if (subject.toLowerCase().includes("bcm")) prefix = "BCME";
      else if (subject.toLowerCase().includes("english")) prefix = "ENGLISH";
      else if (subject.toLowerCase().includes("cp")) prefix = "CP";
      else if (subject.toLowerCase().includes("it work")) prefix = "ITWS";
      else if (subject.toLowerCase().includes("workshop")) prefix = "WORKSHOP";
      else if (subject.toLowerCase().includes("lab")) prefix = "LAB";
      else if (subject.toLowerCase().includes("beee")) prefix = "BEEE";
      else if (subject.toLowerCase().includes("cs")) prefix = "CS";
      else if (subject.toLowerCase().includes("eg")) prefix = "EG";
      else if (subject.toLowerCase().includes("nss")) prefix = "NSS";

      const key = `${prefix}-${unit}.pdf`;

      if (linkMap[key]) {
        obj.link = linkMap[key];
      } else if (obj.link.includes("drive/folders/")) {
        obj.link = dummyLink;
        console.log(`🔁 Replaced folder link for: ${key}`);
      } else {
        console.warn(`⚠️ No link found for key: ${key}`);
      }
    }
  }
    
      
  return data;
}
  

// 🔄 Read -> Update -> Write
fs.readFile(inputFilePath, "utf8", (err, content) => {
  if (err) {
    console.error("❌ Error reading input file:", err);
    return;
  }

  let jsonData;
  try {
    jsonData = JSON.parse(content);
  } catch (parseErr) {
    console.error("❌ Error parsing JSON:", parseErr);
    return;
  }

  const updatedData = updatePdfLinks(jsonData);

  fs.writeFile(outputFilePath, JSON.stringify(updatedData, null, 2), (err) => {
    if (err) {
      console.error("❌ Error writing updated data:", err);
      return;
    }

    console.log("✅ PDF links updated successfully! Saved as", outputFilePath);
  });
});