from pathlib import Path

from pypdf import PdfReader
from docx import Document


class DocumentParser:
    """
    Extracts plain text from supported document formats.

    Currently supported:
    - PDF
    - DOCX
    """

    SUPPORTED_EXTENSIONS = {
        ".pdf",
        ".docx",
    }

    def extract_text(self, file_path: str) -> str:
        """
        Detect file type and extract text.
        """

        extension = Path(file_path).suffix.lower()

        if extension == ".pdf":
            return self._extract_pdf(file_path)

        if extension == ".docx":
            return self._extract_docx(file_path)

        raise ValueError(
            f"Unsupported file type: {extension}"
        )

    def _extract_pdf(self, file_path: str) -> str:

        reader = PdfReader(file_path)

        text = []

        for page in reader.pages:

            page_text = page.extract_text()

            if page_text:

                text.append(page_text)

        return "\n".join(text)

    def _extract_docx(self, file_path: str) -> str:

        document = Document(file_path)

        text = []

        for paragraph in document.paragraphs:

            if paragraph.text.strip():

                text.append(paragraph.text)

        return "\n".join(text)