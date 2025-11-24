const gallery = document.querySelector(".gallery");
const orderings = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
];
const containers = Array.from(gallery.children);
const randomOrder = orderings[Math.floor(Math.random() * orderings.length)];
randomOrder.forEach((i) => gallery.appendChild(containers[i]));

const images = document.querySelectorAll(".image-container");
let cardsClickable = false;
const details = document.querySelector(".details");
const descriptionDiv = document.querySelector(".description");
const body = document.body;
const header = document.querySelector("header");
const moreButton = document.querySelector(".more-button");
const introOverlay = document.getElementById("intro-overlay");
const introText1 = document.getElementById("intro-text1");
const introText2 = document.getElementById("intro-text2");
const introCard = document.getElementById("intro-card");
const clickTip = document.getElementById("click-tip");
const skipButton = document.getElementById("skip-button");
let introPlayed = false;
const mainMenu = document.querySelector(".main-menu");
const hamburger = document.querySelector(".hamburger");
const menuOverlay = document.getElementById("menu-overlay");
const mobileMenuMediaQuery = window.matchMedia("(max-width: 600px)");

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

function closeMobileMenu() {
  if (!mainMenu || !menuOverlay) {
    return;
  }
  mainMenu.classList.remove("open");
  menuOverlay.classList.add("hidden");
  syncMenuAccessibilityState();
}

const handleMobileMenuChange = () => {
  if (!mainMenu) {
    return;
  }
  if (!mobileMenuMediaQuery.matches) {
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
  mobileMenuMediaQuery.addListener(handleMobileMenuChange);
}

syncMenuAccessibilityState();

const MUSIC_FADE_DURATION = 1200;
const MUSIC_DEFAULT_TARGET_VOLUME = 1;
let currentModalAudio = null;

function cancelAudioFade(audio) {
  if (!audio) {
    return;
  }
  if (typeof audio._fadeFrame === "number") {
    cancelAnimationFrame(audio._fadeFrame);
    audio._fadeFrame = null;
  }
}

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

function resolveMusicVolume(volume) {
  if (typeof volume !== "number" || Number.isNaN(volume)) {
    return MUSIC_DEFAULT_TARGET_VOLUME;
  }
  return Math.max(0, Math.min(1, volume));
}

function playModalMusic(src, targetVolume = MUSIC_DEFAULT_TARGET_VOLUME) {
  if (!src) {
    return;
  }

  const resolvedVolume = resolveMusicVolume(targetVolume);

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
        // Ignore playback errors triggered by browser policies.
      }
    } else {
      fadeAudio(currentModalAudio, resolvedVolume, MUSIC_FADE_DURATION);
    }
    return;
  }

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
          // Playback might fail due to browser restrictions; safely ignore.
        });
    } else {
      fadeAudio(newAudio, resolvedVolume, MUSIC_FADE_DURATION);
    }
  } catch (error) {
    // Ignore synchronous playback errors triggered by browser policies.
  }

  if (previousAudio && previousAudio !== newAudio) {
    fadeAudio(previousAudio, 0, MUSIC_FADE_DURATION, () => {
      previousAudio.pause();
      previousAudio.currentTime = 0;
    });
  }
}
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
const mainContent = document.getElementById("main-content");
const contentSections = document.querySelectorAll(".content-section");
const subtext = document.querySelector(".subtext");
const startButton = document.getElementById("start-journey-button");
const modalOverlay = document.getElementById("journey-modal");
const modalText = document.getElementById("modal-text");
const modalActions = document.getElementById("modal-actions");

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

  if (!shouldScrollUp && !shouldScrollDown) {
    return;
  }

  const targetTop = Math.min(desiredTop, maxScrollTop);

  if (
    typeof modalText.scrollTo === "function" &&
    (behavior === "smooth" || behavior === "auto")
  ) {
    modalText.scrollTo({ top: targetTop, behavior });
  } else {
    modalText.scrollTop = targetTop;
  }
}
const journeyCloseButton = document.getElementById("journey-close-button");
const pricingSection = document.getElementById("pricing");
const displayedSteps = new Set();
let lineInfoDisplayed = false;
let hamburgerWasHidden = hamburger ? hamburger.classList.contains("hidden") : true;

const lineFollowUpDelay = 500;
const lineContactMessageHtml = [
  "電話•LINEで受け付けておりますので、利用しやすいほうをお選びになり、お悩みや質問などお気軽にご相談下さい",
  "0977-21-8695",
  "",
  "※電話は、営業時間内(店休日、施術中は出られない時がございます)",
  "※LINEは友達追加後メッセージをお送り下さい",
  "常時受け付けておりますが、すぐに返信できない場合がございます。ご了承ください",
].join("<br>");

const modalSteps = [
  {
    text: `あなたは、何色になりましたか？<br>どれが良いか悪いかではなく、
      <br>今どんな状態であるのかを<br>感じあえたらと思って<br>選んでもらいました！`,
    buttons: [
      {
        type: "next",
        label: "なぜ感じあうなの？",
        music: "musics/voice.mp4",
        musicVolume: 0.05,
      },
    ],
  },
  {
    typewriterGroups: [
      `「痛みをとってあげたい」この想いで、整体師を続けてきた。
でも、どれだけ一生懸命やっても改善できない人がいる。
原因を見つけようとすればするほどうまくいかず、やればやるほど、自分がどんどん疲弊していった。
そして、ついに、からだが動かなくなり、僕自身が「患者」になった。

何が悪かった？何々のせい？あれこれと頭で考えて、答えを外へ求める。
なんとかしようって頭で考えて抗うほど、複雑になっていくばかり。
僕は、ずっとトンネルの中にいた。
1ヶ月、3ヶ月、半年、時は流れ、整体師を辞めようか考えていた。`,
      `そんな無力な自分にうちのめされていた僕をみて、家族は、そっとしていてくれた。
お客様からも、心配と励ましの声が届いた。
みんな、本当は自身も、不安だったり、辛いはずなのに。
ありがたい。ほんとうにありがたい。
みんなが私の痛みを感じてくれていることを知って、うれしかった。
助けてあげたいと思っていたみんなに、助けてもらっていたことを知って、気づかされた。`,
      `それは、当たり前すぎて忘れていた、感謝の日々。
そうだった。「からだの不調は何かしらのサイン」整体をはじめて、よく言っていた言葉。
患者になって、自分も出来てなかったことを知った。
改めて、からだに耳を傾けてみよう。
「やりたくない、もうむり、休みたい」なんとなくわかっていたけど、無視していたね。

やっとからだをこころで感じられた。
この時、僕は、患者でなくなった。
気づけばわたしのこころが動き出し、からだを動かすのではなく、からだが動きだした。
この体験を活かしていこう。`,
    ],
    typewriterSpeed: 45,
    groupButtonLabel: "次へ",
    finalButtonLabel: "なぜ神経整体なの？",
    finalButtonMusic: "musics/nerve.mp4",
    finalButtonMusicVolume: 0.05,
  },
  {
    typewriterGroups: [
      `いままでしてきたことを、見直してるときに「神経整体」という施術に目が止まった。
「これだ！」と、直観し、体験させてもらうことに。

「？？？」正直、理解できなかったが、からだが感じている。
「やってみよう！」 最初は半信半疑だったが、変化を感じ、喜んでくれる、お客様。`,
      `こちらもびっくりするような事も目の当たりにした。
今までと正反対。押したり揉んだりこちらが狙うんじゃなくて、触れてるか、触れていないか分からないくらいでからだが勝手に動いて教えてくれる、
お互い神経を感じあうことで相乗効果。こんな施術があったなんて。

求めていたものはこれかもしれない。
こちらがなんとかするんじゃなくて、一緒に元にもどしていく施術。

神経整体と一緒に、さらなる可能性を広げていきたい。
あなたは、いまどんな状態ですか？
どうなりたいですか？
一緒に、お手伝いできたら嬉しいです`,
    ],
    typewriterSpeed: 45,
    groupButtonLabel: "次へ",
    finalButtonLabel: "次へ",
  },
  {
    text: "",
    buttons: [
      { type: "link", label: "LINEへ", href: "https://line.me/R/ti/p/@754ryuvm/", target: "_blank" },
      { type: "pricing", label: "料金紹介ページへ" },
    ],
    showButtonsInBubble: true,
  },
];

let currentModalStep = 0;
const typewriterStates = new Map();
const CHUNK_FADE_DURATION = 1000;
const CHUNK_BUTTON_DELAY = 200;
const AUTO_REVEAL_NEXT_BUTTON_DELAY = 5000;

function appendMessage(
  content,
  type = "received",
  stepIndex = currentModalStep,
  options = {}
) {
  if (!modalText) return;
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
}

function appendUserResponse(label) {
  if (!label) return;
  appendMessage(label, "sent", currentModalStep, { autoScroll: false });
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

function resetTypewriterStates() {
  const indices = Array.from(typewriterStates.keys());
  indices.forEach((stepIndex) => {
    clearTypewriterState(stepIndex);
  });
}

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

    if (!isMobileDevice()) {
      nextButton.style.display = "";
      ensureMessageVisible();
      return;
    }

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

    registerTimer(() => {
      if (nextButton.style.display === "none") {
        revealButton();
      }
    }, AUTO_REVEAL_NEXT_BUTTON_DELAY);
  }, CHUNK_FADE_DURATION + CHUNK_BUTTON_DELAY);
}

function renderModalStep(options = {}) {
  if (!modalOverlay || !modalText || !modalActions) return;
  const { delay = 0 } = options;
  const step = modalSteps[currentModalStep];
  const stepIndex = currentModalStep;
  const isFirstRender = !displayedSteps.has(stepIndex);

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

  if (isFirstRender) {
    displayedSteps.add(stepIndex);

    const hasChunks = Array.isArray(step.chunks) && step.chunks.length > 0;

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

  modalActions.innerHTML = "";

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

  // Ensure the modal content is rendered after it becomes visible so the first message
  // appears immediately when the "はじまり" button is clicked.
  requestAnimationFrame(() => {
    renderModalStep();
    modalOverlay.focus();
  });
}

function isMobileDevice() {
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
}

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

if (journeyCloseButton) {
  journeyCloseButton.addEventListener("click", () => {
    closeModal({ restoreFocus: false });
    showTopPage();
  });
}

if (startButton) {
  startButton.addEventListener("click", () => {
    openModal(0);
  });
}

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

function adjustIntroOverlaySize() {
  introOverlay.style.height = `${window.innerHeight}px`;
  introOverlay.style.width = `${window.innerWidth}px`;
}
window.addEventListener("load", adjustIntroOverlaySize);
window.addEventListener("resize", adjustIntroOverlaySize);
adjustIntroOverlaySize();
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

  // 表示後 1 秒で非表示（削除）
  setTimeout(() => {
    container.remove();
  }, 1000);
}

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
  const refImg = document.querySelector(".image-container");
  const cardWidth = refImg ? refImg.offsetWidth : 100;
  const cardHeight = refImg ? refImg.offsetHeight : 100;
  const availableWidth = window.innerWidth - cardWidth;
  const availableHeight = window.innerHeight - footerHeight - cardHeight;

  for (let i = 0; i < 20; i++) {
    const card = document.createElement("img");
    card.src = "images/card.png";
    card.className = "burst-card";
    const left = cardWidth / 2 + availableWidth * (0.4 + Math.random() * 0.2);
    const top = cardHeight / 2 + availableHeight * (0.4 + Math.random() * 0.2);
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

function prepareCards() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  images.forEach((card) => {
    const img = card.querySelector("img");
    img.dataset.front = `images/${img.alt}.jpg`;
    img.src = "images/card.png";
    gsap.set(card, {
      x: (Math.random() - 0.5) * vw,
      y: (Math.random() - 0.5) * vh,
      rotation: Math.random() * 360,
      rotateY: 180,
    });
  });
}

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

function animateCards() {
  gallery.classList.add("centered");
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
    tl.to(circles, { top: "50%", left: "50%", duration: 1 }, ">" );
    tl.to(overlay, { backgroundColor: "#ffffff", duration: 1 }, ">" );
    tl.to(circles, { opacity: 0, duration: 1 }, "<");
    tl.add(() => {
      showTopPage();
    });
    tl.to(overlay, { opacity: 0, duration: 0.5 }, ">" );
  });
}

// Intro sequence with skip-on-click functionality
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

function playIntroStep() {
  if (introStep >= introSequence.length) return;
  const step = introSequence[introStep];
  step.start();
  introTimer = setTimeout(() => {
    introStep++;
    playIntroStep();
  }, step.delay);
}

window.addEventListener("DOMContentLoaded", () => {
  introTimer = setTimeout(playIntroStep, 100);
});

introOverlay.addEventListener("click", (e) => {
  if (e.target === introCard || introStep >= introSequence.length) return;
  clearTimeout(introTimer);
  const step = introSequence[introStep];
  step.finish();
  introStep++;
  playIntroStep();
});

skipButton.addEventListener("click", (e) => {
  e.stopPropagation();
  clearTimeout(introTimer);
  introStep = introSequence.length;
  introOverlay.remove();
  showTopPage();
});

introCard.addEventListener("click", () => {
  if (introPlayed) return;
  introPlayed = true;
  introCard.style.pointerEvents = "none";

  // Hide intro elements to prevent them from showing through the transition
  introOverlay.remove();
  header.style.visibility = "hidden";
  gallery.style.visibility = "hidden";

  prepareCards(); // 3枚のカードなど初期セット
  createBurstCards(); // ← ここで30枚を生成

  Promise.all([scatterCards(), showWhiteOverlay()]).then(() => {
    playCardBurst(() => {
      // ← この段階で30枚を消す
      header.style.visibility = "visible";
      animateCards(); // ← 3枚を整列
      setTimeout(flipCardsToFront, 2000); // ← 表にめくる
    });
  });
});

// Change button text on mobile
if (window.matchMedia("(max-width: 600px)").matches) {
  moreButton.textContent = "詳細へ";
}
let currentImg = null;

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


function showSection(id) {
  contentSections.forEach((sec) => {
    if (sec.id === id) {
      sec.classList.remove("hidden");
    } else {
      sec.classList.add("hidden");
    }
  });
}

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
}

mainMenu.addEventListener("click", (e) => {
  const target = e.target;
  if (target.tagName !== "A") return;
  e.preventDefault();
  closeMobileMenu();
  if (target.id === "choose-images") {
    window.location.href = "index.html";
    return;
  }
  closeModal({ restoreFocus: false });
  const section = target.dataset.section;
  if (section) {
    showSection(section);
  }
});

let detailStage = "initial";
moreButton.addEventListener("click", (e) => {
  if (detailStage === "initial") {
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
    e.preventDefault();
    moreButton.style.pointerEvents = "none";
    playTransitionAnimation();
  }
});
