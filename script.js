// ========================================================
// 1. ギャラリー（3枚カード）の初期並び替え
//    - .gallery 内の .image-container をランダム順に並べる
// ========================================================
const gallery = document.querySelector(".gallery");
const orderings = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
];

const containers = Array.from(gallery.children);
const randomOrder = orderings[Math.floor(Math.random() * orderings.length)];
randomOrder.forEach((i) => gallery.appendChild(containers[i]));

// ========================================================
// 2. グローバルで使う DOM 要素の取得
// ========================================================
const images = document.querySelectorAll(".image-container");
let cardsClickable = false;
const details = document.querySelector(".details");
const descriptionDiv = document.querySelector(".description");
const body = document.body;
const header = document.querySelector("header");
const siteFooter = document.querySelector(".site-footer");
const moreButton = document.querySelector(".more-button");

// イントロ用オーバーレイ要素
const introOverlay = document.getElementById("intro-overlay");
const introText1 = document.getElementById("intro-text1");
const introText2 = document.getElementById("intro-text2");
const introCard = document.getElementById("intro-card");
const clickTip = document.getElementById("click-tip");
const skipButton = document.getElementById("skip-button");
let introPlayed = false;

// ナビゲーション（ハンバーガーメニュー関連）
const mainMenu = document.querySelector(".main-menu");
const hamburger = document.querySelector(".hamburger");
const menuOverlay = document.getElementById("menu-overlay");
const mobileMenuMediaQuery = window.matchMedia("(max-width: 600px)");

// ========================================================
// 3. モバイルメニュー（ハンバーガー） & アクセシビリティ
// ========================================================

/**
 * メニューの open / close 状態に応じて aria 属性を同期する
 */
function syncMenuAccessibilityState() {
  if (!mainMenu) {
    return;
  }
  const isMobileViewport = mobileMenuMediaQuery.matches;
  const isMenuOpen = mainMenu.classList.contains("open");
  mainMenu.setAttribute("aria-hidden", isMobileViewport && !isMenuOpen ? "true" : "false");
  if (hamburger) {
    hamburger.setAttribute("aria-expanded", isMobileViewport && isMenuOpen ? "true" : "false");
  }
}

/**
 * モバイルメニューを閉じる
 */
function closeMobileMenu() {
  if (!mainMenu || !menuOverlay) {
    return;
  }
  mainMenu.classList.remove("open");
  menuOverlay.classList.add("hidden");
  syncMenuAccessibilityState();
}

/**
 * 画面幅が 600px をまたぐ時に、メニュー状態をリセットする
 */
const handleMobileMenuChange = () => {
  if (!mainMenu) {
    return;
  }
  if (!mobileMenuMediaQuery.matches) {
    // PC 表示に戻ったらメニューを閉じておく
    mainMenu.classList.remove("open");
    if (menuOverlay) {
      menuOverlay.classList.add("hidden");
    }
  }
  syncMenuAccessibilityState();
};

if (typeof mobileMenuMediaQuery.addEventListener === "function") {
  mobileMenuMediaQuery.addEventListener("change", handleMobileMenuChange);
} else if (typeof mobileMenuMediaQuery.addListener === "function") {
  // 古いブラウザ向け
  mobileMenuMediaQuery.addListener(handleMobileMenuChange);
}

// 初期状態の aria を同期
syncMenuAccessibilityState();

// ========================================================
// 4. モーダル内 BGM のフェード制御
// ========================================================
const MUSIC_FADE_DURATION = 1200;
const MUSIC_DEFAULT_TARGET_VOLUME = 1;
let currentModalAudio = null;

/**
 * 進行中の requestAnimationFrame ベースのフェードをキャンセルする
 */
function cancelAudioFade(audio) {
  if (!audio) {
    return;
  }
  if (typeof audio._fadeFrame === "number") {
    cancelAnimationFrame(audio._fadeFrame);
    audio._fadeFrame = null;
  }
}

/**
 * BGM の音量を targetVolume まで duration(ms) かけて線形にフェードする
 */
function fadeAudio(audio, targetVolume, duration, onComplete) {
  if (!audio) {
    if (typeof onComplete === "function") {
      onComplete();
    }
    return;
  }

  cancelAudioFade(audio);

  const clampedTarget = Math.max(0, Math.min(1, targetVolume));
  if (!duration || duration <= 0) {
    audio.volume = clampedTarget;
    if (typeof onComplete === "function") {
      onComplete();
    }
    return;
  }

  const startVolume = audio.volume;
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  const step = (timestamp) => {
    const now = typeof timestamp === "number" ? timestamp : Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const newVolume = startVolume + (clampedTarget - startVolume) * progress;
    audio.volume = Math.max(0, Math.min(1, newVolume));

    if (progress < 1) {
      audio._fadeFrame = requestAnimationFrame(step);
    } else {
      audio._fadeFrame = null;
      if (typeof onComplete === "function") {
        onComplete();
      }
    }
  };

  audio._fadeFrame = requestAnimationFrame(step);
}

/**
 * 現在再生中のモーダル BGM をフェードアウトして停止
 */
function fadeOutCurrentMusic() {
  if (!currentModalAudio) {
    return;
  }
  const audioToStop = currentModalAudio;
  currentModalAudio = null;
  fadeAudio(audioToStop, 0, MUSIC_FADE_DURATION, () => {
    audioToStop.pause();
    audioToStop.currentTime = 0;
  });
}

/**
 * volume が Number でない場合の安全な補正
 */
function resolveMusicVolume(volume) {
  if (typeof volume !== "number" || Number.isNaN(volume)) {
    return MUSIC_DEFAULT_TARGET_VOLUME;
  }
  return Math.max(0, Math.min(1, volume));
}

/**
 * モーダル用 BGM を指定ソースで再生
 * - 同じ src を繰り返し指定した場合はフェードのみ調整
 * - 前の音はフェードアウトさせてから止める
 */
function playModalMusic(src, targetVolume = MUSIC_DEFAULT_TARGET_VOLUME) {
  if (!src) {
    return;
  }

  const resolvedVolume = resolveMusicVolume(targetVolume);

  // 既に同じソースの BGM がある場合の再利用
  if (currentModalAudio && currentModalAudio._managedSrc === src) {
    currentModalAudio._targetVolume = resolvedVolume;
    if (currentModalAudio.paused) {
      try {
        currentModalAudio.currentTime = 0;
        const playPromise = currentModalAudio.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.then(() => {
            fadeAudio(currentModalAudio, resolvedVolume, MUSIC_FADE_DURATION);
          });
        } else {
          fadeAudio(currentModalAudio, resolvedVolume, MUSIC_FADE_DURATION);
        }
      } catch (error) {
        // ブラウザの自動再生制限などは握りつぶす
      }
    } else {
      fadeAudio(currentModalAudio, resolvedVolume, MUSIC_FADE_DURATION);
    }
    return;
  }

  // 新しいオーディオを生成
  const previousAudio = currentModalAudio;
  const newAudio = new Audio(src);
  newAudio.loop = true;
  newAudio.volume = 0;
  newAudio.preload = "auto";
  newAudio._managedSrc = src;
  newAudio._targetVolume = resolvedVolume;
  currentModalAudio = newAudio;

  try {
    const playPromise = newAudio.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          fadeAudio(newAudio, resolvedVolume, MUSIC_FADE_DURATION);
        })
        .catch(() => {
          // 自動再生制限などによるエラーは無視
        });
    } else {
      fadeAudio(newAudio, resolvedVolume, MUSIC_FADE_DURATION);
    }
  } catch (error) {
    // 同上
  }

  // 以前の BGM はフェードアウトして停止
  if (previousAudio && previousAudio !== newAudio) {
    fadeAudio(previousAudio, 0, MUSIC_FADE_DURATION, () => {
      previousAudio.pause();
      previousAudio.currentTime = 0;
    });
  }
}

// ハンバーガーメニューのクリック挙動
if (hamburger && mainMenu && menuOverlay) {
  hamburger.addEventListener("click", () => {
    const isOpen = mainMenu.classList.toggle("open");
    if (isOpen) {
      menuOverlay.classList.remove("hidden");
    } else {
      menuOverlay.classList.add("hidden");
    }
    syncMenuAccessibilityState();
  });

  menuOverlay.addEventListener("click", () => {
    closeMobileMenu();
  });
}

// ========================================================
// 5. メインコンテンツ & チャットモーダル関連
// ========================================================
const mainContent = document.getElementById("main-content");
const contentSections = document.querySelectorAll(".content-section");
let activeSectionId = null;// いま表示しているセクション
const subtext = document.querySelector(".subtext");
const startButton = document.getElementById("start-journey-button");
const modalOverlay = document.getElementById("journey-modal");
const modalText = document.getElementById("modal-text");
const modalActions = document.getElementById("modal-actions");

/** 最後に送信したメッセージ（自分側の吹き出し） */
let anchorMessage = null;
/** JS が今まさにスクロール中かどうかのフラグ（ユーザー操作との判別用） */
let isProgrammaticScroll = false;
/** 「ユーザーがまだ画面をいじっていない間だけ」アンカー固定を効かせるフラグ */
let anchorLockEnabled = true;

/**
 * 指定メッセージを chat-body 内で見える位置にスクロールする
 * - 自動スクロール時にアンカー（最後の送信メッセージ）が
 *   ヘッダーの下から消えないようにスクロール量を制限する
 */
function scrollMessageIntoView(message, { behavior = "auto" } = {}) {
  if (!modalText || !message) {
    return;
  }

  if (typeof message.offsetTop !== "number") {
    return;
  }

  let paddingTop = 0;
  let paddingBottom = 0;

  try {
    if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
      const styles = window.getComputedStyle(modalText);
      paddingTop = parseFloat(styles.paddingTop) || 0;
      paddingBottom = parseFloat(styles.paddingBottom) || 0;
    }
  } catch (error) {
    paddingTop = 0;
    paddingBottom = 0;
  }

  const visibleTop = modalText.scrollTop;
  const visibleBottom = visibleTop + modalText.clientHeight;
  const messageTop = message.offsetTop;
  const messageBottom = messageTop + message.offsetHeight;

  const desiredTop = Math.max(0, messageTop - paddingTop);
  const maxScrollTop = Math.max(0, modalText.scrollHeight - modalText.clientHeight);

  const shouldScrollUp = messageTop - paddingTop < visibleTop;
  const shouldScrollDown = messageBottom + paddingBottom > visibleBottom;

  // すでに視界に入っているなら何もしない
  if (!shouldScrollUp && !shouldScrollDown) {
    return;
  }

  let targetTop = Math.min(desiredTop, maxScrollTop);

  // ============================
  // アンカー（自分の送信メッセージ）をヘッダー下に残すための制限
  // ============================
  if (anchorLockEnabled && anchorMessage && anchorMessage.isConnected) {
    const anchorTop = anchorMessage.offsetTop;

    // アンカーがヘッダー（paddingTop）より上に行かないようにする
    const maxScrollToKeepAnchorVisible = Math.max(0, anchorTop - paddingTop);

    // 目標スクロール位置を制限
    targetTop = Math.min(targetTop, maxScrollToKeepAnchorVisible);
  }

  // JS によるスクロール中フラグを立てる（ユーザー操作との区別）
  isProgrammaticScroll = true;

  const finishProgrammatic = () => {
    // scroll イベント発火後にフラグを戻す
    setTimeout(() => {
      isProgrammaticScroll = false;
    }, 0);
  };

  if (
    typeof modalText.scrollTo === "function" &&
    (behavior === "smooth" || behavior === "auto")
  ) {
    modalText.scrollTo({ top: targetTop, behavior });
    finishProgrammatic();
  } else {
    modalText.scrollTop = targetTop;
    finishProgrammatic();
  }
}

/**
 * ユーザーが手でスクロールしたタイミングでアンカー固定を解除
 */
if (modalText) {
  modalText.addEventListener(
    "scroll",
    () => {
      // JS ではなくユーザー操作でスクロールされたらアンカー固定を解除
      if (!isProgrammaticScroll) {
        anchorLockEnabled = false;
      }
    },
    { passive: true },
  );
}

const journeyCloseButton = document.getElementById("journey-close-button");
const pricingSection = document.getElementById("pricing");
const displayedSteps = new Set();
let lineInfoDisplayed = false;
let hamburgerWasHidden = hamburger ? hamburger.classList.contains("hidden") : true;

// LINE 追いメッセージ表示用
const lineFollowUpDelay = 500;
const lineContactMessageHtml = [
  "電話•LINEで受け付けておりますので、利用しやすいほうをお選びになり、お悩みや質問などお気軽にご相談下さい",
  "0977-21-8695",
  "",
  "※電話は、営業時間内(店休日、施術中は出られない時がございます)",
  "※LINEは友達追加後メッセージをお送り下さい",
  "常時受け付けておりますが、すぐに返信できない場合がございます。ご了承ください",
].join("<br>");

// LINE 風メッセージシナリオ（JSON）をここに読み込む
let modalSteps = [];

/**
 * data/modal-steps.json を読み込み、modalSteps に格納
 */
async function loadModalSteps() {
  const res = await fetch("data/modal-steps.json");
  if (!res.ok) {
    throw new Error("modal-steps.json の読み込みに失敗しました");
  }
  const data = await res.json();
  modalSteps = data;
}

/**
 * 将来、モーダルフローの初期化処理をここで行う想定のプレースホルダ
 */
function initModalFlow() {
  // 例:
  // setupModal(modalSteps);
  // runModal(modalSteps);
}

// ページ読み込み時に JSON 読込 → 初期化
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadModalSteps();
    initModalFlow();
  } catch (e) {
    console.error(e);
  }
});

// ----------------------
// チャットステップ管理用のステート
// ----------------------
let currentModalStep = 0;
const typewriterStates = new Map();
const CHUNK_FADE_DURATION = 1000;
const CHUNK_BUTTON_DELAY = 200;
const AUTO_REVEAL_NEXT_BUTTON_DELAY = 5000;

/**
 * チャットメッセージ（送受信バブル）を生成して追加する
 * - type: "received" | "sent"
 * - options.autoScroll を false にするとスクロールしない
 */
function appendMessage(
  content,
  type = "received",
  stepIndex = currentModalStep,
  options = {},
) {
  if (!modalText) return null;

  const message = document.createElement("div");
  message.className = `chat-message ${type}`;
  message.dataset.step = `${stepIndex}-${type}-${modalText.children.length}`;

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.innerHTML = content;

  message.appendChild(bubble);
  modalText.appendChild(message);

  if (options.autoScroll !== false) {
    scrollMessageIntoView(message, { behavior: options.scrollBehavior || "auto" });
  }

  return message;
}

/**
 * ユーザー側の発話（ボタンラベル）をバブルとして追加し、
 * そのメッセージをアンカーとして覚えておく
 */
function appendUserResponse(label) {
  if (!label) return;
  const message = appendMessage(label, "sent", currentModalStep, { autoScroll: false });
  anchorMessage = message;
  anchorLockEnabled = true; // 次の自動スクロールまではロック有効
}

function clearTypewriterTimers(state) {
  if (!state || !Array.isArray(state.timers)) {
    return;
  }
  state.timers.forEach((timerId) => clearTimeout(timerId));
  state.timers.length = 0;
}

function clearTypewriterState(stepIndex) {
  const state = typewriterStates.get(stepIndex);
  if (!state) {
    return;
  }
  state.cancelled = true;
  clearTypewriterTimers(state);
  if (typeof state.scrollCleanup === "function") {
    state.scrollCleanup();
  }
  typewriterStates.delete(stepIndex);
}

/**
 * 全ステップのタイピング状態をリセット
 */
function resetTypewriterStates() {
  const indices = Array.from(typewriterStates.keys());
  indices.forEach((stepIndex) => {
    clearTypewriterState(stepIndex);
  });
}

/**
 * typewriterGroups（1ステップ内の複数グループのテキスト）を
 * 1つずつ表示していく処理
 */
function renderTypewriterStep(step, stepIndex) {
  if (!modalText || !modalActions) {
    return;
  }

  let state = typewriterStates.get(stepIndex);
  if (!state) {
    state = {
      groupIndex: 0,
      timers: [],
      cancelled: false,
      isTyping: false,
      scrollCleanup: null,
    };
    typewriterStates.set(stepIndex, state);
    displayedSteps.add(stepIndex);
  }

  if (state.isTyping) {
    return;
  }

  if (typeof state.scrollCleanup === "function") {
    state.scrollCleanup();
    state.scrollCleanup = null;
  }

  const groups = Array.isArray(step.typewriterGroups) ? step.typewriterGroups : [];
  if (state.groupIndex >= groups.length) {
    return;
  }

  modalActions.innerHTML = "";
  clearTypewriterTimers(state);

  const message = document.createElement("div");
  message.className = "chat-message received";
  message.dataset.step = `${stepIndex}-received-${modalText.children.length}`;

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble typing-bubble";

  const container = document.createElement("div");
  container.className = "typing-chunk";
  const groupText =
    typeof groups[state.groupIndex] === "string" ? groups[state.groupIndex] : "";
  container.textContent = groupText;

  bubble.appendChild(container);
  message.appendChild(bubble);
  modalText.appendChild(message);

  state.container = container;
  state.cancelled = false;
  state.isTyping = true;

  const ensureMessageVisible = () => {
    scrollMessageIntoView(message, { behavior: "smooth" });
  };

  ensureMessageVisible();

  // CSS のトランジション発火のために 2 回 requestAnimationFrame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ensureMessageVisible();
      container.classList.add("visible");
    });
  });

  const registerTimer = (callback, delay) => {
    const timerId = setTimeout(() => {
      state.timers = state.timers.filter((id) => id !== timerId);
      callback();
    }, delay);
    state.timers.push(timerId);
    return timerId;
  };

  // 表示完了後、ボタンを表示するまでの処理
  registerTimer(() => {
    if (state.cancelled) {
      return;
    }

    ensureMessageVisible();

    const isLastGroup = state.groupIndex === groups.length - 1;
    const label = isLastGroup
      ? step.finalButtonLabel || "次へ"
      : step.groupButtonLabel || "次へ";

    state.isTyping = false;

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "primary-button chat-action-button";
    nextButton.textContent = label;
    nextButton.addEventListener("click", () => {
      appendUserResponse(label);
      modalActions.innerHTML = "";
      if (typeof state.scrollCleanup === "function") {
        state.scrollCleanup();
        state.scrollCleanup = null;
      }
      if (isLastGroup) {
        if (step.finalButtonMusic) {
          playModalMusic(step.finalButtonMusic, step.finalButtonMusicVolume);
        }
      } else if (step.groupButtonMusic) {
        playModalMusic(step.groupButtonMusic, step.groupButtonMusicVolume);
      }
      if (isLastGroup) {
        clearTypewriterState(stepIndex);
        currentModalStep = Math.min(currentModalStep + 1, modalSteps.length - 1);
        renderModalStep({ delay: 500 });
      } else {
        state.groupIndex += 1;
        renderTypewriterStep(step, stepIndex);
      }
    });

    modalActions.appendChild(nextButton);

    // PC の場合はそのままボタン表示でよい
    if (!isMobileDevice()) {
      nextButton.style.display = "";
      ensureMessageVisible();
      return;
    }

    // モバイルの場合：
    // 「自分でスクロールして最後まで読んだらボタン表示」
    const revealButton = () => {
      if (nextButton.style.display === "") {
        return;
      }
      nextButton.style.display = "";
      cleanupScrollListeners();
    };

    const revealButtonIfNeeded = () => {
      if (!modalText || !message || !message.isConnected) {
        return false;
      }
      const threshold = 24;
      const scrollBottom = modalText.scrollTop + modalText.clientHeight;
      const messageBottom = message.offsetTop + message.offsetHeight;
      if (scrollBottom + threshold >= messageBottom) {
        revealButton();
        return true;
      }
      return false;
    };

    const handleScroll = () => {
      revealButtonIfNeeded();
    };

    function cleanupScrollListeners() {
      if (!modalText) {
        state.scrollCleanup = null;
        return;
      }
      modalText.removeEventListener("scroll", handleScroll);
      modalText.removeEventListener("touchmove", handleScroll);
      state.scrollCleanup = null;
    }

    state.scrollCleanup = cleanupScrollListeners;

    nextButton.style.display = "none";

    if (modalText) {
      modalText.addEventListener("scroll", handleScroll, { passive: true });
      modalText.addEventListener("touchmove", handleScroll, { passive: true });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!revealButtonIfNeeded()) {
          ensureMessageVisible();
        }
      });
    });

    // 自動でも 5秒後にはボタンを表示する逃げ道
    registerTimer(() => {
      if (nextButton.style.display === "none") {
        revealButton();
      }
    }, AUTO_REVEAL_NEXT_BUTTON_DELAY);
  }, CHUNK_FADE_DURATION + CHUNK_BUTTON_DELAY);
}

/**
 * 1ステップ分のメッセージ・ボタン表示を制御するメイン関数
 */
function renderModalStep(options = {}) {
  if (!modalOverlay || !modalText || !modalActions) return;
  const { delay = 0 } = options;
  const step = modalSteps[currentModalStep];
  const stepIndex = currentModalStep;
  const isFirstRender = !displayedSteps.has(stepIndex);

  // typewriterGroups 形式のステップ
  if (Array.isArray(step.typewriterGroups) && step.typewriterGroups.length > 0) {
    const showStep = () => {
      renderTypewriterStep(step, stepIndex);
    };

    if (delay > 0) {
      setTimeout(() => {
        if (!modalOverlay || modalOverlay.classList.contains("hidden")) {
          return;
        }
        showStep();
      }, delay);
    } else {
      showStep();
    }
    return;
  }

  // 初回だけメッセージ本体を描画
  if (isFirstRender) {
    displayedSteps.add(stepIndex);

    const hasChunks = Array.isArray(step.chunks) && step.chunks.length > 0;

    // chunks による段階的表示
    if (hasChunks) {
      const message = document.createElement("div");
      message.className = "chat-message received";
      message.dataset.step = `${stepIndex}-received-${modalText.children.length}`;

      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";
      message.appendChild(bubble);
      modalText.appendChild(message);
      scrollMessageIntoView(message);

      const baseDelay = typeof delay === "number" && delay > 0 ? delay : 0;
      const stagger =
        typeof step.staggerDelay === "number" && step.staggerDelay > 0
          ? step.staggerDelay
          : 0;

      step.chunks.forEach((chunk, chunkIndex) => {
        const showChunk = () => {
          if (!modalOverlay || modalOverlay.classList.contains("hidden")) {
            displayedSteps.delete(stepIndex);
            return;
          }
          if (chunkIndex > 0) {
            bubble.innerHTML += "<br><br>";
          }
          bubble.innerHTML += chunk;
          scrollMessageIntoView(message);
        };

        const chunkDelay = baseDelay + chunkIndex * stagger;
        if (chunkDelay > 0) {
          setTimeout(showChunk, chunkDelay);
        } else {
          showChunk();
        }
      });
    } else {
      // 普通のテキスト 1発表示
      const showMessage = () => {
        if (!modalOverlay || modalOverlay.classList.contains("hidden")) {
          displayedSteps.delete(stepIndex);
          return;
        }
        if (
          typeof step.text === "string" &&
          step.text.length > 0 &&
          !step.showButtonsInBubble
        ) {
          appendMessage(step.text, "received", stepIndex);
        }
      };

      if (delay > 0) {
        setTimeout(showMessage, delay);
      } else {
        showMessage();
      }
    }
  }

  // ボタンエリアの描画
  modalActions.innerHTML = "";

  // バブルの中にボタンを入れるモード
  if (step.showButtonsInBubble) {
    if (isFirstRender) {
      const message = document.createElement("div");
      message.className = "chat-message received";
      message.dataset.step = `${stepIndex}-received-${modalText.children.length}`;

      const bubble = document.createElement("div");
      bubble.className = "chat-bubble action-bubble";

      if (typeof step.text === "string" && step.text.length > 0) {
        const textContainer = document.createElement("div");
        textContainer.className = "action-bubble-text";
        textContainer.innerHTML = step.text;
        bubble.appendChild(textContainer);
      }

      const actionsContainer = document.createElement("div");
      actionsContainer.className = "bubble-actions";

      step.buttons.forEach((buttonConfig) => {
        if (buttonConfig.type === "link") {
          // LINE へのリンクボタン
          const linkButton = document.createElement("a");
          linkButton.className = "primary-button chat-action-button";
          linkButton.textContent = buttonConfig.label;
          linkButton.href = buttonConfig.href;
          if (buttonConfig.target) {
            linkButton.target = buttonConfig.target;
            linkButton.rel = "noopener noreferrer";
          }
          linkButton.addEventListener("click", () => {
            appendUserResponse(buttonConfig.label);
            fadeOutCurrentMusic();
            showLineFollowUp(buttonConfig.href);
          });
          actionsContainer.appendChild(linkButton);
        } else if (buttonConfig.type === "pricing") {
          // 料金表セクションへ遷移
          const pricingButton = document.createElement("button");
          pricingButton.type = "button";
          pricingButton.className = "primary-button chat-action-button";
          pricingButton.textContent = buttonConfig.label;
          pricingButton.addEventListener("click", () => {
            appendUserResponse(buttonConfig.label);
            fadeOutCurrentMusic();
            closeModal();
            showSection("pricing");
            if (pricingSection) {
              setTimeout(() => {
                pricingSection.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }
          });
          actionsContainer.appendChild(pricingButton);
        } else if (buttonConfig.type === "next") {
          // 次のステップへ
          const nextButton = document.createElement("button");
          nextButton.type = "button";
          nextButton.className = "primary-button chat-action-button";
          nextButton.textContent = buttonConfig.label || "次へ";
          nextButton.addEventListener("click", () => {
            appendUserResponse(buttonConfig.label || "次へ");
            if (buttonConfig.music) {
              playModalMusic(buttonConfig.music, buttonConfig.musicVolume);
            }
            currentModalStep = Math.min(currentModalStep + 1, modalSteps.length - 1);
            renderModalStep({ delay: 500 });
          });
          actionsContainer.appendChild(nextButton);
        }
      });

      if (actionsContainer.children.length > 0) {
        bubble.appendChild(actionsContainer);
      }

      message.appendChild(bubble);
      modalText.appendChild(message);
      scrollMessageIntoView(message);
    }

    return;
  }

  // フッター側にボタンを並べる通常モード
  step.buttons.forEach((buttonConfig) => {
    if (buttonConfig.type === "next") {
      const nextButton = document.createElement("button");
      nextButton.type = "button";
      nextButton.className = "primary-button chat-action-button";
      nextButton.textContent = buttonConfig.label || "次へ";
      nextButton.addEventListener("click", () => {
        appendUserResponse(buttonConfig.label || "次へ");
        if (buttonConfig.music) {
          playModalMusic(buttonConfig.music, buttonConfig.musicVolume);
        }
        currentModalStep = Math.min(currentModalStep + 1, modalSteps.length - 1);
        renderModalStep({ delay: 500 });
      });
      modalActions.appendChild(nextButton);
    } else if (buttonConfig.type === "link") {
      const linkButton = document.createElement("a");
      linkButton.className = "primary-button chat-action-button";
      linkButton.textContent = buttonConfig.label;
      linkButton.href = buttonConfig.href;
      if (buttonConfig.target) {
        linkButton.target = buttonConfig.target;
        linkButton.rel = "noopener noreferrer";
      }
      linkButton.addEventListener("click", () => {
        appendUserResponse(buttonConfig.label);
        fadeOutCurrentMusic();
        showLineFollowUp(buttonConfig.href);
      });
      modalActions.appendChild(linkButton);
    } else if (buttonConfig.type === "pricing") {
      const pricingButton = document.createElement("button");
      pricingButton.type = "button";
      pricingButton.className = "primary-button chat-action-button";
      pricingButton.textContent = buttonConfig.label;
      pricingButton.addEventListener("click", () => {
        appendUserResponse(buttonConfig.label);
        fadeOutCurrentMusic();
        closeModal();
        showSection("pricing");
        if (pricingSection) {
          setTimeout(() => {
            pricingSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      });
      modalActions.appendChild(pricingButton);
    }
  });
}

/**
 * チャットモーダルを開き、ステップ 0 から開始
 */
function openModal(stepIndex = 0) {
  if (!modalOverlay) return;
  currentModalStep = stepIndex;
  displayedSteps.clear();
  resetTypewriterStates();
  lineInfoDisplayed = false;
  if (modalText) {
    modalText.innerHTML = "";
  }
  modalOverlay.classList.remove("hidden");
  modalOverlay.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
  if (hamburger) {
    hamburgerWasHidden = hamburger.classList.contains("hidden");
    hamburger.classList.add("hidden");
  }

  // 「はじまり」ボタンを押した瞬間にメッセージが見えるよう、
  // 表示後のフレームでレンダリング開始
  requestAnimationFrame(() => {
    renderModalStep();
    modalOverlay.focus();
  });
}

/**
 * シンプルなモバイル判定
 */
function isMobileDevice() {
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    )
  );
}

/**
 * LINE 友だち追加後の案内メッセージを、条件付きで 1 回だけ出す
 */
function showLineFollowUp(href) {
  if (lineInfoDisplayed) {
    return;
  }
  lineInfoDisplayed = true;

  setTimeout(() => {
    if (!modalOverlay || modalOverlay.classList.contains("hidden")) {
      return;
    }

    const message = document.createElement("div");
    message.className = "chat-message received";

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble line-followup-bubble";

    const contactText = `<div class="line-followup-text">${lineContactMessageHtml}</div>`;

    if (isMobileDevice()) {
      const linkHtml = href
        ? `<a class="primary-button chat-action-button line-followup-button" href="${href}" target="_blank" rel="noopener noreferrer">LINEはこちら</a>`
        : "";
      bubble.innerHTML = `${linkHtml}${contactText}`;
    } else {
      bubble.innerHTML = `<img src="images/QR.png" alt="LINE QRコード" class="line-followup-qr" />${contactText}`;
    }

    message.appendChild(bubble);
    modalText.appendChild(message);
    scrollMessageIntoView(message);
  }, lineFollowUpDelay);
}

/**
 * モーダルを閉じる
 * - restoreFocus が true の場合、開始ボタンにフォーカスを戻す
 */
function closeModal(options = {}) {
  const { restoreFocus = true } = options;
  if (!modalOverlay || modalOverlay.classList.contains("hidden")) return;
  fadeOutCurrentMusic();
  resetTypewriterStates();
  modalOverlay.classList.add("hidden");
  modalOverlay.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");
  if (hamburger && !hamburgerWasHidden) {
    hamburger.classList.remove("hidden");
  }
  if (restoreFocus && startButton) {
    startButton.focus();
  }
}

// モーダルのクローズボタン
if (journeyCloseButton) {
  journeyCloseButton.addEventListener("click", () => {
    closeModal({ restoreFocus: false });
    showTopPage();
  });
}

// 「はじまり」ボタンでモーダルを開く
if (startButton) {
  startButton.addEventListener("click", () => {
    openModal(0);
  });
}

// 背景クリック・Esc キーでモーダルを閉じる
if (modalOverlay) {
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalOverlay.classList.contains("hidden")) {
      closeModal();
    }
  });
}

// ========================================================
// 6. イントロオーバーレイ・カード演出関連
// ========================================================

/**
 * イントロオーバーレイを viewport サイズに合わせる
 */
function adjustIntroOverlaySize() {
  introOverlay.style.height = `${window.innerHeight}px`;
  introOverlay.style.width = `${window.innerWidth}px`;
}
window.addEventListener("load", adjustIntroOverlaySize);
window.addEventListener("resize", adjustIntroOverlaySize);
adjustIntroOverlaySize();

// カード演出で使う本文カラー/説明テキスト
const additionalData = {
  "1image": {
    color: "rgb(102, 179, 255)",
    text: `からだを止めて身を守る\n急ブレーキの役割\n止まってるのが\n不安に感じることはありません\n安心して休んで下さい`,
  },
  "2image": {
    color: "rgb(89, 222, 140)",
    text: `笑顔が増え\nリラックスしている\n安心できて\n人と繋がろうとする\nチューニングの役割`,
  },
  "3image": {
    color: "rgb(251, 111, 123)",
    text: `からだを奮い立たせる\nアクセルの役割\nスピードオーバーに注意して\nゆっくり安心して\n動ける状態を目指しましょう`,
  },
};

/**
 * カード画像を 30枚ほど一瞬ばらまく演出（古いバージョン）
 * - playCardBurst のほうが現行
 */
function createBurstCards() {
  const container = document.createElement("div");
  container.id = "card-burst";
  container.style.position = "fixed";
  container.style.top = 0;
  container.style.left = 0;
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.pointerEvents = "none";
  container.style.zIndex = 1000;

  // 1枚目のカードのサイズを取得（参考用）
  const firstCard = document.querySelector(".image-container img");
  const cardWidth = firstCard ? firstCard.offsetWidth : 100;
  const cardHeight = firstCard ? firstCard.offsetHeight : 150;

  for (let i = 0; i < 20; i++) {
    const card = document.createElement("img");
    card.src = "images/card.png";
    card.className = "burst-card";
    card.style.position = "absolute";
    card.style.top = "50%";
    card.style.left = "50%";
    card.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
    card.style.width = `${cardWidth}px`;
    card.style.height = `${cardHeight}px`;
    container.appendChild(card);
  }

  document.body.appendChild(container);

  // 表示後 1秒でコンテナごと削除
  setTimeout(() => {
    container.remove();
  }, 1000);
}

/**
 * 20枚のカードを画面のあちこちに散らしつつフェードアウトさせる演出
 */
function playCardBurst(onComplete) {
  // メインの3枚のカードをバーストカードと同時に表示する
  gallery.style.visibility = "visible";

  const container = document.createElement("div");
  container.id = "card-burst";
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "150",
  });
  const footer = document.querySelector("footer");
  const footerHeight = footer ? footer.offsetHeight : 0;
  const headerHeight = header ? header.offsetHeight : 0;
  const refImg = document.querySelector(".image-container");
  const cardWidth = refImg ? refImg.offsetWidth : 100;
  const cardHeight = refImg ? refImg.offsetHeight : 100;
  const availableWidth = window.innerWidth - cardWidth;
  const availableHeight = window.innerHeight - headerHeight - footerHeight - cardHeight;

  for (let i = 0; i < 20; i++) {
    const card = document.createElement("img");
    card.src = "images/card.png";
    card.className = "burst-card";
    const left = cardWidth / 2 + availableWidth * (0.4 + Math.random() * 0.2);
    const top = headerHeight + cardHeight / 2 + availableHeight * (0.4 + Math.random() * 0.2);
    Object.assign(card.style, {
      position: "absolute",
      width: `${cardWidth}px`,
      height: `${cardHeight}px`,
      left: `${left}px`,
      top: `${top}px`,
      transform: `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`,
    });
    container.appendChild(card);
  }
  document.body.appendChild(container);
  const cards = container.querySelectorAll(".burst-card");

  // ヘッダーをカードのフェードアウトと同時に表示
  header.style.visibility = "visible";
  header.style.opacity = 0;
  gsap.to(header, { opacity: 1, duration: 1 });

  cards.forEach((card, index) => {
    gsap.to(card, {
      opacity: 0,
      duration: 0.5,
      delay: index * 0.1,
      x: () => (Math.random() - 0.5) * 200,
      y: () => (Math.random() - 0.5) * 200,
      rotation: () => Math.random() * 360,
      rotateX: () => Math.random() * 360,
      rotateY: () => Math.random() * 360,
      onComplete: () => {
        if (index === cards.length - 1) {
          container.remove();
          if (typeof onComplete === "function") {
            onComplete();
          }
        }
      },
    });
  });
}

/**
 * 雑に散らばっている .burst-card 達をさらに飛び散らせる演出
 */
function scatterCards() {
  const cards = document.querySelectorAll(".burst-card");

  return new Promise((resolve) => {
    gsap.to(cards, {
      duration: 1,
      x: () => (Math.random() - 0.5) * 300,
      y: () => (Math.random() - 0.5) * 300,
      rotation: () => Math.random() * 360,
      ease: "power2.out",
      onComplete: resolve,
    });
  });
}

/**
 * 3枚のカードを、裏面でランダムな位置にばらまいておく
 */
function prepareCards() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const footer = document.querySelector("footer");
  const footerHeight = footer ? footer.offsetHeight : 0;
  const headerHeight = header ? header.offsetHeight : 0;
  images.forEach((card) => {
    const img = card.querySelector("img");
    img.dataset.front = `images/${img.alt}.jpg`;
    img.src = "images/card.png";

    // カード自身の高さ（未取得なら仮）
     const cardElHeight = card.offsetHeight || 150;
     const safeHeight = Math.max(0, vh - headerHeight - footerHeight - cardElHeight);
    gsap.set(card, {
      x: (Math.random() - 0.5) * vw,
      // header の下〜footer の上の範囲に収める
      y: headerHeight / 2 + (Math.random() - 0.5) * safeHeight,
      rotation: Math.random() * 360,
      rotateY: 180,
    });
  });
}

/**
 * カードをクルッと表に返すアニメーション
 */
function flipCardsToFront() {
  images.forEach((card, index) => {
    const img = card.querySelector("img");

    gsap.to(card, {
      rotateY: 0,
      duration: 1,
      delay: index * 0.3,
      ease: "power2.out",
      onStart: () => {
        img._flipped = false; // 初期化
      },
      onUpdate: () => {
        const currentRotation = gsap.getProperty(card, "rotateY");
        if (!img._flipped && currentRotation < 95 && currentRotation > 85) {
          img.src = img.dataset.front;
          img._flipped = true;
        }
      },
    });
  });
}

/**
 * カード 3枚を中央に寄せて整列させる
 */
function animateCards() {
  gallery.classList.add("centered");

  // ★追加：整列時の「中心位置」をヘッダーに被らないよう調整する
  const headerHeight = header ? header.offsetHeight : 0;
  const refCard = images && images[0] ? images[0] : null;
  const cardHeight = refCard ? refCard.offsetHeight : 0;

  // カード上端が header の下に来るように、中心Yの最低値を作る
  const padding = 16; // 好みで 12〜24
  const minCenterY = headerHeight + cardHeight / 2 + padding;

  // 本来の中央(50%)と比較して、必要なら下げる
  const center50 = window.innerHeight * 0.5;
  const targetCenterY = Math.max(center50, minCenterY);

  // centered の top:50% を上書き（inline が勝つ）
  gallery.style.top = `${targetCenterY}px`;

  gsap.to(images, {
    x: 0,
    y: 0,
    rotation: 0,
    duration: 1,
    stagger: 0.5,
    ease: "power2.out",
    onComplete: () => {
      cardsClickable = true;
    },
  });
}


/**
 * 白いオーバーレイを一瞬挟むトランジション
 */
function showWhiteOverlay() {
  const overlay = document.getElementById("white-overlay");

  return new Promise((resolve) => {
    gsap.fromTo(
      overlay,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1,
        ease: "power1.inOut",
        onComplete: () => {
          gsap.to(overlay, {
            opacity: 0,
            duration: 0.5,
            ease: "power1.inOut",
            onComplete: resolve,
          });
        },
      },
    );
  });
}

/**
 * RGB の円を動かしながら画面遷移する演出
 * - 最後に showTopPage() を呼んでトップに戻す
 */
function playTransitionAnimation() {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.id = "transition-overlay";
    document.body.appendChild(overlay);

    const colors = ["red", "green", "blue"];
    const circles = colors.map((color) => {
      const div = document.createElement("div");
      div.className = `color-circle ${color}`;
      overlay.appendChild(div);
      return div;
    });

    const positions = [
      { top: "50%", left: "20%" },
      { top: "20%", left: "80%" },
      { top: "80%", left: "80%" },
    ];
    positions.forEach((pos, i) => {
      gsap.set(circles[i], { ...pos, xPercent: -50, yPercent: -50 });
    });

    const tl = gsap.timeline({
      onComplete: () => {
        overlay.remove();
        resolve();
      },
    });

    tl.to(overlay, { backgroundColor: "#808080", duration: 1 }, 0);
    tl.to(circles, { opacity: 1, duration: 1 }, 0);
    tl.to(circles, { top: "50%", left: "50%", duration: 1 }, ">");
    tl.to(overlay, { backgroundColor: "#ffffff", duration: 1 }, ">");
    tl.to(circles, { opacity: 0, duration: 1 }, "<");
    tl.add(() => {
      showTopPage();
    });
    tl.to(overlay, { opacity: 0, duration: 0.5 }, ">");
  });
}

// ========================================================
// 7. イントロシーケンス（テキスト → カード）
// ========================================================

/**
 * イントロ演出の各ステップ定義
 * - start: 開始時の処理
 * - finish: スキップ時に強制完了させる処理
 * - delay: 次のステップまでの時間(ms)
 */
const introSequence = [
  {
    start: () => introText1.classList.add("show-text"),
    finish: () => {
      introText1.style.animation = "none";
      introText1.style.opacity = "1";
    },
    delay: 3000,
  },
  {
    start: () => introText2.classList.add("show-text"),
    finish: () => {
      introText2.style.animation = "none";
      introText2.style.opacity = "1";
    },
    delay: 2000,
  },
  {
    start: () => introCard.classList.add("show-card"),
    finish: () => {
      introCard.style.animation = "none";
      introCard.style.opacity = "1";
      introCard.style.pointerEvents = "auto";
    },
    delay: 5000,
  },
  {
    start: () => {
      const tipText = window.matchMedia("(max-width: 600px)").matches
        ? "※画像をタップ"
        : "※画像をクリック";
      clickTip.textContent = tipText;
      clickTip.classList.add("blink");
      skipButton.classList.add("show-text");
      skipButton.style.pointerEvents = "auto";
    },
    finish: () => {},
    delay: 0,
  },
];

let introStep = 0;
let introTimer = null;

/**
 * introSequence[introStep] を実行し、一定時間後に次へ進む
 */
function playIntroStep() {
  if (introStep >= introSequence.length) return;
  const step = introSequence[introStep];
  step.start();
  introTimer = setTimeout(() => {
    introStep++;
    playIntroStep();
  }, step.delay);
}

// DOM 準備完了後にイントロを開始
window.addEventListener("DOMContentLoaded", () => {
  introTimer = setTimeout(playIntroStep, 100);
});

// イントロオーバーレイをクリックすると、次のステップにスキップ
introOverlay.addEventListener("click", (e) => {
  if (e.target === introCard || introStep >= introSequence.length) return;
  clearTimeout(introTimer);
  const step = introSequence[introStep];
  step.finish();
  introStep++;
  playIntroStep();
});

// 「スキップ」クリックでイントロを完全に飛ばしてトップへ
skipButton.addEventListener("click", (e) => {
  e.stopPropagation();
  clearTimeout(introTimer);
  introStep = introSequence.length;
  introOverlay.remove();
  showTopPage();
});

// 中央のカードをクリックしたときのメイン演出開始
introCard.addEventListener("click", () => {
  if (introPlayed) return;
  introPlayed = true;
  introCard.style.pointerEvents = "none";

  // イントロ要素を消してからトランジションに入る
  introOverlay.remove();
  header.style.visibility = "hidden";
  gallery.style.visibility = "hidden";

  prepareCards(); // 3枚のカードなど初期セット
  createBurstCards(); // 一瞬だけ 30枚生成

  Promise.all([scatterCards(), showWhiteOverlay()]).then(() => {
    playCardBurst(() => {
      // カードバースト終了後に 3枚を整列 → 表にめくる
      header.style.visibility = "visible";
      animateCards();
      setTimeout(flipCardsToFront, 2000);
    });
  });
});

// モバイル時は「もっと見る」ボタンのラベルを短く
if (window.matchMedia("(max-width: 600px)").matches) {
  moreButton.textContent = "詳細へ";
}

let currentImg = null;

// 3枚カードのクリックで詳細表示へ
images.forEach((img) => {
  img.addEventListener("click", () => {
    if (!cardsClickable || currentImg) return;
    currentImg = img;
    images.forEach((i) => {
      if (i !== img) {
        i.classList.add("fade-out-other");
      }
    });
    setTimeout(() => {
      images.forEach((i) => {
        if (i !== img) {
          i.classList.add("hidden");
        }
      });
      header.classList.add("hidden");
      window.scrollTo(0, 0);
      img.style.transform = "";
      img.classList.add("expanded");
      body.classList.add("fade-bg");
      setTimeout(() => {
        img.classList.add("dim-image");
        const desc = img.getAttribute("data-desc");
        descriptionDiv.innerHTML = desc.replace(/\n/g, "<br>");
        details.appendChild(descriptionDiv);
        details.appendChild(moreButton);
        descriptionDiv.style.marginTop = "0";
        img.appendChild(details);
        details.classList.remove("hidden");
        descriptionDiv.classList.add("fade-in-text");
        moreButton.classList.add("fade-in-btn");
      }, 500);
    }, 500);
  });
});

// ========================================================
// 8. セクション切り替え・トップページ制御
// ========================================================

/**
 * id を指定して該当セクションだけ表示する
 */
function showSection(id) {
  const next = document.getElementById(id);
  if (!next) return;

  const prev = activeSectionId ? document.getElementById(activeSectionId) : null;

  const feelSection = document.getElementById("feel");
  const feelVideoLayer = feelSection
    ? feelSection.querySelector(".feel-video-layer")
    : null;
  let feelVideoTimer = null;

  // まず、今表示したいもの「以外」を全部 hidden にする保険
  contentSections.forEach((sec) => {
    if (sec.id !== id) {
      sec.classList.add("hidden");
      if (window.gsap) {
        gsap.set(sec, { clearProps: "opacity,visibility" });
      }
    }
    if (sec.id === id) {
      sec.classList.remove("hidden");
    } else {
      sec.classList.add("hidden");
    }
      // 背景動画のフェード制御
    if (!feelVideoLayer) return;

    // いったんリセット
    feelVideoLayer.classList.remove("is-visible");
    if (feelVideoTimer) {
      clearTimeout(feelVideoTimer);
      feelVideoTimer = null;
    }

    // 「感じあうロゴ」セクションに遷移したときだけ 0.5 秒後に薄く表示
    if (id === "feel") {
      feelVideoTimer = setTimeout(() => {
        feelVideoLayer.classList.add("is-visible");
      }, 500); // 0.5 秒後
    }
  });

  // 同じセクションならここで終わり（2回目以降だけ効く）
  if (id === activeSectionId) {
    next.classList.remove("hidden");
    return;
  }

  // 前のセクションをフェードアウト
  if (prev && prev !== next) {
    if (window.gsap) {
      gsap.to(prev, {
        autoAlpha: 0,
        duration: 0.3,
        onComplete: () => {
          prev.classList.add("hidden");
          gsap.set(prev, { clearProps: "opacity,visibility" });
        },
      });
    } else {
      prev.classList.add("hidden");
    }
  }

  // 次のセクションを表示 & フェードイン
  next.classList.remove("hidden");

  if (window.gsap) {
    gsap.fromTo(
      next,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.3,
        clearProps: "opacity,visibility",
      }
    );
  }

  activeSectionId = id;

  // ★追加
  window.scrollTo({ top: 0, behavior: "smooth" });
}


/**
 * 詳細表示やチャットから TOP セクションに戻る
 */
function showTopPage() {
  details.classList.add("hidden");
  if (currentImg) currentImg.classList.add("hidden");
  gallery.classList.add("hidden");
  body.style.backgroundColor = "";
  subtext.style.display = "none";
  closeMobileMenu();
  mainMenu.classList.remove("hidden");
  mainContent.classList.remove("hidden");
  header.classList.remove("hidden");
  hamburger.classList.remove("hidden");
  syncMenuAccessibilityState();
  window.scrollTo(0, 0);
  showSection("top");
  detailStage = "done";
  
  // ★ ここでフッターを表示
  if (siteFooter) {
    siteFooter.classList.remove("hidden");
  }
  if (gallery) {
  gallery.style.top = "";
}
}

// メインメニュークリックでページ内遷移 & モーダルクローズ
mainMenu.addEventListener("click", (e) => {
  const target = e.target;
  if (target.tagName !== "A") return;
  e.preventDefault();
  closeMobileMenu();
  if (target.id === "choose-images") {
    // 画像選択ページへ
    window.location.href = "index.html";
    return;
  }
  closeModal({ restoreFocus: false });
  const section = target.dataset.section;
  if (section) {
    showSection(section);
  }
});

// フッターナビからのページ内遷移
const footerNav = document.querySelector(".footer-nav-row");

if (footerNav) {
  footerNav.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    e.preventDefault();

    // モーダルが開いていたら閉じる
    closeModal({ restoreFocus: false });

    const section = link.dataset.section;

    // Uranai だけは特別扱い（ヘッダーの Uranai と同じ動きに揃える）
    if (section === "uranai") {
      // ここは運用に合わせて調整：
      // 現状 index.html 自体が Uranai ページなら、そのままリロード
      window.location.href = "index.html";
      return;
    }

    if (section) {
      showSection(section);
    }
  });
}

// フッター上段「お問い合わせ」から contact セクションへ
const footerSnsRow = document.querySelector(".footer-sns-row");

if (footerSnsRow) {
  footerSnsRow.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const section = link.dataset.section;
    if (!section) {
      // Instagram / YouTube など data-section を持たないリンクはそのまま動かす
      return;
    }

    // data-section を持つのは「お問い合わせ」だけなので、ここだけ制御する
    e.preventDefault();
    closeModal({ restoreFocus: false });
    showSection(section);
  });
}


// 「もっと見る」ボタンからのシナリオ進行
let detailStage = "initial";
moreButton.addEventListener("click", (e) => {
  if (detailStage === "initial") {
    // 第一段階：カード説明 → 体の状態テキストへ遷移
    e.preventDefault();
    descriptionDiv.classList.add("fade-up-out");
    moreButton.classList.add("fade-up-out");
    setTimeout(() => {
      descriptionDiv.style.display = "none";
      moreButton.style.display = "none";
    }, 1000);
    setTimeout(() => {
      const imgAlt = currentImg.querySelector("img").alt;
      const data = additionalData[imgAlt];
      body.classList.remove("fade-bg");
      body.style.backgroundColor = data.color;
      descriptionDiv.innerHTML = data.text.replace(/\n/g, "<br>");
      moreButton.textContent = "次へ";
      moreButton.href = "#";
      details.insertBefore(descriptionDiv, moreButton);
      descriptionDiv.style.marginTop = "10px";
      descriptionDiv.style.display = "block";
      moreButton.style.display = "inline-block";
      [descriptionDiv, moreButton].forEach((el) => {
        el.classList.remove("fade-up-out");
        el.classList.add("fade-in-quick");
      });
      detailStage = "next";
    }, 2000);
  } else if (detailStage === "next") {
    // 第二段階：「次へ」でページ遷移演出
    e.preventDefault();
    moreButton.style.pointerEvents = "none";
    playTransitionAnimation();
  }
});

// ========================================================
// 9. ロゴグリッド（U ロゴ）の生成
// ========================================================

// ----------------------
// ロゴ生成ロジック：設定値
// ----------------------
const GRID_ROWS = 10;
const GRID_COLS = 10;

// U の形にしたいマスの index（10×10 グリッド）
// 少し丸みのある、太めの U 形
const U_ACTIVE_INDICES = [
  // 上から 1〜6 行目の左右の縦棒（太め）
  1, 2, 7, 8,
  11, 12, 17, 18,
  21, 22, 27, 28,
  31, 32, 37, 38,
  41, 42, 47, 48,
  51, 52, 57, 58,

  // 下側〜内側にかけてのカーブ部分
  // 左側が少し内側に食い込む & 右側も同様
  61, 62, 63, 66, 67, 68,
  71, 72, 73, 74, 75, 76, 77, 78,
  82, 83, 84, 85, 86, 87,
  93, 94, 95, 96,
];

const MAX_TILES = U_ACTIVE_INDICES.length;

// ----------------------
// JSON 読み込み
// ----------------------
async function loadLogos() {
  const response = await fetch("data/logos.json");
  if (!response.ok) {
    console.error("JSON の読み込みに失敗しました");
    return [];
  }
  return response.json();
}

// ----------------------
// ロゴ選択ロジック
// ----------------------
function createLogoTileOrder(logos, maxTiles) {
  const result = [];

  if (logos.length >= maxTiles) {
    // 50 個以上 → シャッフルしてランダム抽出
    const shuffled = [...logos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, maxTiles);
  }

  // 50 個未満 → 繰り返し配置
  let idx = 0;
  while (result.length < maxTiles) {
    result.push(logos[idx]);
    idx = (idx + 1) % logos.length;
  }

  return result;
}

// ----------------------
// U グリッド生成
// ----------------------
async function initGallery() {
  const gridEl = document.getElementById("logo-u-grid");
  if (!gridEl) return;

  // JSON 読み込み
  const logos = await loadLogos();

  gridEl.style.setProperty("--rows", GRID_ROWS);
  gridEl.style.setProperty("--cols", GRID_COLS);

  const tileLogos = createLogoTileOrder(logos, MAX_TILES);
  const indexToLogo = new Map();

  U_ACTIVE_INDICES.forEach((cellIndex, i) => {
    indexToLogo.set(cellIndex, tileLogos[i]);
  });

  // 全マス生成
  const total = GRID_ROWS * GRID_COLS;
  for (let i = 0; i < total; i++) {
    const cell = document.createElement("div");

    const logo = indexToLogo.get(i);
    if (logo) {
      cell.className = "logo-cell";
      const img = document.createElement("img");
      img.src = logo.imageSrc;
      img.alt = logo.name;
      cell.appendChild(img);

      cell.addEventListener("click", () => showDetail(logo));
    } else {
      cell.className = "logo-cell logo-cell--empty";
    }

    gridEl.appendChild(cell);
  }
}

// ----------------------
// 詳細表示（ロゴをクリックした時）
// ----------------------
function showDetail(logo) {
  const placeholder = document.querySelector(".logo-detail-placeholder");
  const content = document.querySelector(".logo-detail-content");
  const thumb = document.getElementById("detail-thumbnail");
  const author = document.getElementById("detail-author");
  const desc = document.getElementById("detail-description");

  if (placeholder) placeholder.style.display = "none";

  content.classList.remove("is-hidden");

  thumb.src = logo.imageSrc;
  thumb.alt = logo.name;
  author.textContent = logo.author;
  desc.textContent = logo.description;
}

// ロゴグリッド初期化
document.addEventListener("DOMContentLoaded", initGallery);

// ----------------------
// TOP画面に雪が降るアニメーション
// ----------------------

function initSnow() {
  const layer = document.querySelector(".top-snow-layer");
  if (!layer) return;

  const FLAKES = 40; // 粒の数。重ければ 20〜30 に減らす

  for (let i = 0; i < FLAKES; i++) {
    const flake = document.createElement("div");
    flake.className = "snowflake";

    const size = 2 + Math.random() * 3; // 2〜5px
    const left = Math.random() * 100;   // 0〜100%
    const duration = 8 + Math.random() * 8; // 8〜16秒
    const delay = Math.random() * -duration; // ばらけさせる

    flake.style.setProperty("--flake-size", `${size}px`);
    flake.style.setProperty("--flake-left", `${left}%`);
    flake.style.setProperty("--flake-duration", `${duration}s`);
    flake.style.setProperty("--flake-delay", `${delay}s`);

    layer.appendChild(flake);
  }
}

// DOM 構築後に一度だけ呼ぶ
document.addEventListener("DOMContentLoaded", () => {
  initSnow();
});

// ===========================
// フッター上段：アコーディオン（ドロワー）
// ===========================
const footerDrawer = document.getElementById("footer-drawer");
const footerDrawerHandle = document.querySelector(".footer-drawer-handle");

function setFooterDrawer(open) {
  if (!siteFooter || !footerDrawer || !footerDrawerHandle) return;

  siteFooter.classList.toggle("is-drawer-open", open);
  footerDrawer.setAttribute("aria-hidden", open ? "false" : "true");
  footerDrawerHandle.setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleFooterDrawer() {
  if (!siteFooter) return;
  const isOpen = siteFooter.classList.contains("is-drawer-open");
  setFooterDrawer(!isOpen);
}

if (footerDrawerHandle) {
  footerDrawerHandle.addEventListener("click", (e) => {
    e.preventDefault();
    toggleFooterDrawer();
  });
}

// 外側クリックで閉じる（ドロワー内は除外）
document.addEventListener("click", (e) => {
  if (!siteFooter) return;
  if (!siteFooter.classList.contains("is-drawer-open")) return;

  const insideFooter = e.target.closest(".site-footer");
  if (!insideFooter) {
    setFooterDrawer(false);
  }
});

// Escで閉じる
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  setFooterDrawer(false);
});

// ドロワー内の「お問い合わせ」クリックは showSection に繋ぐ（既存の footer-sns-row と同様）
if (footerDrawer) {
  footerDrawer.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const section = link.dataset.section;
    if (!section) return; // 外部リンクはそのまま

    e.preventDefault();
    setFooterDrawer(false);
    closeModal?.({ restoreFocus: false });
    showSection(section);
  });
}

/**
 * スワイプで開閉（簡易）
 * 上スワイプ: open
 * 下スワイプ: close
 */
let footerTouchStartY = null;

if (siteFooter) {
  siteFooter.addEventListener(
    "touchstart",
    (e) => {
      footerTouchStartY = e.touches?.[0]?.clientY ?? null;
    },
    { passive: true }
  );

  siteFooter.addEventListener(
    "touchend",
    (e) => {
      if (footerTouchStartY == null) return;
      const endY = e.changedTouches?.[0]?.clientY ?? null;
      if (endY == null) return;

      const dy = endY - footerTouchStartY;

      // 上方向に 35px 以上 → 開く
      if (dy < -35) setFooterDrawer(true);

      // 下方向に 35px 以上 → 閉じる
      if (dy > 35) setFooterDrawer(false);

      footerTouchStartY = null;
    },
    { passive: true }
  );
}

// ===========================
// 動画モーダル（フッターサムネ用）
// ===========================
const videoModal = document.getElementById("video-modal");
const videoModalEmbed = document.getElementById("video-modal-embed");

function openVideoModal(videoId) {
  if (!videoModal || !videoModalEmbed) return;

  videoModal.classList.remove("hidden");
  videoModal.setAttribute("aria-hidden", "false");

  // autoplay=1 / mute=1 で静かに開始（必要なら mute=0 に変更）
  videoModalEmbed.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1"
      title="動画再生"
      frameborder="0"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
    ></iframe>
  `;
}

function closeVideoModal() {
  if (!videoModal || !videoModalEmbed) return;

  videoModal.classList.add("hidden");
  videoModal.setAttribute("aria-hidden", "true");

  // 再生停止（iframe破棄）
  videoModalEmbed.innerHTML = "";
}

document.addEventListener("click", (e) => {
  const thumb = e.target.closest(".footer-video-thumb");
  if (thumb) {
    const videoId = thumb.dataset.videoId;
    if (videoId) openVideoModal(videoId);
    return;
  }

  const closeEl = e.target.closest('[data-close="true"]');
  if (closeEl && videoModal && !videoModal.classList.contains("hidden")) {
    closeVideoModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeVideoModal();
});
