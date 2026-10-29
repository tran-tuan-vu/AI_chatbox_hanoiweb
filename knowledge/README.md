# Knowledge Base — hanoiweb.com.vn

Bộ dữ liệu tri thức trích xuất **nguyên văn** từ website https://hanoiweb.com.vn, dùng làm nguồn cho chatbot AI (RAG).

- **Ngày thu thập:** 14/09/2026
- **Tổng số file:** 166 file `.md`
- **Phạm vi:** 33 file trang chính (services / pricing / company / policies / guides) + 133 bài blog
- **Nguyên tắc:** nội dung lấy y nguyên từ trang web, **không bịa thêm, không thêm hoặc bớt dữ liệu**. Các lỗi chính tả, câu trùng lặp, số hotline khác nhau giữa các trang… đều được giữ nguyên như trên website.
- **Kiểm tra độ đầy đủ:** toàn bộ 133 bài blog đã được đối chiếu số ký tự với bản live trên website. 40 bài phát hiện thiếu nội dung ở lần trích xuất đầu tiên đã được crawl lại và ghi đè hoàn chỉnh.

---

## Cấu trúc thư mục

```
knowledge/
├── README.md                    ← file này
│
├── services/                    ← dịch vụ
│   ├── thiet-ke-website.md              (trang chủ – dịch vụ thiết kế website)
│   ├── dich-vu-seo.md                   (/dich-vu-seo-tai-ha-noi/)
│   ├── viet-bai-seo.md                  (/dich-vu-viet-bai-seo-tai-ha-noi/)
│   ├── quang-cao-facebook.md            (/dich-vu-chay-quang-cao-facebook/)
│   ├── quang-cao-google.md              (/dich-vu-chay-quang-cao-google/)
│   ├── quang-cao-tiktok.md              (/dich-vu-chay-quang-cao-tiktok/)
│   ├── quang-cao-zalo.md                (/dich-vu-chay-quang-cao-zalo/)
│   ├── hosting.md                       (/hosting/)
│   ├── ten-mien.md                      (/ten-mien/)
│   ├── thiet-ke-website-theo-nganh/     (6 ngành + 1 bản trùng)
│   │   ├── doanh-nghiep.md   bat-dong-san.md   ban-hang.md
│   │   ├── giao-duc.md       spa.md            noi-that.md
│   │   └── noi-that-v2.md    ← trang /thiet-ke-website-noi-that1/ (bản thứ 2 cùng ngành)
│   └── thiet-ke-website-theo-khu-vuc/   (3 khu vực)
│       ├── trang-tien.md   hang-bac.md   lieu-giai.md
│
├── pricing/                     ← bảng giá
│   ├── website-pricing.md               (/bang-gia/ – Start / Plus / Pro / dimond)
│   ├── website-pricing-khu-vuc.md       (bảng giá dùng trên các trang khu vực)
│   ├── hosting-pricing.md               (bảng giá hosting)
│   └── domain-pricing.md                (bảng giá tên miền .VN + quốc tế)
│
├── company/                     ← thông tin công ty
│   ├── gioi-thieu.md            (/gioi-thieu/)
│   ├── lien-he.md               (/lien-he/)
│   ├── thong-tin-cong-ty.md     (MST, địa chỉ, hotline – trích từ footer)
│   ├── du-an-da-trien-khai.md   (danh sách dự án)
│   ├── faq.md                   (câu hỏi thường gặp)
│   └── tuyen-dung.md            (/tuyen-dung/)
│
├── policies/                    ← chính sách
│   ├── bao-mat.md               (/privacy-policy/)
│   ├── cam-ket-dich-vu.md       (/cam-ket-dich-vu/)
│   └── uu-dai.md                (/chinh-sach-uu-dai/)
│
├── guides/
│   └── huong-dan-nguoi-dung.md  (/huong-dan-nguoi-dung/)
│
└── blog/                        ← 133 bài viết, chia theo chuyên mục của website
    ├── hosting/                 43 bài
    ├── ten-mien/                32 bài
    ├── kien-thuc-website/       26 bài
    ├── vps/                     11 bài
    ├── dich-vu/                  7 bài
    ├── thu-thuat-wordpress/      6 bài
    ├── kien-thuc-seo/            4 bài
    └── kien-thuc-zalo/           4 bài
```

---

## Định dạng file

Mỗi file là Markdown với YAML frontmatter, phần thân là nội dung nguyên văn:

```markdown
---
title: "Tiêu đề trang / bài viết"
url: https://hanoiweb.com.vn/duong-dan/
category: blog/hosting
date: 2025-02-08
source: hanoiweb.com.vn
description: "Meta description của trang"
---

# Nội dung nguyên văn...
```

Các trường frontmatter:

| Trường | Ý nghĩa |
| --- | --- |
| `title` | Thẻ `<title>` của trang |
| `url` | URL gốc — dùng để chatbot trích dẫn nguồn |
| `category` | Nhóm nội dung (trùng với đường dẫn thư mục) |
| `date` | Ngày đăng (chỉ có với bài blog) |
| `description` | Meta description (nếu trang có) |
| `shared_blocks` / `note` | Ghi chú nội bộ ở một số file (khối nội dung dùng chung, trang trùng lặp) |

---

## Lưu ý khi dùng cho chatbot

1. **Chunking:** mỗi heading `##` là một ranh giới chunk hợp lý. Giữ `url` trong metadata của mỗi chunk để bot trả lời kèm link nguồn.
2. **Bảng giá:** các bảng giá xuất hiện ở nhiều trang (trang ngành, trang khu vực). Bản chuẩn nằm trong `pricing/`; các trang ngành/khu vực có ghi chú tham chiếu chéo để tránh trả lời trùng hoặc mâu thuẫn.
3. **Dữ liệu không nhất quán trên website (giữ nguyên, không sửa):**
   - Hotline khác nhau giữa các trang: `0904.558.448` (chân bài blog), `0868274713` (một số trang dịch vụ/blog), số trong trang `/lien-he/`.
   - Địa chỉ khác nhau: `Nhà số 9 Ngách 84 Ngõ 1 Phạm Tuấn Tài, Dịch Vọng Hậu, Cầu Giấy` (footer/thông tin công ty) và `Số 9 Thôn Nhuệ, Đức Thượng, Hoài Đức, Hà Nội` (bài `blog/kien-thuc-website/dich-vu-thiet-ke-website-tai-ha-noi.md`).
   - Trang `/elementor-5549/` có tiêu đề bảng giá ghi "Phường Hàng Bạc" nhưng nội dung là "Phường Liễu Giai" → lưu tại `services/thiet-ke-website-theo-khu-vuc/lieu-giai.md`.
   - `.edu.vn 400.000đ` lặp lại nhiều lần trong khối tên miền quốc tế của `/ten-mien/`.
   - Hai trang cùng ngành nội thất: `/thiet-ke-website-noi-that-chuyen-nghiep/` và `/thiet-ke-website-noi-that1/`.
   - Một số bài blog có đoạn lặp hoặc ký tự thừa (`">`) do lỗi shortcode trên website — giữ nguyên.
4. **Trang không có nội dung:** `/dich-vu/` và `/sample-page/` trong sitemap nhưng phần thân trang trống hoàn toàn → không tạo file.
5. **Không bao gồm:** chuyên mục blog "Nội bộ Hanoiweb" và "Uncategorized" (16 bài) — theo phạm vi đã thống nhất.

---

## Nguồn

Toàn bộ nội dung thuộc về hanoiweb.com.vn. Danh sách URL lấy từ:
- https://hanoiweb.com.vn/page-sitemap.xml (29 URL)
- https://hanoiweb.com.vn/post-sitemap.xml + WP REST API `/wp-json/wp/v2/posts` (lọc theo chuyên mục)
