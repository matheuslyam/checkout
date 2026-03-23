const fs = require('fs');
const pdf = require('pdf-parse');

console.log("pdf export:", typeof pdf);
console.log("pdf keys:", Object.keys(pdf));

let dataBuffer = fs.readFileSync('Catalogo Varejo- Ambtus.pdf');
let parseFunc = typeof pdf === 'function' ? pdf : (pdf.default || pdf.pdf);

if (parseFunc) {
    parseFunc(dataBuffer).then(function(data) {
        fs.writeFileSync('pdf_text.txt', data.text);
        console.log('Success extraction!');
    }).catch(function(e) { console.error("Error inside:", e.message); });
} else {
    console.error("Could not find parsing function");
}
