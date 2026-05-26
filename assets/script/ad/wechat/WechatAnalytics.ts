
export class WechatAnalytics {


    constructor() {
    }

    //埋点
    event(key,data) {
        if (data === undefined) {
            wx.uma['trackEvent'](key);
        }
        else{
            wx.uma['trackEvent'](key,data);
        }
    }


}
