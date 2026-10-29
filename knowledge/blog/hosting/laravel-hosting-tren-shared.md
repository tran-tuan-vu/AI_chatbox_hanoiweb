---
title: "Cách Triển Khai Laravel Hosting trên Shared trong 12 Phút"
url: https://hanoiweb.com.vn/laravel-hosting-tren-shared/
category: blog/hosting
date: 2025-01-21
source: hanoiweb.com.vn
description: "Laravel là một framework PHP mạnh mẽ và phổ biến, được sử dụng rộng rãi để phát triển các ứng dụng web. Tuy nhiên, việc triển khai Laravel Hosting trên shared"
---

Laravel là một framework PHP mạnh mẽ và phổ biến, được sử dụng rộng rãi để phát triển các ứng dụng web. Tuy nhiên, việc triển khai Laravel Hosting trên shared hosting có thể là một thử thách với người mới bắt đầu. Trong bài viết này, bạn sẽ được hướng dẫn từng bước chi tiết cách triển khai Laravel trên shared hosting trong vòng 12 phút, bao gồm cài đặt, kết nối tên miền và thiết lập SSL để đưa ứng dụng Laravel của bạn vào hoạt động.
Mục lục
Toggle
## 1. Shared Hosting là gì? Tại sao chọn Shared Hosting?
Shared Hosting là gì
### Shared Hosting là gì?
Shared hosting là dịch vụ lưu trữ web chia sẻ tài nguyên của một máy chủ duy nhất với nhiều website khác nhau. Đây là lựa chọn phổ biến cho các dự án nhỏ và trung bình vì chi phí thấp và dễ quản lý.
### Tại sao nên chọn Shared Hosting cho Laravel Hosting?
- Tiết kiệm chi phí: Shared hosting thường rẻ hơn so với VPS hay Cloud hosting, phù hợp với các doanh nghiệp nhỏ hoặc cá nhân.
- Dễ sử dụng: Bạn không cần quá nhiều kiến thức về máy chủ để vận hành.
- Hỗ trợ PHP và MySQL: Hầu hết các nhà cung cấp shared hosting đều hỗ trợ các phiên bản PHP mới nhất, đảm bảo hoạt động ổn định cho Laravel.
## 2. Các bước triển khai Laravel Hosting
Các bước triển khai Laravel Hosting
### Bước 1: Chọn nhà cung cấp hosting uy tín
Lựa chọn một nhà cung cấp uy tín như Hostinger để đảm bảo chất lượng dịch vụ và hỗ trợ. Gói Premium Shared Hosting là một lựa chọn tốt, cung cấp:
- Hỗ trợ tới 100 website.
- 100 GB SSD.
- Miễn phí tên miền và chứng chỉ SSL năm đầu.
### Bước 2: Cài đặt PHP và SSH trên hosting
- Đăng nhập vào bảng điều khiển (hPanel).
- Chọn PHP Configuration trong mục Advanced và đảm bảo cài đặt phiên bản PHP 8.1 hoặc mới hơn.
- Bật các extension cần thiết như: pdo, mbstring, openssl, tokenizer.
- Kích hoạt SSH Access để thực hiện các lệnh cấu hình từ xa.
### Bước 3: Kết nối SSH và cài đặt Composer
- Kết nối SSH: Sử dụng lệnh SSH để kết nối đến máy chủ: bash Sao chép ssh username@host Thay username và host bằng thông tin từ nhà cung cấp.
- Cài đặt Composer: Kiểm tra phiên bản Composer hiện tại bằng lệnh: bash Sao chép composer --version Nếu chưa có Composer phiên bản 2, tải về: bash Sao chép php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" php composer-setup.php
### Bước 4: Tạo hoặc tải dự án Laravel lên hosting
- Tạo một dự án mới: bash Sao chép php composer.phar create-project laravel/laravel my-laravel-app
- Hoặc tải lên dự án hiện có qua Git: bash Sao chép git clone <repository-url> your-project
### Bước 5: Thiết lập thư mục public_html
Laravel yêu cầu thư mục public làm gốc cho website. Thực hiện tạo symbolic link:
bash
Sao chép
ln
### Bước 6: Tạo database và cập nhật cấu hình
- Truy cập mục Databases trong hPanel, tạo database, username và password.
- Cập nhật file .env trong Laravel với thông tin database: env Sao chép DB_CONNECTION=mysql DB_HOST=127.0.0.1 DB_PORT=3306 DB_DATABASE=your_database_name DB_USERNAME=your_username DB_PASSWORD=your_password
- Chạy migration để tạo bảng: bash Sao chép php artisan migrate
### Bước 7: Thiết lập SSL và kiểm tra website
- Truy cập mục SSL trên hPanel và kích hoạt SSL cho tên miền của bạn.
- Kiểm tra website bằng cách truy cập vào tên miền đã cấu hình.
## 3. Lợi ích khi sử dụng Laravel Hosting trên Shared Hosting
Lợi ích khi sử dụng Laravel Hosting trên Shared Hosting
### Tiết kiệm chi phí
Shared hosting là lựa chọn lý tưởng cho các dự án nhỏ hoặc trung bình với mức chi phí thấp, giúp bạn tiết kiệm đáng kể so với VPS hoặc Cloud hosting.
### Dễ quản lý
Laravel Hosting trên shared hosting không yêu cầu kiến thức chuyên sâu về máy chủ, nhờ giao diện điều khiển thân thiện và hỗ trợ từ nhà cung cấp.
### Hỗ trợ đầy đủ tính năng
Dù có chi phí thấp, shared hosting vẫn hỗ trợ đầy đủ các tính năng cần thiết như PHP, MySQL, và SSH, đảm bảo ứng dụng Laravel của bạn hoạt động mượt mà.
## 4. Một số lưu ý khi triển khai Laravel Hosting
Một số lưu ý khi triển khai Laravel Hosting
- Chọn nhà cung cấp đáng tin cậy: Đảm bảo dịch vụ có uptime cao và hỗ trợ tốt.
- Bảo mật dữ liệu: Luôn sử dụng SSL và cập nhật framework thường xuyên.
- Tối ưu hiệu suất: Sử dụng caching và CDN để tăng tốc độ tải trang.
## Kết luận
Laravel Hosting trên shared hosting là một giải pháp tuyệt vời cho các dự án nhỏ và vừa, nhờ chi phí thấp và khả năng triển khai nhanh chóng. Với hướng dẫn chi tiết trên, bạn có thể dễ dàng đưa ứng dụng Laravel vào hoạt động chỉ trong vòng 12 phút.
Nếu bạn thấy bài viết hữu ích, hãy chia sẻ và để lại ý kiến của bạn. Đừng quên theo dõi để cập nhật thêm các bài viết hữu ích khác về Laravel Hosting.
