import json
import PyPDF2

pdf_path = "Catalogo Varejo- Ambtus.pdf"

try:
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for i in range(len(reader.pages)):
            page_text = reader.pages[i].extract_text()
            text += f"\n--- Page {i+1} ---\n" + page_text
            
        with open("pdf_text.txt", "w", encoding="utf-8") as out:
            out.write(text)
        print("Success")
except Exception as e:
    print(f"Error: {e}")
