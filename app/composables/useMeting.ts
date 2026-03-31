// 正则表达式匹配规则
const PLATFORM_PATTERNS: [RegExp, string, string][] = [
    [/music\.163\.com.*song.*id=(\d+)/, 'netease', 'song'],
    [/music\.163\.com.*album.*id=(\d+)/, 'netease', 'album'],
    // 其他平台规则...
];

export class Meting extends HTMLElement {
    private config: any = {};
    private aplayer: APlayer | null = null;

    connectedCallback() {
        if (window.APlayer && window.fetch) {
            this._init();
            this._parse();
        }
    }

    disconnectedCallback() {
        this.aplayer?.destroy();
    }

    private _init() {
        const attrs = Array.from(this.attributes);
        attrs.forEach(attr => {
            const key = this._camelize(attr.name);
            this.config[key] = attr.value;
        });

        this.config.meta = {
            server: this.config.api || window.meting_api || "https://api.i-meto.com/meting/api",
            ...this.config
        };

        if (this.config.auto) {
            this._parseLink();
        }
    }

    private _parseLink() {
        for (const [pattern, server, type] of PLATFORM_PATTERNS) {
            const match = this.config.auto.match(pattern);
            if (match) {
                this.config.meta.server = server;
                this.config.meta.type = type;
                this.config.meta.id = match[1];
                break;
            }
        }
    }

    private _parse() {
        if (this.config.meta.url) {
            const audioItem: IAudioItem = {
                name: this.config.meta.title || "Audio name",
                artist: this.config.meta.author || "Audio artist",
                url: this.config.meta.url,
                cover: this.config.meta.cover || this.config.meta.pic,
                lrc: this.config.meta.lyric || ""
            };
            
            this._createPlayer(audioItem);
        }
    }

    private _createPlayer(audio: IAudioItem) {
        this.aplayer = new APlayer({
            container: this,
            audio: [audio],
            autoplay: this.config.auto === 'true'
        });
    }

    private _camelize(str: string): string {
        return str.replace(/^[_.\- ]+/, '')
                 .toLowerCase()
                 .replace(/[_.\- ]+(\w|$)/g, (_, c) => c.toUpperCase());
    }
}

// 注册自定义元素
customElements.define('m-player', Meting);