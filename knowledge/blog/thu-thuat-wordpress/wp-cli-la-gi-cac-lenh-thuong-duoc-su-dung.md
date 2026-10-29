---
title: "WP CLI là gì? Các lệnh thường được sử dụng để vận hành website"
url: https://hanoiweb.com.vn/wp-cli-la-gi-cac-lenh-thuong-duoc-su-dung/
category: blog/thu-thuat-wordpress
date: 2025-08-23
source: hanoiweb.com.vn
description: "WP CLI là gì? Các lệnh thường được sử dụng để vận hành website"
---

# WP CLI là gì? Các lệnh thường được sử dụng để vận hành website
Trong quá trình quản trị và phát triển website WordPress, chắc hẳn bạn đã quen với việc thao tác thông qua giao diện quản trị (Admin Dashboard). Tuy nhiên, đối với những người quản trị nhiều website hoặc làm dịch vụ cài đặt, tối ưu WordPress, việc sử dụng giao diện đồ họa đôi khi tốn khá nhiều thời gian. Đây chính là lúc WP CLI phát huy sức mạnh.
Bài viết này sẽ giúp bạn hiểu rõ:
- WP CLI là gì
- Ưu điểm nổi bật của WP CLI
- Những lệnh WP CLI thường dùng trong quá trình quản trị website
- Một số lưu ý và kinh nghiệm thực tế khi sử dụng công cụ này
Hãy cùng bắt đầu tìm hiểu chi tiết!
## 1. WP CLI là gì?
WP CLI (WordPress Command Line Interface) là công cụ hỗ trợ quản trị WordPress thông qua giao diện dòng lệnh (Command Line) thay vì sử dụng giao diện đồ họa truyền thống.
Nói cách khác, thay vì phải đăng nhập vào trang quản trị, click chuột vào nhiều menu khác nhau để thực hiện các thao tác, bạn chỉ cần nhập một vài dòng lệnh đơn giản. WP CLI sẽ giúp bạn:
- Cài đặt hoặc cập nhật WordPress.
- Quản lý plugin, theme nhanh chóng.
- Tạo và chỉnh sửa người dùng.
- Quản lý cơ sở dữ liệu.
- Tùy chỉnh nhiều cài đặt nâng cao mà không cần truy cập vào trang Admin.
WP CLI là gì
Chỉ với một dòng lệnh, bạn có thể thực hiện những thao tác mà nếu dùng giao diện sẽ mất vài phút. Điều này đặc biệt hữu ích cho các developer, sysadmin, freelancer thường xuyên triển khai hoặc quản lý nhiều website WordPress.
## 2. Lợi ích khi sử dụng WP CLI
Không phải ngẫu nhiên mà WP CLI ngày càng phổ biến trong cộng đồng WordPress. Công cụ này mang lại nhiều lợi ích thực tế:
### 2.1. Tiết kiệm thời gian
Một tác vụ cài đặt WordPress mới qua giao diện có thể mất 5–10 phút. Nhưng với WP CLI, chỉ cần chưa tới 1 phút là bạn đã hoàn tất mọi thứ nhờ script tự động.
### 2.2. Quản lý website dễ dàng hơn
Bạn có thể quản lý hàng chục plugin, theme hoặc thực hiện backup database chỉ với một vài dòng lệnh, thay vì phải thao tác thủ công trong Dashboard.
Lợi ích WP CLI
### 2.3. Tự động hóa quy trình
WP CLI cho phép bạn viết script (tập hợp nhiều lệnh) để cài đặt website hoàn chỉnh theo mẫu. Ví dụ: cài sẵn theme, plugin, cấu hình permalink, xóa bài viết mặc định,… chỉ bằng một file install.sh.
### 2.4. Không phụ thuộc vào giao diện web
Ngay cả khi bạn bị lỗi “white screen of death” (trang trắng WordPress), không vào được admin, WP CLI vẫn giúp bạn chỉnh sửa tùy chọn hoặc xóa plugin gây lỗi.
### 2.5. Hiệu quả cho server và VPS
Nếu bạn dùng VPS hoặc hosting hỗ trợ SSH, WP CLI sẽ giúp giảm tải tài nguyên hơn so với việc cài plugin quản lý hay thao tác qua dashboard.
## 3. Cách cài đặt WP CLI
Để sử dụng WP CLI, bạn cần:
- Máy chủ chạy Linux/Unix hoặc macOS (Windows vẫn dùng được nhưng cần thêm WSL hoặc Cygwin).
- PHP 5.6+ và MySQL 5.5+.
- Quyền truy cập SSH vào hosting hoặc VPS.
Các bước cài đặt cơ bản:
- Tải file wp-cli.phar curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
- Cấp quyền thực thi chmod +x wp-cli.phar
- Di chuyển vào thư mục bin để có thể gọi bằng lệnh wp sudo mv wp-cli.phar /usr/local/bin/wp
- Kiểm tra cài đặt thành công wp --info
Nếu hệ thống trả về thông tin phiên bản, nghĩa là WP CLI đã hoạt động.
## 4. Các lệnh WP CLI thường được sử dụng
Dưới đây là những lệnh WP CLI phổ biến và hữu ích nhất khi quản trị website WordPress.
### 4.1. Lệnh cài đặt WordPress
- Tải core WordPress về server wp core download
- Tạo file cấu hình wp-config.php wp config create --dbname=ten_db --dbuser=user_db --dbpass=matkhau --dbhost=localhost
- Cài đặt website mới wp core install --url="domain.com" --title="Ten Website" --admin_user="admin" --admin_password="password" --admin_email="email@domain.com"
### 4.2. Quản lý plugin
- Cài plugin mới wp plugin install yoast-seo --activate
- Cài nhiều plugin cùng lúc wp plugin install contact-form-7 wordfence akismet --activate
- Cập nhật tất cả plugin wp plugin update --all
- Xóa plugin wp plugin delete ten-plugin
### 4.3. Quản lý theme
- Cài đặt theme mới wp theme install astra --activate
- Cập nhật theme wp theme update --all
- Xóa theme không dùng wp theme delete twentytwenty
### 4.4. Quản lý cơ sở dữ liệu
- Xuất database wp db export backup.sql
- Nhập database wp db import backup.sql
- Tối ưu database wp db optimize
### 4.5. Quản lý người dùng
- Tạo user mới wp user create tenuser email@domain.com --role=editor --user_pass=matkhau
- Xóa user wp user delete 2 --reassign=1 (Xóa user ID 2 và gán bài viết cho user ID 1).
### 4.6. Cập nhật WordPress core
- Cập nhật core lên phiên bản mới nhất wp core update
- Cập nhật database sau khi nâng cấp wp core update-db
### 4.7. Quản lý bài viết & option
- Xóa bài viết mặc định wp post delete 1 --force
- Cập nhật mô tả website wp option update blogdescription "Website chia sẻ kiến thức WordPress"
- Chỉnh permalink wp option update permalink_structure "/%postname%/" wp rewrite flush --hard
## 5. Kinh nghiệm sử dụng WP CLI hiệu quả
- Luôn backup trước khi thao tác: Dù WP CLI mạnh mẽ, nhưng chỉ một dòng lệnh sai cũng có thể gây lỗi hệ thống.
- Kết hợp với script tự động: Hãy viết sẵn file install.sh chứa các lệnh cơ bản để triển khai nhanh nhiều website.
- Hạn chế dùng trên shared hosting yếu: Một số hosting giá rẻ không hỗ trợ SSH hoặc giới hạn quyền, khi đó bạn khó tận dụng được WP CLI.
- Ghi nhớ các lệnh cơ bản: Tập trung vào core, plugin, theme, db, user và option là đã đủ cho hầu hết công việc.
## 6. Kết luận
WP CLI không chỉ là một công cụ tiện lợi, mà còn là “trợ thủ đắc lực” giúp quản trị website WordPress hiệu quả và tiết kiệm thời gian. Với WP CLI, bạn có thể:
- Cài đặt website chỉ trong vài giây.
- Quản lý plugin, theme nhanh chóng.
- Tối ưu database, cập nhật core dễ dàng.
- Thực hiện các tùy chỉnh nâng cao ngay cả khi không vào được Dashboard.
Nếu bạn đang quản lý nhiều website hoặc thường xuyên triển khai WordPress cho khách hàng, việc làm quen và thành thạo WP CLI sẽ giúp tăng năng suất gấp nhiều lần.
Hãy thử áp dụng ngay hôm nay và trải nghiệm sự khác biệt mà WP CLI mang lại!
THÔNG TIN LIÊN HỆ:
- Hotline: 0376.175.030
- Website: https://hanoiweb.com.vn/
- Fanpage:Hanoiweb thiết kế website theo yêu cầu
## 7. Lợi ích vốn có của WP CLI
Để tổng kết, chúng ta hãy cùng nhấn mạnh lại những lợi ích nổi bật khiến WP CLI trở thành một công cụ gần như “bắt buộc” cho những ai quản lý WordPress ở mức chuyên nghiệp:
### 7.1. Tốc độ và hiệu suất
Không ai muốn mất hàng giờ đồng hồ chỉ để cài đặt hoặc cập nhật một website WordPress. Với WP CLI, mọi việc diễn ra trong chớp mắt. Một website mới có thể hoàn thiện phần khung cơ bản trong chưa đến một phút. Đây là điều mà giao diện Dashboard truyền thống khó có thể so sánh.
### 7.2. Đơn giản hóa công việc phức tạp
Thay vì phải điều hướng qua nhiều trang quản trị, mở hàng loạt tab trình duyệt, bạn chỉ cần nhớ vài lệnh cơ bản. Những tác vụ như xóa bài viết mặc định, cài plugin SEO, chỉnh permalink,… chỉ cần vài dòng lệnh, rất thuận tiện và chính xác.
### 7.3. Khả năng tự động hóa cao
WP CLI tỏa sáng nhất khi kết hợp với script tự động. Bạn có thể viết một file bash để thiết lập toàn bộ website: tải core WordPress, tạo user admin, cài theme ưa thích, kích hoạt plugin bắt buộc, xóa plugin mặc định. Sau này, khi triển khai nhiều dự án, bạn chỉ việc chạy file script và tiết kiệm hàng giờ lao động lặp lại.
### 7.4. Công cụ cứu cánh khi gặp sự cố
Một ưu điểm ít được chú ý nhưng cực kỳ quan trọng: WP CLI hoạt động ngay cả khi giao diện website bị lỗi nặng, không thể đăng nhập Admin. Chẳng hạn, nếu một plugin gây lỗi nghiêm trọng, bạn chỉ cần chạy:
Lập tức website trở lại bình thường. Điều này giúp bạn xử lý sự cố nhanh gọn, không phụ thuộc vào trình duyệt hay cPanel.
### 7.5. Phù hợp với môi trường làm việc chuyên nghiệp
Đối với lập trình viên và quản trị server, WP CLI là “chuẩn mực” để làm việc chuyên nghiệp. Thay vì thao tác thủ công, bạn có thể tích hợp WP CLI vào CI/CD pipeline, deploy website chỉ bằng một lệnh duy nhất. Đây là cách làm mà nhiều công ty công nghệ và agency quốc tế áp dụng để tiết kiệm thời gian, giảm thiểu rủi ro và đảm bảo tính đồng bộ.
