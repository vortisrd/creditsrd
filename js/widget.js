const title        					= getURLParam("title", "Thank you for watching!");
const summary      					= getURLParam("summary", "See you next time. 😁");
const showAvatar   					= getURLParam("showAvatar", true);
const platform     					= getURLParam("platform", "twitch");
const color        					= getURLParam("color", "#FFFFFF");
const font         					= getURLParam("font", "DM Sans");
const size         					= getURLParam("size", 1);
const speed        					= getURLParam("speed", 1);
const limitParam   					= Number(getURLParam("limit", 15));
const limit        					= Number.isFinite(limitParam) && limitParam >= 0 ? Math.floor(limitParam) : 15;
const ignoreChatters                = getURLParam("ignoreChatters", "Streamlabs,Streamelements");
const ignoreUserList                = ignoreChatters.split(',').map(item => item.trim().toLowerCase()) || [];

const widgetBody = document.body;
const container = document.querySelector('#credits');
const titleElement = container.querySelector('header h1');
const summaryElement = container.querySelector('header p');

widgetBody.style.fontFamily = font;
widgetBody.style.color = color;
container.style.zoom = size;
titleElement.textContent = title;
summaryElement.textContent = summary;

function setSpeed() {
	const safeSpeed = Number(speed) > 0 ? Number(speed) : 1;
	const trueSpeed = Math.round((45 / safeSpeed) * 100) / 100;
	container.style.setProperty("--true-speed", `${trueSpeed}s`);
}

function randomIntBetween(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function creditsRdReset(source) {
	const platformName = source.charAt(0).toUpperCase() + source.slice(1);
	if (source === platform) {
		console.debug(`[CreditsRD][${platformName} Stream Start] Cleaning database and starting a new session...`);
		initCredits(true);
	}
}

const DEFAULT_AVATAR = "images/youtube-default-user-pfp.jpg";

const PLATFORMS = [
	{ id: "twitch",  label: "Twitch"  },
	{ id: "youtube", label: "YouTube" },
	{ id: "kick",    label: "Kick"    },
	{ id: "tiktok",  label: "TikTok"  },
];

const giftCount = (e) => (e.data.amount ?? 1) * (e.data.months ?? 1);

const SECTIONS = [
	{
		types: ["chat"],
		maxVisible: limit,
		labelKey: "chatters",
		summaryKey: "chattersSummary",
		unique: true,
		uncounted: true
	},
	{
		types: ["follow"],
		maxVisible: limit,
		labelKey: "followers",
		summaryKey: "followersSummary"
	},
	{
		types: ["raid", "host"],
		maxVisible: limit,
		labelKey: "raids",
		summaryKey: "raidsSummary",
		value: (e) => e.data.viewers,
		format: (total) => tRD("viewers", { count: total.toLocaleString("en-US") })
	},
	{
		types: ["giftSub"],
		maxVisible: limit,
		labelKey: "giftedSubs",
		summaryKey: "giftedSubsSummary",
		value: giftCount,
		format: (_, evs) => {
			const direct = evs.filter((e) => e.data.recipient);
			const bombs  = evs.filter((e) => !e.data.recipient);

			const parts = [];

			if (bombs.length) parts.push(`x${sum(bombs, giftCount)}`);

			const MAX_NAMES = 3;
			const names = direct.slice(0, MAX_NAMES).map((e) => {
				const { recipient, months } = e.data;
				return months > 1
					? `${recipient} (${tRD("months", { count: months })})`
					: recipient;
			});
			if (direct.length > MAX_NAMES) names.push(`+${direct.length - MAX_NAMES}`);
			if (names.length) parts.push(`→ ${names.join(", ")}`);

			return parts.join(" · ");
		}
	},
	{
		types: ["sub"],
		maxVisible: limit,
		labelKey: "subs",
		summaryKey: "subsSummary",
		format: (_, evs) => {
			const { tier, level } = evs[0].data;
			return tier ? tRD("tier", { tier }) : level ? `${level}` : "";
		}
	},
	{
		types: ["superFan"],
		maxVisible: limit,
		labelKey: "superFans",
		summaryKey: "superFansSummary",
		format: (_, evs) => {
			const { tier, level } = evs[0].data;
			return tier ? tRD("tier", { tier }) : level ? `${level}` : "";
		}
	},
	{
		types: ["resub"],
		maxVisible: limit,
		labelKey: "reSubs",
		summaryKey: "reSubsSummary",
		format: (_, evs) => {
			const months = Math.max(...evs.map((e) => e.data.months ?? 0));
			const tier = evs[0].data.tier;
			return tier ? `x${months} [${tRD("tier", { tier })}]` : `x${months}`;
		}
	},
	{
		types: ["bits"],
		maxVisible: limit,
		labelKey: "bits",
		summaryKey: "bitsSummary",
		value: (e) => e.data.amount,
		format: (total) => total.toLocaleString("en-US")
	},
	{
		types: ["kicks"],
		maxVisible: limit,
		labelKey: "kicks",
		summaryKey: "kicksSummary",
		value: (e) => e.data.amount,
		format: (total) => total.toLocaleString("en-US")
	},
	{
		types: ["superChat"],
		maxVisible: limit,
		labelKey: "superChats",
		summaryKey: "superChatsSummary",
		summaryCount: true,
		format: (_, evs) => {
			const byCurrency = new Map();
			for (const e of evs) {
				const { amount, currency } = e.data;
				byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + amount);
			}
			return [...byCurrency]
				.map(([currency, total]) => formatMoney(total, currency))
				.join(" + ");
		}
	},
	{
		types: ["superSticker"],
		labelKey: "superStickers",
		maxVisible: limit,
		summaryKey: "superStickersSummary",
		summaryCount: true,
		format: (_, evs) => {
			const byCurrency = new Map();
			for (const e of evs) {
				const { amount, currency } = e.data;
				byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + amount);
			}
			return [...byCurrency]
				.map(([currency, total]) => formatMoney(total, currency))
				.join(" + ");
		}
	},
	{
		types: ["membership"],
		labelKey: "memberships",
		maxVisible: limit,
		summaryKey: "membershipsSummary",
		format: (_, evs) => {
			const { tier, level } = evs[0].data;
			return tier ? tRD("tier", { tier }) : level ? `${level}` : "";
		}
	},
	{
		types: ["giftMembership"],
		maxVisible: limit,
		labelKey: "giftedMemberships",
		summaryKey: "giftedMembershipsSummary",
		value: (e) => e.data.amount ?? 1,
		format: (total) => `x${total}`
	},
	{
		types: ["jewel"],
		labelKey: "jewels",
		maxVisible: limit,
		summaryKey: "jewelsSummary",
		value: (e) => e.data.amount ?? 1,
		format: (total) => `${total}`
	},
	{
		types: ["likes"],
		labelKey: "likes",
		maxVisible: limit,
		summaryKey: "likesSummary",
		accumulate: true,
		value: (e) => e.data.amount,
		format: (total) => total.toLocaleString("en-US")
	},
	{
		types: ["share"],
		maxVisible: limit,
		labelKey: "shares",
		summaryKey: "sharesSummary",
		accumulate: true,
		value: (e) => e.data.amount,
		format: (total) => total.toLocaleString("en-US")
	},
	{
		types: ["tiktokGift"],
		maxVisible: limit,
		labelKey: "tiktokGifts",
		summaryKey: "tiktokGiftsSummary",
		accumulate: ["coins", "amount"],
		groupKey: (e) => e.data.giftName ?? "",
		value: (e) => e.data.coins ?? 0,
		format: (total, evs) => {
			const { giftImage, giftName } = evs[evs.length - 1].data;
			const parts = [`x${sum(evs, (e) => e.data.amount)} `];

			if (giftImage) {
				const img = el("img", "gift-img");
				img.alt = giftName ?? "";
				img.onerror = () => img.remove();
				img.src = giftImage;
				parts.push(img, " ");
			}

			parts.push(`[${total.toLocaleString("en-US")}🪙]`);
			return parts;
		}
	},
	{
		types: ["reward"],
		maxVisible: limit,
		labelKey: "channelPoints",
		summaryText: (entries) => {
			const people = new Set(entries.map((e) => e.user.id)).size;
			const points = sum(entries, (entry) => sum(entry.events, (e) => e.data.cost));
			return `${tPlural("peopleRedeemed", people)}, ${tPlural("pointsSpent", points)}`;
		},
		subGroup: (e) => e.data.rewardName ?? "Reward",
		value: () => 1,
		format: (total) => `x${total}`
	}
];

const KNOWN_TYPES = new Set(SECTIONS.flatMap((s) => s.types));
const ACCUMULATE_FIELDS = new Map(
	SECTIONS
		.filter((s) => s.accumulate)
		.flatMap((s) => s.types.map((t) => [t, s.accumulate === true ? ["amount"] : s.accumulate]))
);

const UNIQUE_TYPES = new Set(SECTIONS.filter((s) => s.unique).flatMap((s) => s.types));
const UNCOUNTED_TYPES = new Set(SECTIONS.filter((s) => s.uncounted).flatMap((s) => s.types));

function el(tag, className, text) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text != null) node.textContent = text;
	return node;
}

function groupBy(list, keyFn) {
	const map = new Map();
	for (const item of list) {
		const key = keyFn(item);
		if (!map.has(key)) map.set(key, []);
		map.get(key).push(item);
	}
	return map;
}

const sum = (list, fn) => list.reduce((acc, item) => acc + (fn(item) ?? 0), 0);

function tPlural(key, count, vars) {
	const rule = new Intl.PluralRules(lang).select(count);
	const full = `${key}_${rule}`;
	const k = jsonLang[full] ? full : `${key}_other`;
	return tRD(k, { count: count.toLocaleString("en-US"), ...vars });
}

function formatMoney(amount, currency) {
	try {
		return new Intl.NumberFormat(lang, { style: "currency", currency }).format(amount);
	} catch {
		return `${currency ?? ""} ${amount}`.trim();
	}
}

function buildEntries(section, platformEvents) {
	const wanted = platformEvents.filter((e) => section.types.includes(e.type));

	// subGroup also splits entries per user, like groupKey does
	const groupKey = section.subGroup ?? section.groupKey;

	const byUser = groupBy(wanted, (e) =>
		groupKey ? `${e.user.id}|${groupKey(e)}` : e.user.id
	);

	const entries = [...byUser.values()].map((evs) => {
		const total = section.value ? sum(evs, section.value) : 0;
		return {
			user: evs[0].user,
			total,
			count: evs.length,
			firstTs: evs[0].ts,
			subGroup: section.subGroup?.(evs[0]),
			events: evs,
			detail: section.format ? section.format(total, evs) : "",
		};
	});

	if (section.groupKey) {
		const userTotal = new Map();
		for (const e of entries) {
			userTotal.set(e.user.id, (userTotal.get(e.user.id) ?? 0) + e.total);
		}
		entries.sort((a, b) =>
			userTotal.get(b.user.id) - userTotal.get(a.user.id) ||
			String(a.user.id).localeCompare(String(b.user.id)) ||
			b.total - a.total
		);
	} else {
		entries.sort(section.value ? (a, b) => b.total - a.total : (a, b) => a.firstTs - b.firstTs);
	}
	return entries;
}

function buildPill(user, detail) {
	const pill = el("span", "pill");

	if (showAvatar) {
		const avatar = el("img", "avatar");
		avatar.alt = "";
		avatar.onerror = () => {
			avatar.onerror = null;
			avatar.src = DEFAULT_AVATAR;
		};
		avatar.src = user.avatar || DEFAULT_AVATAR;
		pill.append(avatar);
	}

	pill.append(user.name);

	const chips = Array.isArray(detail) && detail.length && detail.every(Array.isArray)
		? detail
		: [detail];

	for (const chip of chips) {
		const parts = [].concat(chip).filter(Boolean);
		if (!parts.length) continue;
		const em = el("em");
		em.append(...parts);
		pill.append(em);
	}
	return pill;
}

function appendPills(parent, section, entries) {
	const visible = section.maxVisible ? entries.slice(0, section.maxVisible) : entries;
	for (const entry of visible) parent.append(buildPill(entry.user, entry.detail));

	const hidden = entries.length - visible.length;
	if (hidden > 0) parent.append(el("span", "pill more", tRD("andMore", { count: hidden })));
}

function buildRow(section, entries) {
	const row = el("div", "row");
	const label = el("div", "event", tRD(section.labelKey));

	if (section.summaryText) {
		label.append(el("small", null, section.summaryText(entries)));
	} else if (section.summaryKey) {
		const total = section.summaryCount
			? sum(entries, (e) => e.count)
			: section.value
				? sum(entries, (e) => e.total)
				: entries.length;

		label.append(el("small", null, tPlural(section.summaryKey, total)));
	}

	row.append(label);

	const users = el("div", section.subGroup ? "users has-subgroups" : "users");

	if (section.subGroup) {
		// Most redeemed sub-category first
		const groups = [...groupBy(entries, (e) => e.subGroup)]
			.sort((a, b) => sum(b[1], (e) => e.total) - sum(a[1], (e) => e.total));

		for (const [groupTitle, groupEntries] of groups) {
			const group = el("div", "subgroup");
			const pills = el("div", "subgroup-pills");
			appendPills(pills, section, groupEntries);
			group.append(el("div", "subgroup-title", groupTitle), pills);
			users.append(group);
		}
	} else {
		appendPills(users, section, entries);
	}

	row.append(users);
	return row;
}

function buildPlatform(platform, platformEvents) {
	const block = el("section", "platform");
	block.id = platform.id;

	const header = el("div", "header");
	const logo = el("img", "logo");
	logo.src = `js/modules/${platform.id}/images/logo-${platform.id}.svg`;
	logo.alt = "";
	
	const counted = platformEvents.filter((e) => !UNCOUNTED_TYPES.has(e.type)).length;

	header.append(
		logo,
		el("h2", null, platform.label),
		el("small", null, tPlural("eventsCount", counted))
	);

	block.append(header);

	for (const section of SECTIONS) {
		const entries = buildEntries(section, platformEvents);
		if (entries.length > 0) block.append(buildRow(section, entries));
	}
	return block;
}

function renderCredits(events, root = document.getElementById("credits")) {
	root.querySelectorAll(".platform").forEach((node) => node.remove());

	const byPlatform = groupBy(events, (e) => e.platform);
	const fragment = document.createDocumentFragment();

	for (const platform of PLATFORMS) {
		const platformEvents = byPlatform.get(platform.id);
		if (platformEvents?.length) fragment.append(buildPlatform(platform, platformEvents));
	}
	root.append(fragment);
}

const DB_NAME = "creditsrd";
const STORE_NAME = "events";
const RENDER_THROTTLE_MS = 300;

const eventsById = new Map();

let dbPromise = null;
let renderTimer = null;

function openDb() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			const store = request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
			store.createIndex("byTs", "ts");
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function getDb() {
	dbPromise ??= openDb();
	return dbPromise;
}

async function saveEvent(event) {
	const db = await getDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		tx.objectStore(STORE_NAME).put(event);
		tx.oncomplete = resolve;
		tx.onerror = () => reject(tx.error);
	});
}

async function loadAllEvents() {
	const db = await getDb();
	return new Promise((resolve, reject) => {
		const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function clearStoredEvents() {
	const db = await getDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		tx.objectStore(STORE_NAME).clear();
		tx.oncomplete = resolve;
		tx.onerror = () => reject(tx.error);
	});
}

function scheduleRender() {
	if (renderTimer) return;
	renderTimer = setTimeout(() => {
		renderTimer = null;
		renderCredits([...eventsById.values()]);
	}, RENDER_THROTTLE_MS);
}

function isValidEvent(event) {
	return Boolean(
		event?.id &&
		event.platform &&
		event.type &&
		event.user?.id &&
		event.user?.name
	);
}

function resetCreditsDom() {
	const header = container.querySelector("header");
	container.replaceChildren(...(header ? [header] : []));
}

async function initCredits(clear = false) {
	resetCreditsDom();

	try {
		if (clear) {
			eventsById.clear();
			await clearStoredEvents();
		} else {
			const stored = await loadAllEvents();
			for (const event of stored) eventsById.set(event.id, event);
		}
	} catch (error) {
		console.error("[CreditsRD] Failed to initialize events:", error);
	}
	scheduleRender();
}

async function addEvent(event) {
	if (!isValidEvent(event)) {
		console.warn("[CreditsRD] Ignoring invalid event:", event);
		return false;
	}

	if (!KNOWN_TYPES.has(event.type)) {
		console.warn(`[CreditsRD] Unknown event type "${event.type}". Valid types:`, [...KNOWN_TYPES]);
	}

	event.ts ??= Date.now();

	const fields = ACCUMULATE_FIELDS.get(event.type);
	if (fields) {
		const previous = eventsById.get(event.id);
		if (previous) {
			const data = { ...previous.data, ...event.data };
			for (const field of fields) {
				data[field] = (previous.data?.[field] ?? 0) + (event.data?.[field] ?? 0);
			}
			event = {
				...previous,
				user: event.user,
				data
			};
		}
	}

	eventsById.set(event.id, event);
	scheduleRender();

	try {
		await saveEvent(event);
		return true;
	} catch (error) {
		console.error("[CreditsRD] Failed to save event:", error);
		return false;
	}
}

async function clearSession() {
	await initCredits(true);
}

document.addEventListener("DOMContentLoaded", async function () {
	console.debug(`[CreditsRD] Initializing ...`);

	await loadLang();
	initCredits();
	setSpeed();
});