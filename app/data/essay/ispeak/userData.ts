import {
  Fragment,
  Transition,
  TransitionGroup,
  computed,
  createApp,
  createBaseVNode,
  createBlock,
  createCommentVNode,
  createElementBlock,
  createTextVNode,
  createVNode,
  defineComponent,
  inject,
  normalizeClass,
  normalizeStyle,
  onMounted,
  openBlock,
  reactive,
  ref,
  renderList,
  toDisplayString,
  toRaw,
  unref,
  vShow,
  withCtx,
  withDirectives,
  type App,
  type ComponentPublicInstance,
  type InjectionKey,
  type PropType
} from "vue";

declare const marked: {
  (input: string): string;
  setOptions: (options: Record<string, unknown>) => void;
  use: (plugin: Record<string, unknown>) => void;
  Renderer: new () => unknown;
};

declare const hljs:
  | {
      highlightAuto: (code: string) => { value: string };
    }
  | undefined;

interface SpeakAuthor {
  avatar: string;
  nickName: string;
}

interface SpeakTag {
  bgColor: string;
  name: string;
}

interface SpeakItem {
  _id: string;
  author: SpeakAuthor;
  content: string;
  createdAt: string | number | Date;
  tag?: SpeakTag | null;
  showComment?: string;
  [key: string]: unknown;
}

interface TagItem {
  [key: string]: unknown;
}

interface SpeakListResponse {
  data: {
    isLogin?: string | null;
    total: number;
    items: SpeakItem[];
  };
}

interface TagListResponse {
  data: {
    data: TagItem[];
  };
}

export interface IspeakOptions {
  api: string;
  author: string;
  pageSize?: number;
  loading_img?: string;
  speakPage?: string;
  commentClass?: string;
  el?: string | Element;
  githubClientId?: string;
  hideComment?: boolean;
  comment?: (speak: SpeakItem) => void;
}

type IspeakMountResult = ComponentPublicInstance | Element | null;
type UserConfig = Required<Omit<IspeakOptions, "el" | "githubClientId" | "hideComment" | "comment">> &
  Pick<IspeakOptions, "el" | "githubClientId" | "hideComment" | "comment">;

const OPTION_KEY: InjectionKey<UserConfig> = Symbol("ispeak-option");

const version = "4.4.0";
const homepage = "https://www.antmoe.com/speak/";

const defaultInitOption: Required<
  Pick<IspeakOptions, "api" | "author" | "pageSize" | "loading_img" | "speakPage" | "commentClass">
> = {
  api: "",
  author: "",
  pageSize: 10,
  loading_img: "https://7.dusays.com/2021/03/04/d2d5e983e2961.gif",
  speakPage: "/speak",
  commentClass: "ispeak-comment"
};

function useUserConfig(): UserConfig {
  const config = inject(OPTION_KEY);
  if (!config) {
    throw new Error("Missing ispeak option provider.");
  }
  return config;
}

function padWithZeros(value: number, width: number): string {
  let result = value.toString();
  while (result.length < width) {
    result = `0${result}`;
  }
  return result;
}

function dateFormat(date: Date): string {
  const day = padWithZeros(date.getDate(), 2);
  const month = padWithZeros(date.getMonth() + 1, 2);
  const year = padWithZeros(date.getFullYear(), 2);
  return `${year}-${month}-${day}`;
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function formatFontColor(color: string): "white" | "black" {
  const hexColorReg = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  const colorRgb = (input: string): string => {
    let normalized = input.toLowerCase();
    if (!hexColorReg.test(normalized)) {
      return normalized;
    }

    if (normalized.length === 4) {
      normalized =
        "#" +
        normalized
          .slice(1)
          .split("")
          .map((char) => char + char)
          .join("");
    }

    const channels: number[] = [];
    for (let index = 1; index < 7; index += 2) {
      channels.push(Number.parseInt(normalized.slice(index, index + 2), 16));
    }

    return `RGB(${channels.join(",")})`;
  };

  const rgb = colorRgb(color).replace("RGB(", "").replace(")", "").split(",");
  const brightness = rgb.reduce((sum, item) => sum + Number.parseInt(item, 10), 0);

  return brightness > 450 ? "black" : "white";
}

function timeAgo(dateInput: string | number | Date): string {
  const date = new Date(dateInput || "");
  if (!isValidDate(date)) {
    return "";
  }

  try {
    const oldTime = date.getTime();
    const currentTime = Date.now();
    const diffValue = currentTime - oldTime;
    const days = Math.floor(diffValue / (24 * 3600 * 1000));

    if (days === 0) {
      const leave1 = diffValue % (24 * 3600 * 1000);
      const hours = Math.floor(leave1 / (3600 * 1000));

      if (hours === 0) {
        const leave2 = leave1 % (3600 * 1000);
        const minutes = Math.floor(leave2 / (60 * 1000));

        if (minutes === 0) {
          const leave3 = leave2 % (60 * 1000);
          const seconds = Math.round(leave3 / 1000);
          return `${seconds} 秒前`;
        }

        return `${minutes} 分前`;
      }

      return `${hours} 小时前`;
    }

    if (days < 0) {
      return "刚刚";
    }

    if (days < 8) {
      return `${days} 天前`;
    }

    return dateFormat(date);
  } catch (error) {
    console.error("timeAgo 错误", error);
    return "";
  }
}

function markedRender(body: string, loadingImg: string): string {
  const renderer = {
    image(href: string, _title: string | null, text: string) {
      return `<a href="${href}" target="_blank" data-fancybox="group" class="fancybox">
           <img speak-src="${href}" src="${loadingImg}" alt="${text}">
          </a>`;
    }
  };

  marked.setOptions({
    renderer: new marked.Renderer(),
    highlight(code: string) {
      return hljs ? hljs.highlightAuto(code).value : code;
    },
    pedantic: false,
    gfm: true,
    tables: true,
    breaks: true,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false
  });

  marked.use({ renderer });
  return marked(body);
}

function lazyloadImage(
  selector = "img[speak-src]:not([loaded])",
  attr = "speak-src"
): void {
  const images = document.querySelectorAll(selector);

  images.forEach((target) => {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!(entry.target instanceof HTMLImageElement) || !entry.isIntersecting) {
          return;
        }

        const src = entry.target.getAttribute(attr) ?? "";
        entry.target.setAttribute("src", src);
        entry.target.setAttribute("loaded", "loaded");
        instance.disconnect();
      });
    });

    observer.observe(target);
  });
}

const BackIcon = defineComponent({
  name: "IspeakBackIcon",
  props: {
    height: { type: Number, default: 25 },
    width: { type: Number, default: 25 }
  },
  setup(props) {
    return () =>
      openBlock(),
      createElementBlock(
        "svg",
        {
          t: "1645239919789",
          class: "icon",
          viewBox: "0 0 1024 1024",
          version: "1.1",
          xmlns: "http://www.w3.org/2000/svg",
          "p-id": "15463",
          width: props.width,
          height: props.height
        },
        [
          createBaseVNode(
            "path",
            {
              d: "M478.104276 337.595469V184.66079L114.48369 442.197642l363.620586 257.597261V548.220967c145.529941 0.060409 280.456525 7.405763 394.534756 210.864063 0.001024-129.244021-21.321388-417.874222-394.534756-421.489561z",
              fill: "#98C4D8",
              "p-id": "15464"
            },
            null,
            -1
          ),
          createBaseVNode(
            "path",
            {
              d: "M447.778841 307.270034V154.334331L84.158254 411.871182 447.778841 669.468444V517.894508c145.529941 0.060409 280.456525 7.405763 394.534756 210.864063 0-129.244021-21.322412-417.874222-394.534756-421.488537z",
              fill: "#EFD9A0",
              "p-id": "15465"
            },
            null,
            -1
          ),
          createBaseVNode(
            "path",
            {
              d: "M283.00269 350.410162a27.283472 57.977507 55.515 1 0 95.578754-65.652623 27.283472 57.977507 55.515 1 0-95.578754 65.652623Z",
              fill: "#FEFEFE",
              "p-id": "15466"
            },
            null,
            -1
          ),
          createBaseVNode(
            "path",
            {
              d: "M224.416795 445.822358a18.189323 31.830547 55.515 1 0 52.474213-36.044304 18.189323 31.830547 55.515 1 0-52.474213 36.044304Z",
              fill: "#FEFEFE",
              "p-id": "15467"
            },
            null,
            -1
          )
        ],
        8,
        ["width", "height"]
      );
  }
});

const BadgeIcon = defineComponent({
  name: "IspeakBadgeIcon",
  props: {
    height: { type: Number, default: 25 },
    width: { type: Number, default: 25 }
  },
  setup(props) {
    return () =>
      openBlock(),
      createElementBlock(
        "svg",
        {
          class: "svg-badge-icon",
          viewBox: "0 0 512 512",
          xmlns: "http://www.w3.org/2000/svg",
          width: props.width,
          height: props.height
        },
        [
          createBaseVNode(
            "path",
            {
              d: "m512 268c0 17.9-4.3 34.5-12.9 49.7s-20.1 27.1-34.6 35.4c.4 2.7.6 6.9.6 12.6 0 27.1-9.1 50.1-27.1 69.1-18.1 19.1-39.9 28.6-65.4 28.6-11.4 0-22.3-2.1-32.6-6.3-8 16.4-19.5 29.6-34.6 39.7-15 10.2-31.5 15.2-49.4 15.2-18.3 0-34.9-4.9-49.7-14.9-14.9-9.9-26.3-23.2-34.3-40-10.3 4.2-21.1 6.3-32.6 6.3-25.5 0-47.4-9.5-65.7-28.6-18.3-19-27.4-42.1-27.4-69.1 0-3 .4-7.2 1.1-12.6-14.5-8.4-26-20.2-34.6-35.4-8.5-15.2-12.8-31.8-12.8-49.7 0-19 4.8-36.5 14.3-52.3s22.3-27.5 38.3-35.1c-4.2-11.4-6.3-22.9-6.3-34.3 0-27 9.1-50.1 27.4-69.1s40.2-28.6 65.7-28.6c11.4 0 22.3 2.1 32.6 6.3 8-16.4 19.5-29.6 34.6-39.7 15-10.1 31.5-15.2 49.4-15.2s34.4 5.1 49.4 15.1c15 10.1 26.6 23.3 34.6 39.7 10.3-4.2 21.1-6.3 32.6-6.3 25.5 0 47.3 9.5 65.4 28.6s27.1 42.1 27.1 69.1c0 12.6-1.9 24-5.7 34.3 16 7.6 28.8 19.3 38.3 35.1 9.5 15.9 14.3 33.4 14.3 52.4zm-266.9 77.1 105.7-158.3c2.7-4.2 3.5-8.8 2.6-13.7-1-4.9-3.5-8.8-7.7-11.4-4.2-2.7-8.8-3.6-13.7-2.9-5 .8-9 3.2-12 7.4l-93.1 140-42.9-42.8c-3.8-3.8-8.2-5.6-13.1-5.4-5 .2-9.3 2-13.1 5.4-3.4 3.4-5.1 7.7-5.1 12.9 0 5.1 1.7 9.4 5.1 12.9l58.9 58.9 2.9 2.3c3.4 2.3 6.9 3.4 10.3 3.4 6.7-.1 11.8-2.9 15.2-8.7z",
              fill: "#1da1f2"
            },
            null,
            -1
          )
        ],
        8,
        ["width", "height"]
      );
  }
});

const CommentIcon = defineComponent({
  name: "IspeakCommentIcon",
  props: {
    height: { type: Number, default: 25 },
    width: { type: Number, default: 25 }
  },
  setup(props) {
    return () =>
      openBlock(),
      createElementBlock(
        "svg",
        {
          t: "1645242166845",
          class: "svg-comment-icon",
          viewBox: "0 0 1024 1024",
          version: "1.1",
          xmlns: "http://www.w3.org/2000/svg",
          "p-id": "4833",
          width: props.width,
          height: props.height
        },
        [
          createBaseVNode(
            "path",
            {
              d: "M572.27 118H97.15C78.92 118 64 132.91 64 151.13v472.04c0 18.22 14.92 33.13 33.15 33.13h95.28c9.3 0 18.16 3.9 24.44 10.75l66.94 100.14c6.57 7.17 17.87 7.17 24.44 0l116.67-100.14a33.162 33.162 0 0 1 24.44-10.75h343.9c18.23 0 33.15-14.91 33.15-33.13V151.13c0-18.22-14.92-33.13-33.15-33.13h-74.58M258.75 440.97c-27.46 0-49.72-22.25-49.72-49.69 0-27.44 22.26-49.69 49.72-49.69s49.72 22.25 49.72 49.69c0 27.45-22.26 49.69-49.72 49.69z m186.46 0c-27.46 0-49.72-22.25-49.72-49.69 0-27.44 22.26-49.69 49.72-49.69 27.46 0 49.72 22.25 49.72 49.69 0 27.45-22.26 49.69-49.72 49.69z m186.46 0c-27.46 0-49.72-22.25-49.72-49.69 0-27.44 22.26-49.69 49.72-49.69 27.46 0 49.72 22.25 49.72 49.69 0 27.45-22.26 49.69-49.72 49.69z",
              fill: "#FFBB88",
              "p-id": "4834"
            },
            null,
            -1
          ),
          createBaseVNode(
            "path",
            {
              d: "M926.85 251.45h-49.72V673.8c0 18.22-14.92 33.13-33.15 33.13H483.51c-9.29 0-18.16 3.9-24.44 10.75l-83.96 72.06h199.52c9.29 0 18.16 3.9 24.44 10.75l116.67 100.14c6.57 7.17 17.87 7.17 24.44 0l66.94-100.14a33.162 33.162 0 0 1 24.44-10.75h95.28c18.23 0 33.15-14.91 33.15-33.13V284.58c0.01-18.22-14.91-33.13-33.14-33.13z",
              fill: "#FF9852",
              "p-id": "4835"
            },
            null,
            -1
          )
        ],
        8,
        ["width", "height"]
      );
  }
});

const CardLoading = defineComponent({
  name: "IspeakCardLoading",
  setup() {
    const userConfig = useUserConfig();

    return () =>
      openBlock(),
      createElementBlock("div", { class: "loading-container" }, [
        createBaseVNode(
          "img",
          {
            src: userConfig.loading_img
          },
          null,
          8,
          ["src"]
        )
      ]);
  }
});

const SpeakCard = defineComponent({
  name: "IspeakSpeakCard",
  props: {
    speak: {
      type: Object as PropType<SpeakItem>,
      required: true
    },
    showBackBtn: {
      type: Boolean,
      default: false
    },
    showComment: {
      type: Boolean,
      default: true
    }
  },
  emits: {
    showComment: (_payload: SpeakItem) => true,
    closeComment: (_payload: SpeakItem) => true
  },
  setup(props, { emit }) {
    const userConfig = useUserConfig();

    const toComment = (): void => {
      emit("showComment", { ...props.speak });
    };

    const hideComment = (): void => {
      emit("closeComment", { ...props.speak });
    };

    onMounted(() => {
      lazyloadImage();
    });

    return () => {
      const speak = props.speak;

      return (
        openBlock(),
        createElementBlock(
          "div",
          {
            class: "speak-body-card",
            id: speak._id
          },
          [
            createBaseVNode("div", { class: "speak-body-card-header" }, [
              createBaseVNode("div", { class: "speak-body-card-name" }, [
                createBaseVNode("div", { class: "avatar" }, [
                  createBaseVNode(
                    "img",
                    {
                      class: "avatar-img",
                      "speak-src": speak.author.avatar,
                      src: userConfig.loading_img,
                      alt: "avatar"
                    },
                    null,
                    8,
                    ["speak-src", "src"]
                  )
                ]),
                createBaseVNode("div", { class: "name" }, toDisplayString(speak.author.nickName), 1),
                createVNode(BadgeIcon, {
                  style: { "margin-left": "10px" },
                  height: 20,
                  width: 20
                }),
                createBaseVNode("div", { class: "speak-body-card-time" }, toDisplayString(timeAgo(speak.createdAt)), 1)
              ]),
              speak.tag
                ? (openBlock(),
                  createElementBlock(
                    "div",
                    {
                      key: 0,
                      style: normalizeStyle({
                        background: speak.tag.bgColor,
                        color: formatFontColor(speak.tag.bgColor)
                      }),
                      class: "speak-body-card-label"
                    },
                    toDisplayString(speak.tag.name),
                    5
                  ))
                : createCommentVNode("", true)
            ]),
            createBaseVNode(
              "div",
              {
                class: "speak-body-card-content",
                innerHTML: markedRender(speak.content, userConfig.loading_img)
              },
              null,
              8,
              ["innerHTML"]
            ),
            createBaseVNode("div", { class: "speak-body-card-footer" }, [
              speak?.showComment === "1" && !userConfig.hideComment && props.showComment
                ? (openBlock(),
                  createElementBlock(
                    "div",
                    {
                      key: 0,
                      onClick: toComment,
                      class: "comments-btn"
                    },
                    [createVNode(CommentIcon), createTextVNode(" 评论 ")],
                    8,
                    ["onClick"]
                  ))
                : createCommentVNode("", true)
            ]),
            props.showBackBtn
              ? (openBlock(),
                createElementBlock("div", { key: 0, class: "speak-body-card-back" }, [
                  createBaseVNode(
                    "div",
                    {
                      class: "back-btn",
                      onClick: hideComment
                    },
                    [createVNode(BackIcon), createTextVNode(" 返回 ")]
                  )
                ]))
              : createCommentVNode("", true)
          ],
          8,
          ["id"]
        )
      );
    };
  }
});

const SpeakComments = defineComponent({
  name: "IspeakSpeakComments",
  props: {
    speak: {
      type: Object as PropType<SpeakItem>,
      required: true
    }
  },
  emits: {
    closeComment: (_payload: SpeakItem) => true
  },
  setup(props, { emit }) {
    const userConfig = useUserConfig();

    onMounted(() => {
      setTimeout(() => {
        if (!userConfig.comment) {
          return;
        }

        const speakData = toRaw(props.speak);
        Object.keys(speakData).forEach((key) => {
          const value = speakData[key];
          if (typeof value === "object" && value !== null) {
            speakData[key] = toRaw(value);
          }
        });

        userConfig.comment(toRaw(props.speak));
      });
    });

    const hideCommentHandler = (data: SpeakItem): void => {
      emit("closeComment", data);
    };

    return () =>
      openBlock(),
      createElementBlock("div", { class: "speak-comments" }, [
        createVNode(
          SpeakCard,
          {
            speak: props.speak,
            "show-back-btn": true,
            "show-comment": false,
            onCloseComment: hideCommentHandler
          },
          null,
          8,
          ["speak"]
        ),
        createBaseVNode(
          "div",
          {
            class: normalizeClass(userConfig.commentClass)
          },
          null,
          2
        )
      ]);
  }
});

const SpeakBody = defineComponent({
  name: "IspeakSpeakBody",
  props: {
    speakList: {
      type: Array as PropType<SpeakItem[]>,
      required: true
    },
    message: {
      type: String,
      default: ""
    },
    btnClickFlag: {
      type: Boolean,
      default: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: {
    nextSpeak: () => true
  },
  setup(props, { emit }) {
    const speak = ref<SpeakItem | null>(null);

    const showCommentHandler = (data: SpeakItem): void => {
      speak.value = data;
    };

    const hideCommentHandler = (data: SpeakItem): void => {
      speak.value = null;
      setTimeout(() => {
        document
          .getElementById(data._id)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    };

    const getSpeakData = (): void => {
      emit("nextSpeak");
    };

    onMounted(() => {
      lazyloadImage();
    });

    return () =>
      openBlock(),
      createElementBlock("div", { class: "speak-body" }, [
        speak.value !== null
          ? (openBlock(),
            createBlock(
              Transition,
              {
                key: 0,
                name: "fade"
              },
              {
                default: withCtx(() => [
                  createVNode(
                    SpeakComments,
                    {
                      speak: speak.value as SpeakItem,
                      onCloseComment: hideCommentHandler
                    },
                    null,
                    8,
                    ["speak"]
                  )
                ]),
                _: 1
              }
            ))
          : (openBlock(),
            createElementBlock("div", { key: 1, class: "speak-content" }, [
              createVNode(
                TransitionGroup,
                { name: "fade" },
                {
                  default: withCtx(() => [
                    openBlock(
                      true
                    ),
                    createElementBlock(
                      Fragment,
                      null,
                      renderList(props.speakList, (item) =>
                        openBlock(),
                        createBlock(
                          SpeakCard,
                          {
                            key: item._id,
                            speak: item,
                            onShowComment: showCommentHandler
                          },
                          null,
                          8,
                          ["speak"]
                        )
                      ),
                      128
                    )
                  ]),
                  _: 1
                }
              ),
              withDirectives(createVNode(CardLoading, null, null, 512), [[vShow, props.loading]]),
              createBaseVNode("div", { class: "controller" }, [
                createTextVNode(`${toDisplayString(props.message)} `, 1),
                props.btnClickFlag && !props.loading
                  ? (openBlock(),
                    createElementBlock(
                      "button",
                      {
                        key: 0,
                        class: "next-btn",
                        onClick: getSpeakData
                      },
                      " 下一页 "
                    ))
                  : createCommentVNode("", true)
              ])
            ]))
      ]);
  }
});

const LoginPanel = defineComponent({
  name: "IspeakLoginPanel",
  props: {
    visitorId: {
      type: String as PropType<string | null>,
      default: null
    }
  },
  setup(props) {
    const userConfig = useUserConfig();

    function goToLogin(): void {
      const currentHref = decodeURIComponent(window.location.href);
      window.location.href =
        `https://github.com/login/oauth/authorize?client_id=${userConfig.githubClientId}&type=github&redirect_uri=` +
        currentHref;
    }

    function logout(): void {
      window.localStorage.removeItem("ispeak-token");
      window.location.href = userConfig.speakPage || "/speak";
    }

    return () =>
      props.visitorId
        ? (openBlock(),
          createElementBlock("div", { key: 0 }, [
            createTextVNode(
              ` 欢迎您，${toDisplayString(props.visitorId === userConfig.author ? "博主" : "GitHub用户")} `,
              1
            ),
            createBaseVNode(
              "a",
              {
                onClick: logout,
                class: "logoutBtn"
              },
              "退出"
            )
          ]))
        : (openBlock(),
          createElementBlock("div", { key: 1 }, [
            createBaseVNode(
              "a",
              {
                class: "login",
                onClick: goToLogin
              },
              "Github授权"
            )
          ]));
  }
});

const SpeakFooter = defineComponent({
  name: "IspeakSpeakFooter",
  props: {
    visitorId: {
      type: String as PropType<string | null>,
      default: null
    }
  },
  setup(props) {
    const userConfig = useUserConfig();

    function getQueryString(name: string): string | null {
      const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
      const matched = decodeURIComponent(window.location.search).substring(1).match(reg);
      return matched?.[2] ? decodeURIComponent(matched[2]) : null;
    }

    onMounted(async () => {
      const code = getQueryString("code");
      if (!code) {
        return;
      }

      const response = await fetch(`${userConfig.api}api/user/oauth/github?code=${code}`);
      const result = (await response.json()) as { data?: { token?: string } };

      if (result.data?.token) {
        window.localStorage.setItem("ispeak-token", result.data.token);
      }

      location.href = userConfig.speakPage || "/speak";
    });

    return () =>
      openBlock(),
      createElementBlock("div", { class: "speak-footer" }, [
        createTextVNode(" Powered by "),
        createBaseVNode(
          "a",
          {
            href: homepage,
            target: "_blank"
          },
          "iSpeak",
          8,
          ["href"]
        ),
        createTextVNode(` v${toDisplayString(version)} `, 1),
        userConfig.githubClientId
          ? (openBlock(),
            createBlock(
              LoginPanel,
              {
                key: 0,
                visitorId: props.visitorId
              },
              null,
              8,
              ["visitorId"]
            ))
          : createCommentVNode("", true)
      ]);
  }
});

const IspeakApp = defineComponent({
  name: "IspeakApp",
  setup() {
    const userConfig = useUserConfig();
    const loading = ref(false);
    const btnClickFlag = ref(true);
    const queryParams = reactive({
      author: userConfig.author,
      page: 1,
      pageSize: userConfig.pageSize
    });
    const tagList = ref<TagItem[]>([]);
    const speakList = ref<SpeakItem[]>([]);
    const speakTotal = ref(0);
    const message = ref("");
    const visitorId = ref<string | null>(null);

    const requestHeaders = computed<Record<string, string>>(() => {
      const jwtToken = window.localStorage.getItem("ispeak-token");
      return {
        Authorization: jwtToken ? `Bearer ${jwtToken}` : ""
      };
    });

    const getSpeakData = async (): Promise<void> => {
      const url = userConfig.api;

      try {
        loading.value = true;

        const response = await fetch(
          `${url}api/ispeak?author=${queryParams.author}&page=${queryParams.page}&pageSize=${queryParams.pageSize}`,
          {
            headers: requestHeaders.value
          }
        );

        const result = (await response.json()) as SpeakListResponse;
        loading.value = false;

        if (result.data.isLogin) {
          visitorId.value = result.data.isLogin;
        }

        speakTotal.value = result.data.total;
        queryParams.page += 1;
        speakList.value.push(...result.data.items);

        if (speakList.value.length >= speakTotal.value) {
          message.value = "已经到没有更多了！";
          btnClickFlag.value = false;
        }

        const tagResponse = await fetch(`${url}api/ispeak/tag/list?userId=${queryParams.author}`);
        const tagResult = (await tagResponse.json()) as TagListResponse;
        tagList.value = tagResult.data.data;
      } catch (error) {
        loading.value = false;
        btnClickFlag.value = false;
        message.value = error instanceof Error ? error.message : String(error);
      }
    };

    onMounted(async () => {
      await getSpeakData();
    });

    return () =>
      openBlock(),
      createElementBlock("div", { class: "xk-speak-container", id: "xk-speak-container" }, [
        createVNode(
          SpeakBody,
          {
            speakList: speakList.value,
            onNextSpeak: getSpeakData,
            "btn-click-flag": btnClickFlag.value,
            loading: loading.value,
            message: message.value
          },
          null,
          8,
          ["speakList", "btn-click-flag", "loading", "message"]
        ),
        createVNode(SpeakFooter, { visitorId: visitorId.value }, null, 8, ["visitorId"])
      ]);
  }
});

export function render(options: UserConfig): IspeakMountResult {
  const app = createApp(IspeakApp);
  app.provide(OPTION_KEY, options);
  const mountTarget = options.el || "#ispeak";
  return app.mount(mountTarget as string | Element) as IspeakMountResult;
}

export async function init(options: IspeakOptions): Promise<IspeakMountResult> {
  const mergedOptions: UserConfig = {
    ...defaultInitOption,
    ...options
  };
  return render(mergedOptions);
}

export default init;