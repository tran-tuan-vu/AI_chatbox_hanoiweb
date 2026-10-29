from flask import Flask, render_template, request, jsonify, session, Response
from chatbot import ask_question, analyze_visitor, generate_reengagement_message
from functools import wraps
from datetime import datetime
import storage
import sys
import time
import json
import uuid
import os
import secrets

sys.stdout.reconfigure(encoding="utf-8")

app = Flask(__name__)

# ==============================
# CHO PHÉP GIAO DIỆN SITE (giaodien_hanoiweb) GỌI API CROSS-ORIGIN
# ==============================
# Site tĩnh chạy ở origin khác (vd: Live Server) với server chatbot này,
# nên cần bật CORS kèm cookie (credentials) cho đúng origin đó — không đổi
# hành vi của bất kỳ route nào, chỉ thêm header cho phép trình duyệt gọi được.
ALLOWED_WIDGET_ORIGINS = {
    # 5501: port cấu hình sẵn trong giaodien_hanoiweb/.vscode/settings.json
    # (chỉ có tác dụng khi mở đúng thư mục đó làm workspace)
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    # 5500: port mặc định của Live Server khi không đọc được settings trên
    "http://127.0.0.1:5500",
    "http://localhost:5500",
}

@app.after_request
def add_cors_headers(response):

    origin = request.headers.get("Origin")

    if origin in ALLOWED_WIDGET_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"

    return response

# ==============================
# LƯU HÀNH VI KHÁCH TRUY CẬP
# ==============================
# Đọc từ .env, không ghi cứng trong code (code được đưa lên git công khai).
# Chưa đặt thì sinh ngẫu nhiên mỗi lần chạy — cookie session cũ mất hiệu lực
# sau khi restart, nhưng không lộ khoá.
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or secrets.token_hex(32)

# Nạp lại dữ liệu visitor đã lưu từ lần chạy trước (nếu có)
visitor_behaviors = storage.load_all_visitors()

# ==============================
# CHATBOT CHỦ ĐỘNG NHẮN KHÁCH (PROACTIVE)
# ==============================

# Ngưỡng hành vi để kích hoạt lời chào chủ động (chỉ áp dụng khi khách CHƯA chat lần nào)
PROACTIVE_ACTIVE_TIME_THRESHOLD = 45   # giây hoạt động thực sự
PROACTIVE_SCROLL_THRESHOLD = 60        # % scroll sâu nhất

PROACTIVE_MESSAGE = (
    "Dạ, em thấy anh/chị đang tìm hiểu thông tin bên em. "
    "Anh/chị đang quan tâm dịch vụ nào để em tư vấn nhanh giúp mình nhé? 😊"
)

# Tin nhắn chủ động đang chờ gửi tới từng session qua SSE
pending_proactive_messages = {}

def maybe_trigger_proactive_message(visitor):

    if visitor.get("chat_count", 0) > 0:
        return

    if visitor.get("proactive_sent"):
        return

    active_time = visitor.get("active_time", 0)
    max_scroll_depth = visitor.get("max_scroll_depth", 0)

    if active_time >= PROACTIVE_ACTIVE_TIME_THRESHOLD or max_scroll_depth >= PROACTIVE_SCROLL_THRESHOLD:

        visitor["proactive_sent"] = True

        pending_proactive_messages.setdefault(
            visitor["session_id"],
            []
        ).append(PROACTIVE_MESSAGE)

# Ngưỡng "im lặng liên tục ngay bây giờ" để chủ động nhắn lại khi khách ĐANG
# giữa chừng trò chuyện (khác hẳn maybe_trigger_proactive_message ở trên —
# đó là cho khách CHƯA chat lần nào). Lưu ý: idle_time gửi lên mỗi lần là số
# giây kể từ lần hoạt động cuối cùng, KHÔNG PHẢI tổng dồn cả session (xem
# sendBehavior() trong templates/index.html — reset về gần 0 mỗi khi khách
# hoạt động lại) — nên dùng trực tiếp giá trị mỗi lần gửi lên làm tín hiệu
# "đang im lặng liên tục bao lâu", không cần tự cộng dồn như total_idle_time.
REENGAGE_IDLE_THRESHOLD = 300          # 5 phút im lặng liên tục, tab vẫn mở
REENGAGE_ACTIVE_RESET_THRESHOLD = 10   # dưới mức này coi như khách đã hoạt động lại

def maybe_trigger_reengagement(visitor, current_idle_seconds):

    # Chưa từng chat thì không có "mạch đang tư vấn dở" nào để kéo lại —
    # trường hợp đó do maybe_trigger_proactive_message ở trên xử lý
    if visitor.get("chat_count", 0) == 0:
        return

    if current_idle_seconds < REENGAGE_ACTIVE_RESET_THRESHOLD:
        # Khách vừa hoạt động lại — cho phép nhắn lại lần nữa nếu sau đó lại im lặng tiếp
        visitor["reengage_sent"] = False
        return

    if visitor.get("reengage_sent"):
        return

    if current_idle_seconds < REENGAGE_IDLE_THRESHOLD:
        return

    message = generate_reengagement_message(visitor["session_id"])

    if not message:
        return

    visitor["reengage_sent"] = True

    pending_proactive_messages.setdefault(
        visitor["session_id"],
        []
    ).append(message)

# ==============================
# CHỐNG SPAM / GIỚI HẠN TẦN SUẤT GỌI /chat (theo IP)
# ==============================
# Traffic thật hiện tại chỉ ~30-50 lượt truy cập/ngày, nên ngưỡng đặt khá
# rộng so với hành vi thật (không ai chạm tới), chỉ để chặn spam/script.
CHAT_RATE_LIMIT_PER_MINUTE = 10
CHAT_RATE_LIMIT_PER_DAY = 50

CHAT_RATE_LIMIT_MESSAGE = (
    "Dạ, anh/chị đang thao tác hơi nhanh, vui lòng đợi một chút "
    "rồi hỏi tiếp giúp em nhé 🙂"
)

# ip -> [thời điểm các lần gọi /chat trong 60 giây gần nhất]
chat_requests_per_minute = {}

# ip -> {"date": "YYYY-MM-DD", "count": số lần gọi /chat trong ngày đó}
chat_requests_per_day = {}

def is_chat_rate_limited(ip):

    now = time.time()

    # Giới hạn theo phút — chặn spam dồn dập
    recent = chat_requests_per_minute.get(ip, [])
    recent = [t for t in recent if now - t < 60]

    if len(recent) >= CHAT_RATE_LIMIT_PER_MINUTE:
        chat_requests_per_minute[ip] = recent
        return True

    recent.append(now)
    chat_requests_per_minute[ip] = recent

    # Giới hạn theo ngày — chặn spam rải đều cả ngày để né giới hạn theo phút
    today = datetime.now().strftime("%Y-%m-%d")
    day_record = chat_requests_per_day.get(ip)

    if not day_record or day_record["date"] != today:
        day_record = {"date": today, "count": 0}

    if day_record["count"] >= CHAT_RATE_LIMIT_PER_DAY:
        chat_requests_per_day[ip] = day_record
        return True

    day_record["count"] += 1
    chat_requests_per_day[ip] = day_record

    return False

# ==============================
# GIỚI HẠN SỐ KẾT NỐI /stream ĐỒNG THỜI (theo IP)
# ==============================
# Mỗi kết nối SSE giữ 1 thread của server — chặn kiểu mở hàng loạt kết nối
# để chiếm hết thread, dù không trực tiếp tốn phí AI.
SSE_MAX_CONNECTIONS_PER_IP = 5

# ip -> số kết nối /stream đang mở
active_sse_connections = {}

def acquire_sse_connection(ip):

    if active_sse_connections.get(ip, 0) >= SSE_MAX_CONNECTIONS_PER_IP:
        return False

    active_sse_connections[ip] = active_sse_connections.get(ip, 0) + 1
    return True

def release_sse_connection(ip):

    remaining = active_sse_connections.get(ip, 0) - 1

    if remaining <= 0:
        active_sse_connections.pop(ip, None)
    else:
        active_sse_connections[ip] = remaining

# ==============================
# BẢO VỆ DASHBOARD (HTTP Basic Auth)
# ==============================
DASHBOARD_USERNAME = os.environ.get("DASHBOARD_USERNAME", "admin")
DASHBOARD_PASSWORD = os.environ.get("DASHBOARD_PASSWORD")

if not DASHBOARD_PASSWORD:
    # Sinh ngẫu nhiên thay vì mật khẩu mặc định cố định — mật khẩu cố định
    # nằm trong code công khai thì ai cũng đọc được
    DASHBOARD_PASSWORD = secrets.token_urlsafe(12)
    print(
        "\n[CẢNH BÁO] Chưa đặt DASHBOARD_PASSWORD trong .env — "
        f"đang dùng mật khẩu tạm sinh ngẫu nhiên cho lần chạy này: {DASHBOARD_PASSWORD} "
        "Hãy thêm DASHBOARD_USERNAME và DASHBOARD_PASSWORD vào .env.\n"
    )

def require_dashboard_auth(view):

    @wraps(view)
    def wrapped(*args, **kwargs):

        auth = request.authorization

        if not auth or auth.username != DASHBOARD_USERNAME or auth.password != DASHBOARD_PASSWORD:
            return Response(
                "Cần đăng nhập để xem dashboard.",
                401,
                {"WWW-Authenticate": 'Basic realm="Hanoiweb Dashboard"'}
            )

        return view(*args, **kwargs)

    return wrapped

# ==============================
# XÁC ĐỊNH SESSION CHO WIDGET NHÚNG (cross-origin)
# ==============================
# Widget nhúng ở site khác origin gửi kèm "client_session_id" tự lưu trong
# localStorage của trình duyệt khách (bền vững qua các lần chuyển trang,
# không phụ thuộc cookie cross-origin có được trình duyệt gửi ổn định hay
# không). Nếu có thì dùng luôn làm session_id; nếu không có (trang chat gốc
# templates/index.html, luôn cùng origin) thì vẫn dùng cookie session như cũ,
# không đổi hành vi cho luồng gốc.
def resolve_session_id():

    client_session_id = None

    if request.method == "POST":
        body = request.get_json(silent=True) or {}
        client_session_id = body.get("client_session_id")

    if not client_session_id:
        client_session_id = request.args.get("client_session_id")

    if client_session_id:
        return client_session_id

    session_id = session.get("session_id")

    if not session_id:
        session_id = str(uuid.uuid4())
        session["session_id"] = session_id

    return session_id

def calculate_lead_score(visitor):
    score = 0

    # 1. Thời gian hoạt động thực sự (không tính lúc để tab idle)
    active_time = visitor.get(
        "active_time",
        0
    )

    if active_time >= 180:
        score += 15
    elif active_time >= 60:
        score += 10
    elif active_time >= 30:
        score += 5

    # 2. Scroll sâu nhất từng đạt
    max_scroll_depth = visitor.get("max_scroll_depth", 0)

    if max_scroll_depth >= 80:
        score += 10
    elif max_scroll_depth >= 50:
        score += 5

    # 3. Số lượt chat
    chat_count = visitor.get("chat_count", 0)

    if chat_count >= 3:
        score += 15
    elif chat_count >= 1:
        score += 10

    # 4. Quay lại nhiều lần
    visit_count = visitor.get("visit_count", 0)

    if visit_count >= 3:
        score += 10
    elif visit_count >= 2:
        score += 5

    # 5. Có quan tâm dịch vụ
    service_interest = visitor.get("service_interest")

    if service_interest and service_interest != "unknown":
        score += 15

    # 6. Ý định mua hàng từ AI
    purchase_intent = visitor.get("purchase_intent", "low")

    if purchase_intent == "high":
        score += 25
    elif purchase_intent == "medium":
        score += 15

    # Giới hạn điểm 0-100
    score = min(score, 100)

    return score

def create_visitor_profile(session_id):
    return {

        "session_id": session_id,

        "visit_count": 0,

        "current_visit_id": None,

        "current_url": None,

        "time_on_page": 0,

        "total_time_on_page": 0,

        "last_page_time": 0,

        "active_time": 0,

        "total_idle_time": 0,

        "last_idle_time": 0,

        "scroll_depth": 0,

        "max_scroll_depth": 0,

        "last_event": None,

        "events": [],

        "chat_history": [],

        "chat_count": 0,

        "service_interest": None,

        "lead_status": "new",

        "purchase_intent": "low",

        "lead_score": 0,

        "proactive_sent": False,

        "reengage_sent": False

    }

@app.route("/behavior", methods=["POST"])
def behavior():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False
        }), 400


    session_id = resolve_session_id()


    behavior_data = {

        "session_id": session_id,
        
        "visit_id": data.get("visit_id"),

        "url": data.get("url"),

        "title": data.get("title"),

        "time_on_page": data.get(
            "time_on_page",
            0
        ),

        "scroll_depth": data.get(
            "scroll_depth",
            0
        ),

        "idle_time": data.get(
            "idle_time",
            0
        ),

        "event": data.get("event")

    }


    # ==============================
    # TẠO HỒ SƠ KHÁCH
    # ==============================

    if session_id not in visitor_behaviors:

        visitor_behaviors[session_id] = create_visitor_profile(session_id)


    # ==============================
    # LẤY HỒ SƠ KHÁCH
    # ==============================

    visitor = visitor_behaviors[session_id]


    # ==============================
    # CẬP NHẬT THÔNG TIN
    # ==============================

    visitor["current_url"] = (
        behavior_data["url"]
    )

    visitor["time_on_page"] = (
        behavior_data["time_on_page"]
    )

    # ==============================
    # TÍNH SỐ VISIT & TỔNG THỜI GIAN TRUY CẬP
    # ==============================
    incoming_visit_id = behavior_data.get("visit_id")

    if incoming_visit_id != visitor.get("current_visit_id"):

        visitor["visit_count"] += 1

        visitor["current_visit_id"] = incoming_visit_id

        visitor["last_page_time"] = 0

        visitor["last_idle_time"] = 0


    current_time = behavior_data["time_on_page"]

    previous_time = visitor.get(
        "last_page_time",
        0
    )

    if current_time > previous_time:

        visitor["total_time_on_page"] += (
            current_time - previous_time
        )

    visitor["last_page_time"] = current_time

    visitor["scroll_depth"] = (
        behavior_data["scroll_depth"]
    )

    # ==============================
    # TÍNH SCROLL SÂU NHẤT TỪNG ĐẠT
    # ==============================

    visitor["max_scroll_depth"] = max(
        visitor.get("max_scroll_depth", 0),
        behavior_data["scroll_depth"]
    )

    # ==============================
    # TÍNH THỜI GIAN ACTIVE / IDLE
    # ==============================

    current_idle = behavior_data["idle_time"]

    previous_idle = visitor.get(
        "last_idle_time",
        0
    )

    if current_idle > previous_idle:

        visitor["total_idle_time"] += (
            current_idle - previous_idle
        )

    visitor["last_idle_time"] = current_idle

    visitor["active_time"] = max(
        visitor["total_time_on_page"] - visitor["total_idle_time"],
        0
    )

    visitor["last_event"] = (
        behavior_data["event"]
    )


    # ==============================
    # LƯU EVENT
    # ==============================

    visitor["events"].append(
        behavior_data
    )

    # ==============================
    # CẬP NHẬT LEAD SCORE
    # ==============================

    visitor["lead_score"] = calculate_lead_score(visitor)

    # ==============================
    # KIỂM TRA CÓ NÊN CHỦ ĐỘNG NHẮN KHÁCH KHÔNG
    # ==============================

    maybe_trigger_proactive_message(visitor)

    # ==============================
    # KIỂM TRA CÓ NÊN NHẮN LẠI KHÁCH ĐANG IM LẶNG GIỮA CHỪNG TRÒ CHUYỆN KHÔNG
    # ==============================

    maybe_trigger_reengagement(
        visitor,
        behavior_data["idle_time"]
    )

    # ==============================
    # LƯU XUỐNG DATABASE
    # ==============================

    storage.save_visitor(session_id, visitor)

    # ==============================
    # HIỂN THỊ RA TERMINAL
    # ==============================

    print("\n[VISITOR BEHAVIOR]")

    print(visitor)


    return jsonify({
        "success": True
    })
   
@app.route("/visitor", methods=["GET"])
def visitor():

    session_id = session.get("session_id")

    if not session_id:
        return jsonify({
            "success": False,
            "message": "Không tìm thấy session."
        }), 404

    visitor_data = visitor_behaviors.get(session_id)

    if not visitor_data:
        return jsonify({
            "success": False,
            "message": "Visitor chưa có dữ liệu."
        }), 404

    return jsonify({
        "success": True,
        "visitor": visitor_data
    })

@app.route("/chat/latest")
def chat_latest():

    # Cho widget lấy lại câu trả lời gần nhất của chính session này — dùng khi
    # khách chuyển trang lúc đang đợi bot trả lời (request /chat cũ bị huỷ dù
    # server vẫn xử lý và lưu xong câu trả lời).
    session_id = resolve_session_id()

    visitor_data = visitor_behaviors.get(session_id)

    if not visitor_data:
        return jsonify({
            "success": True,
            "chat_history": []
        })

    return jsonify({
        "success": True,
        "chat_history": visitor_data.get("chat_history", [])[-2:]
    })

@app.route("/stream")
def stream():

    session_id = resolve_session_id()
    client_ip = request.remote_addr

    if not acquire_sse_connection(client_ip):
        return "", 429

    def event_stream():

        try:

            while True:

                pending = pending_proactive_messages.get(session_id)

                if pending:

                    # Chỉ lấy ra xem trước (không pop) — nếu client đã ngắt kết
                    # nối, yield bên dưới sẽ thất bại và tin nhắn vẫn còn nguyên
                    # trong hàng đợi cho kết nối SSE tiếp theo (vd: khách chuyển
                    # trang) lấy tiếp, thay vì bị mất khi gửi không thành công.
                    message = pending[0]

                    payload = json.dumps(
                        {"message": message},
                        ensure_ascii=False
                    )

                    yield f"data: {payload}\n\n"

                    if pending and pending[0] == message:
                        pending.pop(0)

                else:

                    # Nhịp giữ kết nối, tránh proxy/trình duyệt tự đóng stream
                    yield ": keep-alive\n\n"

                time.sleep(1.5)

        finally:

            # Chỉ dọn dẹp nếu không còn tin nhắn nào đang chờ — tránh trường hợp
            # khách chuyển trang (mở kết nối SSE mới) đúng lúc có tin nhắn vừa
            # được xếp hàng, làm mất tin nhắn đó trước khi kết nối mới kịp đọc.
            if not pending_proactive_messages.get(session_id):
                pending_proactive_messages.pop(session_id, None)

            release_sse_connection(client_ip)

    return Response(
        event_stream(),
        mimetype="text/event-stream"
    )

@app.route("/dashboard")
@require_dashboard_auth
def dashboard():

    leads = sorted(
        visitor_behaviors.values(),
        key=lambda v: v.get("lead_score", 0),
        reverse=True
    )

    return render_template(
        "dashboard.html",
        leads=leads
    )

@app.route("/dashboard/<session_id>")
@require_dashboard_auth
def dashboard_detail(session_id):

    visitor_data = visitor_behaviors.get(session_id)

    if not visitor_data:
        return "Không tìm thấy visitor.", 404

    return render_template(
        "dashboard_detail.html",
        visitor=visitor_data
    )

@app.route("/")
def home():
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
        
    return render_template(
        "index.html",
        session_id=session["session_id"]
    )

@app.route("/chat", methods=["POST"])
def chat():

    if is_chat_rate_limited(request.remote_addr):
        return jsonify({
            "answer": CHAT_RATE_LIMIT_MESSAGE,
            "ended": False
        })

    data = request.get_json()

    question = data.get("question", "").strip()

    if not question:
        return jsonify({
            "answer": "Vui lòng nhập câu hỏi.",
            "ended": False
        })

    # Giới hạn độ dài câu hỏi — tránh input quá dài làm tốn token AI bất thường
    if len(question) > 500:
        return jsonify({
            "answer": "Câu hỏi hơi dài, anh/chị vui lòng rút gọn giúp em (dưới 500 ký tự) nhé ạ 🙏",
            "ended": False
        })

    # Kiểm tra lệnh kết thúc
    if question.lower() in [
        "exit",
        "quit",
        "thoát",
        "kết thúc",
    ]:
        return jsonify({
            "answer": "Cảm ơn bạn đã sử dụng Hanoiweb AI Chatbot.",
            "ended": True
        })

    try:

        session_id = resolve_session_id()

        answer = ask_question(
            question=question,
            session_id=session_id
        )

#Nếu visitor chưa có profile thì tạo profile mới
        if session_id not in visitor_behaviors:
            visitor_behaviors[session_id] = create_visitor_profile(
                session_id
            )
        #Lưu lịch sử chat vào profile của visitor
        visitor_behaviors[session_id]["chat_history"].append({
            "role": "khách hàng",
            "content": question
        })

        visitor_behaviors[session_id]["chat_history"].append({
            "role": "chatbot",
            "content": answer
        })

        #Đếm số lượt chat
        visitor_behaviors[session_id]["chat_count"] = len(
            visitor_behaviors[session_id]["chat_history"]
        ) // 2

        visitor = visitor_behaviors[session_id]

        #AI phân tích visitor — chỉ chạy lại mỗi 2 lượt chat để giảm số lần
        #gọi AI (giảm ~50% chi phí phần này); các lượt còn lại giữ nguyên
        #kết quả phân tích gần nhất, không ảnh hưởng câu trả lời cho khách.
        if visitor["chat_count"] % 2 == 1 or "ai_analysis" not in visitor:

            ai_analysis = analyze_visitor(visitor)

            #Lưu kết quả phân tích AI
            visitor["ai_analysis"] = ai_analysis

            #Đồng bộ thông tin chính từ AI
            visitor["service_interest"] = ai_analysis.get(
                "service_interest",
                "unknown"
            )

            #Tính Lead Score
            visitor["lead_status"] = ai_analysis.get(
                "lead_status",
                "new"
            )

            visitor["purchase_intent"] = ai_analysis.get(
                "purchase_intent",
                "low"
            )

        visitor["lead_score"] = calculate_lead_score(visitor)

        #Lưu xuống database
        storage.save_visitor(session_id, visitor)

        return jsonify({
            "answer": answer,
            "ended": False
        })

    except Exception as e:

        return jsonify({
            "answer": f"Đã xảy ra lỗi: {str(e)}",
            "ended": False
        })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=False,
        threaded=True
    )