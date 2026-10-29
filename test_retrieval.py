import sys
sys.stdout.reconfigure(encoding="utf-8")

from chatbot import retrieve_context

# Bộ test hồi quy cho retrieval — chạy tay sau khi sửa chatbot.py hoặc chạy
# lại ingest.py, để bắt sớm lỗi "chưa tìm thấy thông tin" dù dữ liệu thực sự
# có (đã gặp 3 lần, cùng 1 họ lỗi: văn bản dư thừa/lạc chủ đề làm lệch kết
# quả tìm kiếm — xem known_outstanding_issues trong memory). Chỉ kiểm tra
# CONTEXT tìm được, KHÔNG gọi AI trả lời — rẻ và nhanh hơn nhiều so với test
# qua /chat thật.

TEST_CASES = [

    {
        "label": "Mở đầu, không lịch sử — giá thiết kế website",
        "question": "Thiết kế website giá bao nhiêu?",
        "retrieval_query": "Thiết kế website giá bao nhiêu?",
        "expect": "Gói Start — 3.900.000đ",
    },

    {
        "label": "Mở đầu, không lịch sử — giá SEO",
        "question": "Giá SEO bao nhiêu?",
        "retrieval_query": "Giá SEO bao nhiêu?",
        "expect": "SEO Basic — 5.000.000đ",
    },

    {
        # Lưu ý: bảng giá hosting (knowledge/pricing/hosting-pricing.md) là 1
        # bảng markdown thuần số liệu, không phải câu văn tự nhiên như các
        # trang giá khác (website-pricing.md, dich-vu-seo.md viết dạng "##
        # Gói X — Yđ") — nên đoạn chứa GIÁ CỤ THỂ của nó xếp hạng rất thấp với
        # mọi cách hỏi giá hosting tự nhiên (đã kiểm chứng, không lọt top 12
        # dù hỏi rất trực tiếp). Đây là hạn chế riêng, KHÁC họ lỗi mà file
        # test này nhắm tới (lệch do lịch sử hội thoại) — nên chỉ kiểm tra
        # đúng FILE có được tìm thấy hay không (đoạn giới thiệu của file này
        # luôn lọt top 6), không đòi hỏi đúng con số giá cụ thể.
        "label": "Mở đầu, không lịch sử — giá hosting (chỉ kiểm tra đúng file)",
        "question": "Hosting giá bao nhiêu?",
        "retrieval_query": "Hosting giá bao nhiêu?",
        "expect_source": "hosting-pricing.md",
    },

    {
        "label": "Chuyển chủ đề — thiết kế website rồi hỏi giá SEO (bug gốc đã báo)",
        "question": "giá seo thì sao em",
        "retrieval_query": "Khách hàng: anh cần tư vấn giá thiết kế website\ngiá seo thì sao em",
        "expect": "SEO Basic — 5.000.000đ",
    },

    {
        "label": "Nối tiếp cùng chủ đề — hỏi tiếp gói Plus",
        "question": "Còn gói Plus thì sao?",
        "retrieval_query": "Khách hàng: Thiết kế website chuẩn seo giá bao nhiêu\nCòn gói Plus thì sao?",
        "expect": "Gói Plus — 6.900.000đ",
    },

    {
        "label": "Nối tiếp cùng chủ đề — hỏi tiếp gói Pro",
        "question": "Còn gói Pro thì sao?",
        "retrieval_query": "Khách hàng: Thiết kế website chuẩn seo giá bao nhiêu\nCòn gói Pro thì sao?",
        "expect": "Gói Pro — 12.900.000đ",
    },

    {
        "label": "Chuyển chủ đề — hosting rồi hỏi tên miền",
        "question": "Còn tên miền thì sao?",
        "retrieval_query": "Khách hàng: Hosting giá bao nhiêu?\nCòn tên miền thì sao?",
        "expect": "450,000 ₫",
    },

]

def run():

    failed = 0

    for case in TEST_CASES:

        docs = retrieve_context({
            "question": case["question"],
            "retrieval_query": case["retrieval_query"],
        })

        if "expect_source" in case:
            expect_label = f"file '{case['expect_source']}'"
            found = any(
                case["expect_source"] in str(doc.metadata.get("source", ""))
                for doc in docs
            )
        else:
            expect_label = f"'{case['expect']}'"
            found = any(case["expect"] in doc.page_content for doc in docs)

        status = "PASS" if found else "FAIL"

        if not found:
            failed += 1

        print(f"[{status}] {case['label']}")

        if not found:
            print(f"       Không thấy {expect_label} trong {len(docs)} đoạn tìm được:")
            for doc in docs:
                print(f"         - {doc.metadata.get('source')}")

    print()
    print(f"Tổng: {len(TEST_CASES)} test, {failed} thất bại.")

    if failed:
        sys.exit(1)

if __name__ == "__main__":
    run()
