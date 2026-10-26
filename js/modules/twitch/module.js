/* ----------------------- */
/* TWITCH MODULE VARIABLES */
/* ----------------------- */

const twitchModule = true;

const showTwitch                        = getURLParam("showTwitch", false);
const showTwitchMessages                = getURLParam("showTwitchMessages", true);
const showTwitchFollows                 = getURLParam("showTwitchFollows", true);
const showTwitchBits                    = getURLParam("showTwitchBits", true);
const showTwitchSubs                    = getURLParam("showTwitchSubs", true);
const showTwitchGiftedSubs              = getURLParam("showTwitchGiftedSubs", true);
const showTwitchMassGiftedSubs          = getURLParam("showTwitchMassGiftedSubs", true);
const showTwitchRewardRedemptions       = getURLParam("showTwitchRewardRedemptions", true);
const showTwitchPowerUpRedemption       = getURLParam("showTwitchPowerUpRedemptions", true);
const showTwitchRaids                   = getURLParam("showTwitchRaids", true);

const twitchAvatars = new Map();

// TWITCH EVENTS HANDLERS

const twitchMessageHandlers = {
    'Twitch.ChatMessage': (response) => {
        twitchChatMessage(response.data);
    },
    'Twitch.Follow': (response) => {
        twitchFollowMessage(response.data);
    },
    'Twitch.RewardRedemption': (response) => {
        twitchRewardRedemption(response.data);
    },
    'Twitch.Cheer': (response) => {
        twitchBitsMessage(response.data);
    },
    'Twitch.PowerUpRedemption': (response) => {
        twitchPowerUpRedemption(response.data);
    },
    'Twitch.CustomPowerUpRedemption': (response) => {
        twitchCustomPowerUpRedemption(response.data);
    },
    'Twitch.Sub': (response) => {
        twitchSubMessage(response.data);
    },
    'Twitch.ReSub': (response) => {
        twitchReSubMessage(response.data);
    },
    'Twitch.GiftSub': (response) => {
        twitchGiftMessage(response.data);
    },
    'Twitch.GiftBomb': (response) => {
        twitchGiftBombMessage(response.data);
    },
    'Twitch.Raid': (response) => {
        twitchRaidMessage(response.data);
    },
    'Twitch.StreamOnline': (response) => {
        creditsRdReset('twitch');
    }
};



if (showTwitch) {
    waitForStreamerBot('Twitch').then(() => {
        registerPlatformHandlersToStreamerBot(twitchMessageHandlers, '[CreditsRD][Twitch]');
    });
}





// ---------------------------
// TWITCH EVENT FUNCTIONS

async function twitchChatMessage(data) {
    
    if (showTwitchMessages == false) return;
    if (ignoreUserList.includes(data.user.login)) return;

    const { id, name, login } = data.user;
    const avatar = await getTwitchAvatar(login);

    addEvent({
		id: `tw-chat-${id}`,
		platform: "twitch",
		type: "chat",
		ts: Date.now(),
		user: { id: id, name: name, avatar: avatar },
		data: { }
	});

}

async function twitchFollowMessage(data) {
	if (showTwitchFollows == false) return;

	const { id, name, login } = data.targetUser;
    const avatar = await getTwitchAvatar(login);

	addEvent({
		id: `tw-follow-${id}`,
		platform: "twitch",
		type: "follow",
		ts: Date.now(),
		user: { id, name, avatar }
	});
}

async function twitchRewardRedemption(data) {
    
	if (showTwitchRewardRedemptions == false) return;
    
	const { id, user_id, user_name, user_login, reward } = data;
    const avatar = await getTwitchAvatar(user_login);

	addEvent({
		id: `tw-reward-${id}`,
		platform: "twitch",
		type: "reward",
		ts: Date.now(),
		user: { id: user_id, name: user_name, avatar: avatar },
		data: { rewardName: reward.title, cost: reward.cost }
	});
}

async function twitchBitsMessage(data) {

    if (showTwitchBits == false) return;

    const { id, name, login } = data.user;
    const avatar = await getTwitchAvatar(login);

	addEvent({
		id: `tw-bits-${id}-${Date.now()}`,
		platform: "twitch",
		type: "bits",
		ts: Date.now(),
		user: { id, name, avatar },
        data: { amount: data.bits }
	});

}

async function twitchPowerUpRedemption(data) {

    if (showTwitchPowerUpRedemption == false) return;

    const { id, name, login } = data.user;
    const avatar = await getTwitchAvatar(login);

	addEvent({
		id: `tw-bits-${id}-${Date.now()}`,
		platform: "twitch",
		type: "bits",
		ts: Date.now(),
		user: { id, name, avatar },
        data: { amount: data.bits }
	});

}

async function twitchCustomPowerUpRedemption(data) {

    if (showTwitchPowerUpRedemption == false) return;

    const { id, name, login } = data.user;
    const avatar = await getTwitchAvatar(login);

	addEvent({
		id: `tw-bits-${id}-${Date.now()}`,
		platform: "twitch",
		type: "bits",
		ts: Date.now(),
		user: { id, name, avatar },
        data: { amount: data.customPowerUp.bits }
	});

}

async function twitchSubMessage(data) {

    if (showTwitchSubs == false) return;

    const { id, name, login } = data.user;
    const avatar = await getTwitchAvatar(login);
    const monthsCount = data.duration_months ? data.duration_months : data.durationMonths;
    const tier = ( data.is_prime ? data.is_prime : data.isPrime ) ? 'Prime' : Math.floor( (data.sub_tier ? data.sub_tier : data.subTier ) /1000);

	addEvent({
		id: `tw-subs-${id}-${Date.now()}`,
		platform: "twitch",
		type: "sub",
		ts: Date.now(),
		user: { id, name, avatar },
        data: { months: monthsCount, tier: tier }
	});
}

async function twitchReSubMessage(data) {

    if (showTwitchSubs == false) return;

    const { id, name, login } = data.user;
    const avatar = await getTwitchAvatar(login);
    const monthsCount = data.cumulativeMonths;
    const tier = data.isPrime ? 'Prime' : Math.floor(data.subTier/1000);

	addEvent({
		id: `tw-resubs-${id}-${Date.now()}`,
		platform: "twitch",
		type: "resub",
		ts: Date.now(),
		user: { id, name, avatar },
        data: { months: monthsCount, tier: tier }
	});
}

async function twitchGiftMessage(data) {

    const isSub = showTwitchSubs === false;
    const isGift = showTwitchGiftedSubs === false;

    if (isSub || isGift) return;

    // Parte de um gift bomb: já é contado pelo evento do bomb.
    if (data.fromCommunitySubGift) return;

    const { id, name, login } = data.user;
    const avatar = await getTwitchAvatar(login);
    const monthsCount = data.durationMonths;
    const tier = Math.floor(data.subTier / 1000);
    const recipient = data.recipient?.name;

    if (!recipient) return; // sem destinatário não é presente direto

    addEvent({
        id: `tw-giftSub-${id}-${data.recipient?.id ?? recipient}-${Date.now()}`,
        platform: "twitch",
        type: "giftSub",
        ts: Date.now(),
        user: { id, name, avatar },
        data: { amount: 1, months: monthsCount, tier, recipient }
    });
}

async function twitchGiftBombMessage(data) {

    if (showTwitchSubs == false || showTwitchMassGiftedSubs == false) return;

    const { id, name, login } = data.user;
    const avatar = await getTwitchAvatar(login);
    const total = data.total
    const tier = Math.floor( (data.sub_tier ? data.sub_tier : data.subTier ) /1000);
    addEvent({
        id: `tw-giftSub-${id}-${Date.now()}`,
        platform: "twitch",
        type: "giftSub",
        ts: Date.now(),
        user: { id, name, avatar },
        data: { amount: total, tier: tier }
    });

}

async function twitchRaidMessage(data) {

    if (showTwitchRaids == false) return;

    const name = data.from_broadcaster_user_name ? data.from_broadcaster_user_name : data.raider.name;
    const login = data.from_broadcaster_user_name ? data.from_broadcaster_user_name : data.raider.login;
    const id = data.from_broadcaster_user_id ? data.from_broadcaster_user_id : data.raider.id;

    const avatar = await getTwitchAvatar(login);
    const total = data.viewers;

    addEvent({
        id: `tw-raid-${id}-${Date.now()}`,
        platform: "twitch",
        type: "raid",
        ts: Date.now(),
        user: { id, name, avatar },
        data: { viewers: total }
    });

}


// ---------------------------
// TWITCH UTILITY FUNCTIONS

async function getTwitchAvatar(user) {
    if (showAvatar == false) return;
    
    const DEFAULT_AVATAR = 'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png';

    if (twitchAvatars.has(user)) {
        console.debug(`[CreditsRD][Twitch] Twitch avatar found in cache for ${user}!`);
        return twitchAvatars.get(user);
    }

    console.debug(`[CreditsRD][Twitch] Fetching Twitch avatar for ${user} from DECAPI...`);

    try {
        const response = await fetch(`https://decapi.me/twitch/avatar/${user}`);
        const text = (await response.text()).trim();
        const isInvalid = !response.ok || /user not found|invalid/i.test(text);

        if (!isInvalid) {
            console.debug(`[CreditsRD][Twitch] Avatar found on DECAPI for ${user}!`);
            twitchAvatars.set(user, text);
            return text;
        }

        console.warn(`[CreditsRD][Twitch] DECAPI failed for ${user} (${response.status}: "${text}"). Trying Twitch GQL...`);
    }
    catch (err) {
        console.warn(`[CreditsRD][Twitch] DECAPI request failed for ${user}:`, err, `Trying Twitch GQL...`);
    }

    // Twitch GraphQL - Thanks Claude! ❤️

    try {
        const gqlResponse = await fetch("https://gql.twitch.tv/gql", {
            method: "POST",
            headers: {
                "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
                "Content-Type": "application/json",
            },
            body: JSON.stringify([{
                operationName: "StreamMetadata",
                variables: { channelLogin: user },
                extensions: {
                    persistedQuery: {
                        version: 1,
                        sha256Hash: "059c4653b788f5bdb2f5a2d2a24b0ddc3831a15079001a3d927556a96fb0517f"
                    }
                }
            }])
        });

        const data = await gqlResponse.json();
        const avatar = data?.[0]?.data?.user?.profileImageURL;

        if (avatar) {
            console.debug(`[CreditsRD][Twitch] Avatar found on Twitch GQL for ${user}!`);
            twitchAvatars.set(user, avatar);
            return avatar;
        }

        console.warn(`[CreditsRD][Twitch] Twitch GQL returned no avatar for ${user}. Using default.`);
    }
    catch (err) {
        console.error(`[CreditsRD][Twitch] Twitch GQL request failed for ${user}:`, err);
    }

    twitchAvatars.set(user, DEFAULT_AVATAR);
    return DEFAULT_AVATAR;
}