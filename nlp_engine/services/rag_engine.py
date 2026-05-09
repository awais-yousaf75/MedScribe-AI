# ============================================================
# RAG Engine — FAISS Vector Store + HuggingFace Embeddings
# ============================================================
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

# Shared retriever (initialized once at startup)
retriever = None


def build_vector_store(documents: list, embedding_model: str) -> None:
    global retriever

    print(f"⏳ Loading embedding model: {embedding_model}")

    embeddings = HuggingFaceEmbeddings(
        model_name=embedding_model,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        length_function=len,
    )

    docs = []
    for i, text in enumerate(documents):
        chunks = splitter.split_text(text.strip())
        for j, chunk in enumerate(chunks):
            docs.append(Document(
                page_content=chunk,
                metadata={"source": f"medical_kb_{i}", "chunk": j},
            ))

    print(f"📄 Indexed {len(docs)} chunks from {len(documents)} documents")

    vector_store = FAISS.from_documents(docs, embeddings)
    retriever    = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 4},
    )

    print("✅ FAISS vector store ready")


def retrieve_context(query: str, k: int = 4) -> str:
    if retriever is None:
        raise RuntimeError("Vector store not initialized — call build_vector_store() first")

    docs = retriever.invoke(query)
    return "\n\n---\n\n".join(
        f"[Medical Reference {i+1}]\n{doc.page_content}"
        for i, doc in enumerate(docs)
    )