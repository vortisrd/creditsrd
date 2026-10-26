/* ------------------------ */
/* YOUTUBE MODULE VARIABLES */
/* ------------------------ */

const showYoutube                       = getURLParam("showYoutube", false);
const showYouTubeMessages               = getURLParam("showYouTubeMessages", true);
const showYouTubeSuperChats             = getURLParam("showYouTubeSuperChats", true);
const showYouTubeSuperStickers          = getURLParam("showYouTubeSuperStickers", true);
const showYouTubeMemberships            = getURLParam("showYouTubeMemberships", true);
const showYouTubeGiftMemberships        = getURLParam("showYouTubeGiftMemberships", true);
const showYouTubeJewels                 = getURLParam("showYouTubeJewels", true);

const youtubeJewelsComboState = new Map();

// YOUTUBE EVENTS HANDLERS

const youtubeMessageHandlers = {
    'YouTube.Message': (response) => {
        youTubeChatMessage(response.data);
    },
    'YouTube.SuperChat': (response) => {
        youTubeSuperChatMessage(response.data);
    },
    'YouTube.SuperSticker': (response) => {
        youTubeSuperStickerMessage(response.data);
    },
    'YouTube.NewSponsor': (response) => {
        youTubeNewSponsorMessage(response.data);
    },
    'YouTube.MemberMileStone': (response) => {
        youTubeNewSponsorMessage(response.data);
    },
    'YouTube.MembershipGift': (response) => {
        youTubeGiftBombMessage(response.data);
    },
    'YouTube.JewelsGifted': (response) => {
        youTubeJewels(response.data);
    },
    'YouTube.BroadcastStarted': (response) => {
        creditsRdReset('youtube');
    }
};


if (showYoutube) {

    waitForStreamerBot('YouTube').then(() => {
        registerPlatformHandlersToStreamerBot(youtubeMessageHandlers, '[CreditsRD][YouTube]');
    });

}




// ---------------------------
// YOUTUBE EVENT FUNCTIONS

async function youTubeChatMessage(data) {

    if (showYouTubeMessages == false) return;
    if (ignoreUserList.includes(data.user.name.toLowerCase())) return;

    const { user } = data;
    if (!user?.id) return;

    addEvent({
        id: `yt-chat-${user.id}`,
        platform: "youtube",
        type: "chat",
        ts: Date.now(),
        user: { id: user.id, name: user.name, avatar: user.profileImageUrl },
        data: { }
    });
}

async function youTubeSuperChatMessage(data) {

    if (showYouTubeSuperChats == false) return;

    const { user } = data;
    if (!user?.id) return;

    addEvent({
        id: `yt-superChat-${data.eventId}`,
        platform: "youtube",
        type: "superChat",
        ts: Date.now(),
        user: { id: user.id, name: user.name, avatar: user.profileImageUrl },
        data: {
            amount: data.microAmount / 1_000_000,
            currency: data.currencyCode
        }
    });
}

async function youTubeSuperStickerMessage(data) {

    if (showYouTubeSuperChats == false) return;

    const { user } = data;
    if (!user?.id) return;

    addEvent({
        id: `yt-superSticker-${data.eventId}`,
        platform: "youtube",
        type: "superSticker",
        ts: Date.now(),
        user: { id: user.id, name: user.name, avatar: user.profileImageUrl },
        data: {
            amount: data.microAmount / 1_000_000,
            currency: data.currencyCode
        }
    });
}

async function youTubeNewSponsorMessage(data) {

    if (showYouTubeMemberships == false) return;

    const { user } = data;
    if (!user?.id) return;

    addEvent({
        id: `yt-memberships-${data.eventId}`,
        platform: "youtube",
        type: "membership",
        ts: Date.now(),
        user: { id: user.id, name: user.name, avatar: user.profileImageUrl },
        data: {
            months: data.months ?? 1
        }
    });
}

async function youTubeGiftBombMessage(data) {
    
    if (showYouTubeMemberships == false || showYouTubeGiftMemberships == false) return;

    const { user } = data;
    if (!user?.id) return;

    addEvent({
        id: `yt-giftedMemberships-${data.eventId ?? `${user.id}-${Date.now()}`}`,
        platform: "youtube",
        type: "giftMembership",
        ts: Date.now(),
        user: { id: user.id, name: user.name, avatar: user.profileImageUrl },
        data: {
            amount: data.count
        }
    });

}

async function youTubeJewels(data) {

    if (showYouTubeJewels == false) return;

    const { user } = data;
    if (!user?.id) return;

    const jewelsKey = `${data.user.id}::${data.name}`;
    const jewelsDurationMs = Math.round(data.duration.seconds * 1000);
    const jewelsCount = youtubeJewelsComboState.get(jewelsKey);

    if (jewelsCount) { clearTimeout(jewelsCount.timer); }

    const jewelsCountdown = setTimeout(() => {

        const jewelsFinalState = youtubeJewelsComboState.get(jewelsKey);
        youtubeJewelsComboState.delete(jewelsKey);
        
        const jewelRealAmount = Math.floor(data.comboCount * data.jewelsAmount); 

        if (jewelsFinalState) {
            addEvent({
                id: `yt-jewels-${data.eventId}`,
                platform: "youtube",
                type: "jewel",
                ts: Date.now(),
                user: { id: user.id, name: user.name, avatar: user.profileImageUrl },
                data: {
                    amount: jewelRealAmount
                }
            });
        }
        
    }, jewelsDurationMs);

    youtubeJewelsComboState.set(jewelsKey, { timer: jewelsCountdown, lastData: data });
}