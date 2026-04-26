import PyPDF2

def dump_pdf(filename, output_name):
    try:
        reader = PyPDF2.PdfReader(filename)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        with open(output_name, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Dumped {filename} to {output_name}")
    except Exception as e:
        print(f"Error reading {filename}: {e}")

if __name__ == "__main__":
    dump_pdf("GEO TEST ENGLISH.pdf", "debug_english.txt")
    dump_pdf("GEO TEST TAMIL.pdf", "debug_tamil.txt")
