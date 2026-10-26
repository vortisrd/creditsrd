/* ----------------------- */
/* TIKTOK MODULE VARIABLES */
/* ----------------------- */

const tikFinityStatus = {};

const showTiktok                    = getURLParam("showTiktok", false);
const showTikTokMessages            = getURLParam("showTikTokMessages", true);
const showTikTokFollows             = getURLParam("showTikTokFollows", true);
const showTikTokLikes               = getURLParam("showTikTokLikes", false);
const showTikTokShares              = getURLParam("showTikTokShares", false);
const showTikTokGifts               = getURLParam("showTikTokGifts", true);
const showTikTokSubs                = getURLParam("showTikTokSubs", true);



document.addEventListener('DOMContentLoaded', () => {
    if (showTiktok) {
        waitForStreamerBot('TikTok').then(() => {
            tiktokConnection();
        });
    }
});


// -----------------------
// TIKTOK CONNECT HANDLER

async function tiktokConnection() {
    const tikfinityWebSocketURL = 'ws://localhost:21213/';
    const reconnectDelay = 10000; 
    const maxTries = 20;
    let retryCount = 0;
    let errorLogged = false; 

    function connect() {
        const tikfinityWebSocket = new WebSocket(tikfinityWebSocketURL);

        tikfinityWebSocket.onopen = () => {
            console.debug(`[CreditsRD][TikFinity] Connected to TikFinity successfully!`);
            retryCount = 0;
            errorLogged = false; 

            notifySuccess({
                title: 'CreditsRD 🤝 TikFinity',
                text: ``
            });

            tikFinityStatus.connected = true;
            tikFinityStatus.disconnected = false;
            tikFinityStatus.error = false;
        };

        tikfinityWebSocket.onmessage = (response) => {

            const data = JSON.parse(response.data);
            const tiktokData = data.data;

            console.debug(`[CreditsRD][TikFinity][TikTok] ${data.event}`, data);

            switch (data.event) {
                case 'like': tiktokLikesMessage(tiktokData); break;
                case 'share' : tiktokShareMessage(tiktokData); break;
                case 'follow': tiktokFollowMessage(tiktokData); break;
                case 'gift': tiktokGiftMessage(tiktokData); break;
                case 'subscribe': tiktokSubMessage(tiktokData); break;
                case 'chat': tiktokChatMessage(tiktokData); break;
                case 'liveStatusChange' :
                    if (tiktokData.isLive) { creditsRdReset('tiktok'); }
                break;
            }
        };

        tikfinityWebSocket.onclose = (event) => {

            setTimeout(() => {
                connect();
            }, reconnectDelay);

            if (tikFinityStatus.disconnected == false) {
                notifyError({
                    title: 'CreditsRD ❌ TikFinty',
                    text: ``
                });
            }

            tikFinityStatus.connected = false;
            tikFinityStatus.disconnected = true;
            tikFinityStatus.error = true;

        };

        tikfinityWebSocket.onerror = (error) => {
            if (!errorLogged) {
                console.error(`[CreditsRD][TikFinity] Connection error:`, error);

                if (tikFinityStatus.error == false) {
                    notifyError({
                        title: 'CreditsRD ⚠️ TikFinty',
                        text: ``
                    });
                }

                errorLogged = true;
            }

            if (tikfinityWebSocket.readyState !== WebSocket.CLOSED) {
                tikfinityWebSocket.close();
            }

            tikFinityStatus.connected = false;
            tikFinityStatus.disconnected = true;
            tikFinityStatus.error = true;
        };

        return tikfinityWebSocket;
    }

    return connect();
}













// ---------------------------
// TIKTOK UTILITY FUNCTIONS

async function tiktokChatMessage(data) {
    
    if (!data?.comment) { data.comment = " "; }
    if (showTikTokMessages == false) return;
    if (ignoreUserList.includes(data.uniqueId.toLowerCase())) return;
    
    const id = data.userId;
    const name = data.nickname;
    const login = data.uniqueId;
    const avatar = data.profilePictureUrl;

	addEvent({
		id: `tiktok-chat-${id}`,
		platform: "tiktok",
		type: "chat",
		ts: Date.now(),
		user: { id, name, avatar },
        data: { }
	});

}



async function tiktokFollowMessage(data) {

    if (showTikTokFollows == false) return;

    const id = data.userId;
    const name = data.nickname;
    const login = data.uniqueId;
    const avatar = data.profilePictureUrl;

	addEvent({
		id: `tiktok-follow-${id}`,
		platform: "tiktok",
		type: "follow",
		ts: Date.now(),
		user: { id, name, avatar }
	});
}


async function tiktokShareMessage(data) {

    if (showTikTokShares == false) return;

    const id = data.userId;
    const name = data.nickname;
    const login = data.uniqueId;
    const avatar = data.profilePictureUrl;

	addEvent({
		id: `tiktok-share-${id}`,
		platform: "tiktok",
		type: "share",
		ts: Date.now(),
		user: { id, name, avatar },
        data: { amount: 1 }
	});

}



async function tiktokLikesMessage(data) {

    if (showTikTokLikes == false) return;

    const likes = Number(data.likeCount) || 0;
    if (!likes) return;

    const id = data.userId;
    const name = data.nickname;
    const login = data.uniqueId;
    const avatar = data.profilePictureUrl;

	addEvent({
		id: `tiktok-likes-${id}`,
		platform: "tiktok",
		type: "likes",
		ts: Date.now(),
		user: { id, name, avatar },
        data: { amount: likes }
	});

}


async function tiktokSubMessage(data) {

    if (showTikTokSubs == false) return;

    const id = data.userId;
    const name = data.nickname;
    const login = data.uniqueId;
    const avatar = data.user.profilePicture;

	addEvent({
		id: `tiktok-subs-${id}-${Date.now()}`,
		platform: "tiktok",
		type: "superFan",
		ts: Date.now(),
		user: { id, name, avatar },
        data: { }
	});
}





async function tiktokGiftMessage(data) {

    if (showTikTokGifts == false) return;
    if (data.giftType === 1 && !data.repeatEnd) return;

    const id = data.userId;
    const name = data.nickname;
    const avatar = data.profilePictureUrl;
    const coins = Math.floor(data.repeatCount * data.diamondCount) || 0;
    if (!coins) return;

	addEvent({
		id: `tiktok-gifts-${id}-${data.giftName}`,
		platform: "tiktok",
		type: "tiktokGift",
		ts: Date.now(),
		user: { id, name, avatar },
        data: { coins, amount: data.repeatCount, giftImage: data.giftPictureUrl, giftName: data.giftName }
	});
}