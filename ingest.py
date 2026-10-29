import sys
from pathlib import Path

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv


sys.stdout.reconfigure(encoding="utf-8")

load_dotenv()


# =========================
# 1. ĐỌC KNOWLEDGE BASE
# =========================

loader = DirectoryLoader(
    path="./knowledge",
    glob="**/*.md",
    loader_cls=TextLoader,
    loader_kwargs={"encoding": "utf-8"},
    show_progress=True,
    use_multithreading=True,
)

docs = loader.load()

print(f"Số documents: {len(docs)}")


# =========================
# 2. CHUNKING
# =========================

MARKDOWN_SEPARATOR = [
    "\n#{1,6} ",
    "```\n",
    "\n\\*\\*\\**\n",
    "\n---+\n",
    "\n___+\n",
    "\n\n",
    " ",
    "",
]

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    add_start_index=True,
    strip_whitespace=True,
    separators=MARKDOWN_SEPARATOR,
)

splits = text_splitter.split_documents(docs)

print(f"Số chunks: {len(splits)}")


# =========================
# 3. EMBEDDING
# =========================

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)


# =========================
# 4. TẠO FAISS
# =========================

vectorstore = FAISS.from_documents(
    documents=splits,
    embedding=embeddings,
)


# =========================
# 5. LƯU VECTORSTORE
# =========================

Path("./vectorstore").mkdir(
    parents=True,
    exist_ok=True,
)

vectorstore.save_local("./vectorstore")

print("Đã lưu FAISS vào ./vectorstore")