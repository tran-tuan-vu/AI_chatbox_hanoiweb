/* ==========================================================================
   HanoiWeb — chatbot-widget.js
   Nhúng trợ lý AI (đã xây ở dự án AI_chatbox_hanoiweb) vào giao diện site
   dưới dạng popup nổi. Toàn bộ logic chat / theo dõi hành vi / nhận tin
   nhắn chủ động (SSE) được giữ nguyên như bản gốc — chỉ đổi cách gọi API
   sang cross-origin (site này chạy ở origin khác với server chatbot).
   ========================================================================== */

// Địa chỉ server chatbot (Flask, project AI_chatbox_hanoiweb). Đổi lại nếu
// deploy API ở domain khác.
const CHATBOT_API_BASE = 'http://127.0.0.1:5000';

/* ------------------- Nhận diện phiên khách qua các lần chuyển trang ------------------- */
/* Site này là site tĩnh nhiều trang (không phải SPA) — mỗi lần chuyển trang
   là 1 lần tải lại toàn bộ DOM/JS từ đầu, và cookie session cross-origin có
   thể không được trình duyệt gửi ổn định tuỳ chính sách từng trình duyệt.
   Nên tự giữ 1 client_session_id riêng trong localStorage (cùng origin với
   chính site, không phụ thuộc cookie) và gửi kèm mọi request lên server để
   server luôn nhận ra đúng 1 khách xuyên suốt nhiều trang. */

const CLIENT_SESSION_STORAGE_KEY = 'hw_chatbot_session_id';
const CHAT_HISTORY_STORAGE_KEY = 'hw_chatbot_messages';
const CHAT_HISTORY_LIMIT = 50;

let fallbackSessionId = null;

function generateId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getClientSessionId() {
  try {
    let id = localStorage.getItem(CLIENT_SESSION_STORAGE_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(CLIENT_SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch (error) {
    // localStorage có thể bị chặn (chế độ ẩn danh...) — vẫn dùng 1 id tạm
    // giữ nguyên trong phạm vi trang hiện tại, tốt hơn không có gì.
    if (!fallbackSessionId) fallbackSessionId = generateId();
    return fallbackSessionId;
  }
}

function loadStoredMessages() {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveStoredMessages(list) {
  try {
    localStorage.setItem(
      CHAT_HISTORY_STORAGE_KEY,
      JSON.stringify(list.slice(-CHAT_HISTORY_LIMIT))
    );
  } catch (error) {
    // Bỏ qua nếu localStorage không dùng được — chat vẫn hoạt động,
    // chỉ là không nhớ được lịch sử hiển thị qua lần chuyển trang sau.
  }
}

/* ---------------- Câu hỏi đang chờ trả lời (để khôi phục nếu bị chuyển trang) ---------------- */

const PENDING_QUESTION_STORAGE_KEY = 'hw_chatbot_pending_question';

function setPendingQuestion(question) {
  try {
    localStorage.setItem(
      PENDING_QUESTION_STORAGE_KEY,
      JSON.stringify({ question, askedAt: Date.now() })
    );
  } catch (error) {
    // Bỏ qua — nếu localStorage không dùng được thì chỉ là không khôi phục
    // được câu trả lời bị lỡ, chat vẫn hoạt động bình thường.
  }
}

function clearPendingQuestion() {
  try {
    localStorage.removeItem(PENDING_QUESTION_STORAGE_KEY);
  } catch (error) {
    // Bỏ qua.
  }
}

function getPendingQuestion() {
  try {
    const raw = localStorage.getItem(PENDING_QUESTION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

/* ---------- Phát hiện đang rời trang (để không hiện lỗi giả khi chuyển trang) ---------- */
/* Khi khách bấm sang trang khác lúc đang đợi bot trả lời, trình duyệt huỷ
   request /chat đang chờ — fetch báo lỗi dù server vẫn xử lý bình thường.
   Không hiện/lưu thông báo lỗi trong trường hợp này để tránh hiểu lầm là
   chatbot bị hỏng. */
let isNavigatingAway = false;

window.addEventListener('pagehide', () => {
  isNavigatingAway = true;
});

window.addEventListener('beforeunload', () => {
  isNavigatingAway = true;
});

/* -------------------------------- DOM setup ------------------------------- */

function injectStyles() {
  if (document.querySelector('link[data-hw-chatbot-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/css/chatbot-widget.css';
  link.setAttribute('data-hw-chatbot-style', '');
  document.head.appendChild(link);
}

function buildWidgetMarkup() {
  const wrapper = document.createElement('div');
  wrapper.id = 'hw-chatbot-widget';
  wrapper.innerHTML = `
    <div id="hw-chat-panel" class="hw-chat-panel" role="dialog" aria-label="Trợ lý AI HanoiWeb">
      <div class="hw-chat-panel__header">
        <img class="hw-chat-panel__avatar" src="/assets/images/logo/logo-bot-ai.png" alt="Trợ lý AI HanoiWeb" />
        <div class="hw-chat-panel__title">
          <strong>Trợ lý AI HanoiWeb</strong>
          <span class="hw-chat-panel__status"><i class="fa-solid fa-circle"></i> Đang online</span>
        </div>
        <button id="hw-chat-close" class="hw-chat-panel__close" type="button" aria-label="Đóng">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div id="hw-chat-messages" class="hw-chat-panel__messages"></div>

      <div class="hw-chat-panel__input">
        <input id="hw-chat-input" type="text" placeholder="Anh/chị cần hỗ trợ gì?" autocomplete="off" />
        <button id="hw-chat-send" class="hw-chat-panel__send" type="button" aria-label="Gửi">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>

      <div class="hw-chat-panel__footer-note">Trợ lý AI hỗ trợ bởi HanoiWeb</div>
    </div>

    <button id="hw-chat-launcher" class="hw-chat-launcher" type="button" aria-label="Mở trợ lý AI HanoiWeb">
      <img class="hw-chat-launcher__icon-open" src="/assets/images/logo/logo-bot-ai.png" alt="" />
      <i class="fa-solid fa-xmark hw-chat-launcher__icon-close"></i>
    </button>
  `;
  document.body.appendChild(wrapper);

  return {
    launcher: wrapper.querySelector('#hw-chat-launcher'),
    panel: wrapper.querySelector('#hw-chat-panel'),
    closeBtn: wrapper.querySelector('#hw-chat-close'),
    messages: wrapper.querySelector('#hw-chat-messages'),
    input: wrapper.querySelector('#hw-chat-input'),
    sendBtn: wrapper.querySelector('#hw-chat-send'),
  };
}

/* --------------------------------- Toggle popup ---------------------------------- */

function openPanel(dom) {
  dom.panel.classList.add('is-open');
  dom.launcher.classList.add('is-open');
}

function closePanel(dom) {
  dom.panel.classList.remove('is-open');
  dom.launcher.classList.remove('is-open');
}

function initToggle(dom) {
  dom.launcher.addEventListener('click', () => {
    if (dom.panel.classList.contains('is-open')) closePanel(dom);
    else openPanel(dom);
  });
  dom.closeBtn.addEventListener('click', () => closePanel(dom));
}

/* ----------------------------------- Chat ---------------------------------- */

function renderMessage(dom, text, type) {
  const message = document.createElement('div');
  message.className = `hw-msg hw-msg--${type}`;

  const content = document.createElement('div');
  content.className = 'hw-msg__content';
  content.textContent = text;

  message.appendChild(content);
  dom.messages.appendChild(message);

  dom.messages.scrollTop = dom.messages.scrollHeight;
}

// Hiển thị tin nhắn + lưu vào localStorage để còn khi khách chuyển sang trang khác
function addMessage(dom, text, type) {
  renderMessage(dom, text, type);

  const stored = loadStoredMessages();
  stored.push({ text, type });
  saveStoredMessages(stored);
}

async function sendMessage(dom) {
  const question = dom.input.value.trim();
  if (!question) return;

  addMessage(dom, question, 'user');
  dom.input.value = '';
  dom.input.disabled = true;
  dom.sendBtn.disabled = true;

  // Ghi nhớ câu hỏi đang chờ trả lời — nếu khách chuyển trang trước khi có
  // kết quả, trang mới sẽ dựa vào đây để hỏi lại server xem câu trả lời đã
  // có chưa (server vẫn xử lý và lưu bình thường dù trình duyệt đã huỷ chờ).
  setPendingQuestion(question);

  try {
    const response = await fetch(`${CHATBOT_API_BASE}/chat`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        client_session_id: getClientSessionId(),
      }),
    });

    const data = await response.json();
    addMessage(dom, data.answer, 'bot');
    clearPendingQuestion();
  } catch (error) {
    console.error('[HanoiWeb Chatbot] Chat error:', error);

    // Nếu lỗi xảy ra vì khách vừa chuyển trang (request bị huỷ giữa chừng),
    // không hiện/lưu thông báo lỗi — server vẫn xử lý bình thường, chỉ là
    // trình duyệt không đợi được câu trả lời nữa. Giữ nguyên pendingQuestion
    // để trang mới khôi phục lại câu trả lời khi có.
    if (!isNavigatingAway) {
      addMessage(dom, 'Không thể kết nối tới trợ lý AI.', 'bot');
      clearPendingQuestion();
    }
  } finally {
    dom.input.disabled = false;
    dom.sendBtn.disabled = false;
    dom.input.focus();
  }
}

function initChat(dom) {
  dom.sendBtn.addEventListener('click', () => sendMessage(dom));
  dom.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') sendMessage(dom);
  });

  // Khôi phục lại đoạn chat đã có từ trang trước (nếu có), thay vì luôn bắt
  // đầu trắng mỗi lần chuyển trang.
  const stored = loadStoredMessages();

  if (stored.length) {
    stored.forEach((msg) => renderMessage(dom, msg.text, msg.type));
  } else {
    addMessage(
      dom,
      'Dạ, em là trợ lý AI của HanoiWeb. Anh/chị cần hỗ trợ gì ạ? 😊',
      'bot'
    );
  }

  recoverPendingAnswer(dom);
}

// Nếu trang trước bị chuyển đi lúc đang đợi bot trả lời, hỏi lại server xem
// câu trả lời đã có chưa (server vẫn xử lý/lưu bình thường) và hiển thị nếu
// có. Thử vài lần vì bot có thể chưa trả lời xong ngay lúc trang mới vừa tải.
async function recoverPendingAnswer(dom) {
  const pending = getPendingQuestion();
  if (!pending) return;

  const retryDelays = [0, 2000, 3000];

  for (const delay of retryDelays) {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const response = await fetch(
        `${CHATBOT_API_BASE}/chat/latest?client_session_id=${encodeURIComponent(getClientSessionId())}`,
        { credentials: 'include' }
      );

      const data = await response.json();
      const lastTwo = data.chat_history || [];
      const customerMsg = lastTwo[0];
      const botMsg = lastTwo[1];

      if (
        customerMsg
        && botMsg
        && customerMsg.content === pending.question
        && botMsg.role === 'chatbot'
      ) {
        addMessage(dom, botMsg.content, 'bot');

        if (!dom.panel.classList.contains('is-open')) openPanel(dom);

        break;
      }
    } catch (error) {
      console.error('[HanoiWeb Chatbot] Recover pending answer error:', error);
    }
  }

  clearPendingQuestion();
}

/* ----------------------- Nhận tin nhắn chủ động (SSE) ----------------------- */

function initProactiveStream(dom) {
  const streamUrl =
    `${CHATBOT_API_BASE}/stream?client_session_id=${encodeURIComponent(getClientSessionId())}`;

  const stream = new EventSource(streamUrl, { withCredentials: true });

  stream.onmessage = (event) => {
    const data = JSON.parse(event.data);
    addMessage(dom, data.message, 'bot');

    // Panel đang đóng thì tự mở ra để khách thấy tin nhắn chủ động.
    if (!dom.panel.classList.contains('is-open')) openPanel(dom);
  };

  stream.onerror = (error) => {
    console.error('[HanoiWeb Chatbot] Proactive stream error:', error);
  };
}

/* ---------------------------- Theo dõi hành vi khách ---------------------------- */

function initBehaviorTracking() {

  // Thời điểm khách bắt đầu visit hiện tại
  let pageEnterTime = Date.now();

  // ID riêng cho mỗi lần truy cập / reload trang
  const VISIT_ID =
    Date.now().toString() +
    '-' +
    Math.random().toString(36).substring(2);

  // Độ sâu scroll lớn nhất trong visit hiện tại
  let maxScrollDepth = 0;

  // Thời điểm hoạt động cuối cùng của khách
  let lastActivityTime = Date.now();

  // Trạng thái idle
  let isIdle = false;

  // 5 phút không hoạt động = idle
  const IDLE_TIME = 5 * 60 * 1000;

  function recordActivity() {
    lastActivityTime = Date.now();
    if (isIdle) {
      isIdle = false;
      sendBehavior('active');
    }
  }

  window.addEventListener('scroll', () => {
    recordActivity();

    const scrollTop = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (documentHeight <= 0) return;

    const scrollPercent = Math.round((scrollTop / documentHeight) * 100);
    maxScrollDepth = Math.max(maxScrollDepth, scrollPercent);
  });

  window.addEventListener('click', recordActivity);
  window.addEventListener('keydown', recordActivity);
  window.addEventListener('mousemove', recordActivity);
  window.addEventListener('touchstart', recordActivity);

  setInterval(() => {
    const inactiveTime = Date.now() - lastActivityTime;
    if (inactiveTime >= IDLE_TIME && !isIdle) {
      isIdle = true;
      sendBehavior('idle_start');
    }
  }, 10000);

  async function sendBehavior(eventName) {
    const timeOnPage = Math.floor((Date.now() - pageEnterTime) / 1000);
    const idleTime = Math.floor((Date.now() - lastActivityTime) / 1000);

    try {
      await fetch(`${CHATBOT_API_BASE}/behavior`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_id: VISIT_ID,
          url: window.location.pathname,
          title: document.title,
          time_on_page: timeOnPage,
          scroll_depth: maxScrollDepth,
          idle_time: idleTime,
          event: eventName,
          client_session_id: getClientSessionId(),
        }),
      });
    } catch (error) {
      console.error('[HanoiWeb Chatbot] Behavior tracking error:', error);
    }
  }

  setInterval(() => sendBehavior('page_activity'), 30000);

  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.floor((Date.now() - pageEnterTime) / 1000);
    const idleTime = Math.floor((Date.now() - lastActivityTime) / 1000);

    const data = JSON.stringify({
      visit_id: VISIT_ID,
      url: window.location.pathname,
      title: document.title,
      time_on_page: timeOnPage,
      scroll_depth: maxScrollDepth,
      idle_time: idleTime,
      event: 'page_leave',
      client_session_id: getClientSessionId(),
    });

    navigator.sendBeacon(`${CHATBOT_API_BASE}/behavior`, data);
  });
}

/* ----------------------------------- Init ---------------------------------- */

export function initChatbotWidget() {
  injectStyles();
  const dom = buildWidgetMarkup();

  initToggle(dom);
  initChat(dom);
  initProactiveStream(dom);
  initBehaviorTracking();
}
