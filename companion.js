// Companion logic is independent of rendering and never scans other chat files.
export const SCENES = Object.freeze({
    greeting: { label: '见面问候', lines: ['{时段}好，宝宝，猫猫来陪你啦～'] },
    typing: { label: '正在打字', lines: ['我在看你写～'] },
    listening: { label: '听你说话', lines: ['嗯嗯，我在听'] },
    thinking: { label: '等待回信', lines: ['让我想想…', '陪宝宝一起等回信～'] },
    reply: { label: '收到回信', lines: ['回信来啦！'] },
    chat: { label: '切换聊天', lines: ['我也跟过来啦！'] },
    petting: { label: '摸摸', lines: ['呼噜呼噜～'] },
    nuzzling: { label: '蹭蹭', lines: ['蹭蹭你，再蹭一下～'] },
    idle: { label: '安静陪伴', lines: ['趴一会儿陪你～'] },
    sleeping: { label: '困嘟嘟', lines: ['困嘟嘟…'] },
    confused: { label: '迷糊', lines: ['欸？'] },
    report: { label: '长按播报', lines: ['现在是{时间}，宝宝今天已经和{今日卡数}张卡聊了{今日层数}层啦。当前聊天有{当前楼层}条角色回复，猫猫陪着呢。'] },
});

export function localDay(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function timePeriod(date = new Date()) {
    const hour = date.getHours();
    return hour < 5 ? '夜里' : hour < 9 ? '早上' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : '晚上';
}

export function sceneLines(custom, scene) {
    const lines = typeof custom?.[scene] === 'string'
        ? custom[scene].split('\n').map(x => x.trim().slice(0, 240)).filter(Boolean).slice(0, 30) : [];
    return lines.length ? lines : SCENES[scene]?.lines ?? ['陪着你呀'];
}

export function renderLine(custom, scene, values, random = Math.random) {
    const lines = sceneLines(custom, scene);
    return lines[Math.min(lines.length - 1, Math.floor(random() * lines.length))]
        .replace(/\{(时间|时段|角色名|今日卡数|今日层数|当前楼层)\}/g, (match, key) => String(values[key] ?? match));
}

const isReply = message => message && !message.is_user && !message.is_system;
const excludedTypes = new Set(['quiet', 'impersonate', 'regenerate', 'swipe', 'continue']);

export function chatIdentity(ctx) {
    const card = ctx.characters?.[ctx.characterId];
    const owner = ctx.groupId != null ? `group:${ctx.groupId}` : card?.avatar ? `card:${card.avatar}` : '';
    const id = ctx.getCurrentChatId?.() ?? ctx.chatId;
    return owner && id != null && id !== '' ? JSON.stringify([owner, String(id)]) : null;
}

export class Companion {
    constructor(settings, getContext, save, clock = () => new Date()) {
        this.settings = settings;
        this.getContext = getContext;
        this.save = save;
        this.clock = clock;
        this.baseline();
    }
    day() {
        const date = localDay(this.clock());
        let data = this.settings.companionDay;
        if (!data || data.date !== date || !Array.isArray(data.cards) || !Array.isArray(data.replies)) {
            data = this.settings.companionDay = { date, cards: [], replies: [] };
            this.save();
        }
        return data;
    }
    baseline() {
        const ctx = this.getContext();
        this.chatKey = chatIdentity(ctx);
        this.length = ctx.chat?.length ?? 0;
        this.generation = null;
    }
    start(type, dryRun) {
        if (dryRun || type === 'quiet') return;
        this.baseline();
        this.generation = { type: String(type ?? ''), chatKey: this.chatKey };
    }
    receive(id, type) {
        const ctx = this.getContext();
        const key = chatIdentity(ctx);
        const message = ctx.chat?.[id];
        const generation = this.generation;
        // Only a real generation observed in this chat can contribute. Reading,
        // importing, re-rendering or opening history cannot count as today's play.
        if (!generation || !key || (generation.chatKey && generation.chatKey !== key)
            || !Number.isInteger(id) || id < this.length || !isReply(message)
            || !String(message.mes ?? '').trim() || excludedTypes.has(type)
            || excludedTypes.has(generation.type) || Number(message.swipe_id ?? 0) > 0) return false;
        this.length = Math.max(this.length, ctx.chat.length);
        const day = this.day();
        const token = JSON.stringify([key, id, message.send_date ?? '']);
        if (day.replies.includes(token)) return false;
        const avatar = message.original_avatar || ctx.characters?.[ctx.characterId]?.avatar;
        const card = avatar ? `card:${avatar}` : `group:${ctx.groupId}:${message.name ?? '角色'}`;
        day.replies.push(token);
        if (!day.cards.includes(card)) day.cards.push(card);
        this.save();
        return true;
    }
    values() {
        const ctx = this.getContext();
        const date = this.clock();
        const day = this.day();
        return {
            时间: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
            时段: timePeriod(date),
            角色名: ctx.characters?.[ctx.characterId]?.name ?? ctx.name2 ?? '宝宝',
            今日卡数: day.cards.length,
            今日层数: day.replies.length,
            当前楼层: (ctx.chat ?? []).filter(isReply).length,
        };
    }
    say(scene) {
        return renderLine(this.settings.customBubbles, scene, this.values());
    }
}
