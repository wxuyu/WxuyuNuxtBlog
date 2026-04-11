export interface aboutConnect {
    author: author[]; //头像数据
    large: string; //标题数据
    myinfo: myinfo[]; //个人介绍数据
    technology: technology[]; //偏好数据
    single: single[]; //历程数据
}

// 头像数据
export interface author {
    left: left[];
    logo: string;
    // box: box[];
    right: right[];
}

export interface left {
    tag1: string;
    tag2: string;
    tag3: string;
    tag4: string;
}

export interface box {
    logo: string;
}

export interface right {
    tag1: string;
    tag2: string;
    tag3: string;
    tag4: string;
}

//个人介绍数据
export interface myinfo {
    title1: string;
    title2: string;
    inlineword1: string;
    title3: string;
    inlineword2: string;
    card: card[];
}

export interface card {
    tips: string;
    conect1: string;
    conect2: string;
    inlineword: string;
    mask: mask[];
}

export interface mask {
    firstTips: string;
    span: string;
    up: string;
    show: string;
}

//左右铭数据
export interface maxim {
    tip: string;
    title1: string;
    title2: string;
}

//偏好数据
export interface technology {
    tip: string;
    title: string;
    bottomTip: string;
}

//游戏数据
export interface game {
    tip: string;
    title: string;
    uid: string;
    image: string;
}

//历程数据
export interface single {
    tip: string;
    title: string;
    lishi: string;
    content: string;
}

export const about: aboutConnect[] = [
    {
        author: [
            {
                left: [{
                    tag1: "💻 Like数码科技",
                    tag2: "🥣 干饭魂 干饭人",
                    tag3: "🕊 咕咕咕咕咕咕~",
                    tag4: "🧱 CV工程师"
                }],
                logo: "https://sourceimage.s3.bitiful.net/myxz.avif",
                right: [{
                    tag1: "吃饭不如碎觉 💤",
                    tag2: "乐观 积极 向上 🤝",
                    tag3: "专攻各种困难 🔨",
                    tag4: "人不狠话超多 💢"
                }]
            }
        ],
        large: "关于本站",
        myinfo: [{
            title1: "你好，很高兴认识你👋",
            title2: "我叫",
            inlineword1: "柒渊",
            title3: "是一名 前端工程师、学生、",
            inlineword2: "博主",
            card: [{
                tips: "追求",
                conect1: "源于",
                conect2: "热爱而去",
                inlineword: "感受",
                mask: [{
                    firstTips: "学习",
                    span: "生活",
                    up: "程序",
                    show: "体验"
                }]
            }]
        }],
        technology: [{
            tip: "关注偏好",
            title: "数码科技",
            bottomTip: "手机、电脑软硬件"
        }],
        single: [{
            tip: "心路历程",
            title: "为何而建站",
            lishi: "『莫言小栈』历史进程",
            content: "『莫言小栈』是综合类型博客，集成文章、说说、友链、留言、装备等栏目。目前魔改内容已经公开，可进行使用需署名。"
        }]
    }
]