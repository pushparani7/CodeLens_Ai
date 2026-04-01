# CodeLens AI — Live Demo Output

> This file contains real output from CodeLens AI running against a live GitHub repository.
> Generated using `npm run demo` with Gemini 1.5 Flash.

---

## Demo 1 — Generate Interview Questions
**Target repo:** `https://github.com/pushparani7/EDA_project`
**Role:** Senior

```

gemini-1.5-flash


npm run demo

https://github.com/pushparani7/EDA_project


npm run demo
PS C:\code_lens_agent> npm run demo

> codelens-ai@1.0.0 demo
> node demo/index.js



   ██████╗ ██████╗ ██████╗ ███████╗██╗     ███████╗███╗   ██╗███████╗
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██║     ██╔════╝████╗  ██║██╔════╝
  ██║     ██║   ██║██║  ██║█████╗  ██║     █████╗  ██╔██╗ ██║███████╗
  ██║     ██║   ██║██║  ██║██╔══╝  ██║     ██╔══╝  ██║╚██╗██║╚════██║
  ╚██████╗╚██████╔╝██████╔╝███████╗███████╗███████╗██║ ╚████║███████║
   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝
                    Your GitHub Mentor Agent

────────────────────────────────────────────────────────────
  1. 🔍  Explain a repo
  2. ❓  Generate interview questions
  3. 🛠️   Suggest improvements
  4. 💬  Explain specific code
  5. 🚪  Exit
────────────────────────────────────────────────────────────
? Choose (1-5): 1

════════════════════════════════════════════════════════════
  CodeLens AI — Explain Repo
════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────

? GitHub repo URL or local path to explain: https://github.com/pushparani7/EDA_project
[CodeLens] Fetching repo: pushparani7/EDA_project
[CodeLens] Found 2 files to analyze
⠋ Thinking...   # EDA_project — Repository Overview

## What It Does
This repository contains a Python-based resume parser implemented as a Jupyter Notebook. It's designed to extract key information such as contact details, skills, education, and work experience from resumes in PDF and DOCX formats, leveraging natural language processing (NLP) and regular expressions.

## Tech Stack
*   **Language**: Python 3
*   **Key Libraries**:
    *   `pdfminer.six`: For extracting text from PDF documents.
    *   `python-docx`: For extracting text from Microsoft Word (.docx) documents.
    *   `spacy`: For advanced NLP tasks, including named entity recognition (NER) for education and experience.
    *   `nltk`: Natural Language Toolkit, used for tokenization and potentially other text processing.    
    *   `pandas`: Although not explicitly used in the provided snippet, it's a common data analysis library often used with extracted data.
    *   `re`: Python's built-in regular expression module for pattern matching.
    *   `os`: For interacting with the operating system, likely for file path manipulation.
    *   `openpyxl`: For reading/writing Excel files, though its direct use for resume parsing isn't clear from the snippet.
*   **Tooling**: Jupyter Notebook (runnable in Google Colab).

## Project Structure
```
.
├── README.md               # Project title and brief description.
└── Resume_Parser.ipynb     # The core Jupyter Notebook containing all the resume parsing logic.
```

## How It Works — Main Flow
The `Resume_Parser.ipynb` notebook executes sequentially to perform its task:

1.  **Environment Setup**: Installs necessary Python packages (`pdfminer.six`, `spacy`) and downloads the `en_core_web_sm` spaCy model.
2.  **Library Imports**: Imports all required modules like `re`, `os`, `nltk`, `spacy`, `pdfminer.six`, `docx`, and `openpyxl`.
3.  **Text Extraction Functions**: Defines helper functions to read content from different resume file formats:
    *   `extract_text_from_pdf(pdf_path)`: Uses `pdfminer.six` to convert a PDF file into a string of text.
    *   `extract_text_from_docx(docx_path)`: Uses `python-docx` to extract text from a DOCX file.
4.  **Information Extraction Functions**: A set of specialized functions are defined to parse specific data points from the extracted raw text:
    *   `extract_contact_info(text)`: Employs regular expressions to find email addresses and phone numbers.
    *   `extract_skills(text)`: Identifies skills by matching keywords from a pre-defined list against the resume text, using `nltk` for tokenization.
    *   `extract_education(text)`: Uses `spacy`'s NER capabilities (specifically the `ORG` entity type) and a list of education-related keywords to find universities, degrees, and graduation years.
    *   `extract_experience(text)`: Leverages `spacy` for NER and regular expressions to identify potential work experience sections and extract relevant details like job titles, companies, and durations.        
5.  **Main Parsing Orchestration**: A `parse_resume(file_path)` function acts as the central orchestrator. It determines the file type (PDF or DOCX), calls the appropriate text extraction function, and then sequentially passes the extracted text to each of the information extraction functions.
6.  **Output**: The `parse_resume` function compiles all extracted information into a structured format (likely a dictionary or similar) for further analysis or display. (The provided snippet ends before showing the direct application of `parse_resume` to a file and its final output.)

## Key Design Decisions
1.  **Modular Extraction**: The parsing logic is broken down into distinct functions, each responsible for extracting a specific type of information (e.g., contact, skills, education, experience). This improves readability and maintainability.
2.  **Multi-format Support**: The project explicitly handles both PDF and DOCX resume formats, broadening its applicability.
3.  **Hybrid NLP Approach**: It combines rule-based methods (regular expressions for contact info, keyword matching for skills) with more advanced NLP techniques (spaCy's NER for education and experience) to achieve robust information extraction.
4.  **Interactive Development**: The choice of a Jupyter Notebook indicates an emphasis on iterative development, data exploration, and clear step-by-step execution, which is common in data analytics projects.   

## Entry Points
The primary entry point for understanding this project is the `Resume_Parser.ipynb` notebook.
*   **For setup**: Start with the first code cells that handle `pip install` and `spacy download`.        
*   **For core logic**: Review the helper functions like `extract_text_from_pdf`, `extract_contact_info`, `extract_skills`, `extract_education`, and `extract_experience`.
*   **For overall flow**: Examine the `parse_resume` function, as it orchestrates all the individual extraction steps.

## Potential Gotchas
*   **Hardcoded Lists for Extraction**: The effectiveness of skill and education extraction heavily relies on the completeness and accuracy of the hardcoded `SKILLS` and `EDUCATION` keyword lists within the notebook. These might need frequent updates to stay relevant.
*   **Regex Fragility**: Regular expressions, while powerful, can be brittle. Small variations in resume formatting (e.g., phone number formats, date representations) might cause the `extract_contact_info` and `extract_experience` functions to miss information.
*   **SpaCy Model Dependence**: The project depends on the `en_core_web_sm` spaCy model. If this model changes or is not downloaded correctly, the NLP-driven extraction functions will fail.
*   **Limited Error Handling**: As is common with Jupyter notebooks, robust error handling for file not found, corrupted files, or parsing failures might be minimal or absent, which could make it less resilient in a production environment.
*   **Scalability**: Designed for individual resume parsing, processing a large batch of resumes might require additional orchestration or a more robust framework than a single notebook.

────────────────────────────────────────────────────────────
✓ Done.

```

---

## How to Run

```bash
git clone https://github.com/YOUR_USERNAME/codelens-ai
cd codelens-ai
npm install
export GOOGLE_API_KEY=your-key-here   # or $env:GOOGLE_API_KEY on Windows
npm run demo
```

## All 4 Skills Work

| Skill | Command | Status |
|-------|---------|--------|
| Explain Repo | `npm run demo:explain` | ✅ Working |
| Interview Questions | `npm run demo:interview` | ✅ Working |
| Suggest Improvements | `npm run demo:improve` | ✅ Working |
| Explain Code | `npm run demo:explain-code` | ✅ Working |