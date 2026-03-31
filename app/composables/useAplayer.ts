// 接口定义
interface IAPlayerOptions {
    container: string | HTMLElement;
    fixed?: boolean;
    autoplay?: boolean;
    mutex?: boolean;
    lrcType?: number;
    preload?: string;
    theme?: string;
    loop?: 'all' | 'one' | 'none';
    order?: 'list' | 'random';
    volume?: number;
    listFolded?: boolean;
    listMaxHeight?: string;
    audio: IAudioItem[];
    storageName?: string;
}

interface IAudioItem {
    name?: string;
    artist?: string;
    cover?: string;
    theme?: string;
    type?: string;
    url: string;
}

// 事件系统
class Events {
    private listeners: { [key: string]: Function[] } = {};

    on(event: string, callback: Function) {
        (this.listeners[event] || (this.listeners[event] = [])).push(callback);
    }

    trigger(event: string, data?: any) {
        (this.listeners[event] || []).forEach(cb => cb(data));
    }
}

// 存储管理
class Storage {
    private storageName: string;

    constructor(storageName: string) {
        this.storageName = storageName;
    }

    get(key: string): string | null {
        return localStorage.getItem(`${this.storageName}_${key}`);
    }

    set(key: string, value: string) {
        localStorage.setItem(`${this.storageName}_${key}`, value);
    }
}

// 模板渲染
class Template {
    private options: IAPlayerOptions;

    constructor(options: IAPlayerOptions) {
        this.options = options;
    }

    render(): string {
        // 实现完整的模板渲染逻辑（此处为简化版）
        return `
            <div class="aplayer">
                <!-- 完整模板内容参考原JS实现 -->
            </div>
        `;
    }
}

// 核心播放器类
export class APlayer {
    private options: IAPlayerOptions;
    private audioElement: HTMLAudioElement;
    private container: HTMLElement;
    private events: Events;
    private template: Template;
    private storage: Storage;
    private currentIndex: number = 0;

    constructor(options: IAPlayerOptions) {
        this.options = {
            ...{
                fixed: false,
                autoplay: false,
                mutex: true,
                lrcType: 0,
                preload: 'auto',
                theme: '#b7daff',
                loop: 'all',
                order: 'list',
                volume: 0.7,
                listFolded: false,
                listMaxHeight: '250px',
                storageName: 'aplayer-setting'
            },
            ...options
        };

        this.container = this.createContainer();
        this.audioElement = this.createAudioElement();
        this.events = new Events();
        this.template = new Template(this.options);
        this.storage = new Storage(this.options.storageName);

        this.init();
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'aplayer';
        container.innerHTML = this.template.render();
        document.body.appendChild(container);
        return container;
    }

    private createAudioElement(): HTMLAudioElement {
        const audio = document.createElement('audio');
        audio.preload = this.options.preload;
        audio.volume = parseFloat(this.storage.get('volume') || String(this.options.volume));
        return audio;
    }

    private init(): void {
        this.bindEvents();
        this.loadAudio(this.currentIndex);
    }

    private bindEvents(): void {
        this.container.querySelector('.aplayer-play')?.addEventListener('click', () => this.togglePlay());
        this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.audioElement.addEventListener('ended', () => this.handleEnded());
    }

    private loadAudio(index: number): void {
        const audioItem = this.options.audio[index];
        this.audioElement.src = audioItem.url;
        this.audioElement.load();
    }

    private togglePlay(): void {
        this.audioElement.paused ? this.audioElement.play() : this.audioElement.pause();
    }

    private updateProgress(): void {
        const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
        this.container.querySelector('.aplayer-played')?.style.width = `${progress}%`;
    }

    private handleEnded(): void {
        if (this.options.loop === 'all') {
            this.next();
        } else if (this.options.loop === 'one') {
            this.audioElement.currentTime = 0;
            this.audioElement.play();
        }
    }

    private next(): void {
        this.currentIndex = (this.currentIndex + 1) % this.options.audio.length;
        this.loadAudio(this.currentIndex);
        this.play();
    }
}