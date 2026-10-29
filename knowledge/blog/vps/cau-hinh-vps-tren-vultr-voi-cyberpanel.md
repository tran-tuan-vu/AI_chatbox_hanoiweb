---
title: "Cấu hình VPS trên Vultr với CyberPanel | Tạo email tên miền"
url: https://hanoiweb.com.vn/cau-hinh-vps-tren-vultr-voi-cyberpanel/
category: blog/vps
date: 2025-02-07
source: hanoiweb.com.vn
description: "Xin chào các bạn! Hôm nay, chúng ta sẽ cùng tìm hiểu cách cấu hình VPS trên Vultr và cài đặt CyberPanel, đồng thời hướng dẫn bạn cách tạo email theo tên miền"
---

Xin chào các bạn! Hôm nay, chúng ta sẽ cùng tìm hiểu cách cấu hình VPS trên Vultr và cài đặt CyberPanel, đồng thời hướng dẫn bạn cách tạo email theo tên miền một cách nhanh chóng. Đây là một phần quan trọng khi xây dựng một website chuyên nghiệp, giúp bạn quản lý hosting tốt hơn và tạo email doanh nghiệp theo tên miền riêng.
Cấu hình VPS
Toggle
## 1. Mua và cấu hình VPS trên Vultr
### 1.1. Đăng ký tài khoản Vultr
Trước tiên, bạn cần tạo tài khoản trên Vultr bằng cách truy cập Vultr.com và đăng ký tài khoản mới. Khi đăng ký qua link giới thiệu, bạn có thể nhận được 100$ miễn phí để trải nghiệm dịch vụ.
Hướng dẫn tạo VPS Free sài trong 30 ngày
Mình có hướng dẫn cấu hình VPS ở trên Vultr rồi link tại đây nha: Link
### 1.2. Tạo VPS trên Vultr
Sau khi đăng nhập, bạn thực hiện các bước sau để triển khai VPS:
- Nhấn vào Deploy New Server.
- Chọn Cloud Compute.
- Ở mục “CPU & Storage Technology”, chọn AMD High Performance.
- Chọn Vị trí máy chủ phù hợp (ví dụ: London, Singapore…).
- Trong phần Marketplace Apps, tìm và chọn CyberPanel.
- Chọn gói VPS phù hợp, tối thiểu nên là 2GB RAM để đảm bảo hiệu suất.
- Bật tùy chọn IPv6.
- Nhập hostname theo ý muốn và nhấn Deploy Now.
- Chờ khoảng 1-2 phút để hệ thống khởi tạo VPS.
ip của vps
Sau khi VPS đã được tạo thành công, bạn có thể truy cập thông tin chi tiết gồm IP, username, password, v.v.
## 2. Cài đặt và cấu hình CyberPanel
### 2.1. Truy cập VPS qua SSH
Để quản lý VPS, bạn cần kết nối SSH bằng PuTTY hoặc WinSCP:
- Tải PuTTY tại putty.org.
- Mở PuTTY, nhập IP của VPS, chọn Port 22, nhấn Open.
- Khi hộp thoại xuất hiện, chọn Accept.
- Đăng nhập với username: root và password lấy từ Vultr.
### 2.2. Cập nhật CyberPanel
Truy cập vào CyberPanel bằng ip của web
Sau khi đăng nhập vào SSH, chạy lệnh sau để cập nhật CyberPanel:
cyberpanel update
Nhấn Y để đồng ý cập nhật.
### 2.3. Lấy mật khẩu CyberPanel
Nếu bạn quên mật khẩu, có thể reset bằng lệnh:
adminPass cyberpanel
Lưu lại mật khẩu để sử dụng khi đăng nhập vào CyberPanel.
## 3. Đăng nhập vào CyberPanel và tạo website
- Truy cập CyberPanel bằng trình duyệt: https://<IP-VPS>:8090
Lấy mạt khẩu tài khoản r
- Đăng nhập với Username: admin và mật khẩu vừa lấy. ( root, và pass quay lại trang web để lấy mk)
PuTTY để lấy pass đăng nhập vào CyberPanel
- Vào Websites > Create Website.
- Nhập thông tin domain, email, chọn PHP version.
Cấu hình nhập pass, domain
- Nhấn Create Website để hoàn tất.
## 4. Tạo email tên miền trên CyberPanel
### 4.1. Kích hoạt dịch vụ email
- Truy cập CyberPanel > Email > Email Policy.
- Đảm bảo Enable Mail Server đã được bật.
### 4.2. Tạo email theo tên miền
- Vào Email > Create Email.
- Chọn domain và nhập tên email (ví dụ: info@yourdomain.com).
- Đặt mật khẩu và nhấn Create Email.
## 5. Cấu hình SSL cho website và email
### 5.1. Cài đặt SSL cho website
- Vào CyberPanel > SSL > Manage SSL.
Cấu hình SSL
- Chọn domain, nhấn Issue SSL.
- Chờ vài phút để chứng chỉ SSL được cài đặt.
### 5.2. Cài đặt SSL cho email
- Vào CyberPanel > SSL > MailServer SSL.
- Chọn domain và nhấn Issue SSL.
- Kiểm tra bằng cách truy cập: https://mail.yourdomain.com
## Kết luận
Như vậy, bạn đã hoàn tất cấu hình VPS trên Vultr, cài đặt CyberPanel và tạo email tên miền một cách đơn giản. Đây là giải pháp tối ưu giúp bạn quản lý website hiệu quả và xây dựng hệ thống email chuyên nghiệp.
Nếu bạn có bất kỳ câu hỏi nào, hãy để lại bình luận bên dưới nhé! Chúc bạn thành công!
THÔNG TIN LIÊN HỆ:
- Hotline: 0904.558.448
- Website: https://hanoiweb.com.vn/
- Fanpage: hanoiweb
