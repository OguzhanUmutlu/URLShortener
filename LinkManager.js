const fs = require("fs");

module.exports = class LinkManager {
    constructor() {
        this.data = JSON.parse(fs.readFileSync("./links.json").toString());
        this.ERROR_LINK_NOT_FOUND = "Custom name is invalid.";
        this.ERROR_ENTER_PASSWORD = "You should enter password.";
        this.SUCCESS = "Success";
    }

    save() {
        fs.writeFileSync("./links.json", JSON.stringify(this.data));
    }

    getLinkByCustomName(customName) {
        return Object.values(this.data).filter(l => l.customName+"" === customName+"")[0];
    }

    getLinkInfo(ip, customName, password = null) {
        let link = this.getLinkByCustomName(customName);
        this.checkLink(link ? link.id : -1);
        link = this.getLinkByCustomName(customName);
        if(!link || (link.isPrivate && link.ip !== ip)) return { code: -1, error: this.ERROR_LINK_NOT_FOUND };
        if(link.password && link.password !== password) return { code: -1, error: this.ERROR_ENTER_PASSWORD };
        return { code: 1, message: this.SUCCESS, link: link.link };
    }

    getUniqueId() {
        const id = fs.readFileSync("./unique.txt").toString()*1;
        fs.writeFileSync("unique.txt", (id+1).toString());
        return id;
    }

    getLinks(ip) {
        return Object.values(this.data).filter(link => link.ip === ip);
    }

    addLink(ip, link, isPrivate = false, customName = null, password = null, expireDate = -1) {
        const id = this.getUniqueId();
        customName = customName || id+"";
        if(this.getLinkByCustomName(customName)) return false;
        this.data[id] = {
            id, ip, link, isPrivate, customName, password, expireDate
        };
        this.save();
        return id;
    }

    removeLink(removerIp, id, force = false) {
        if(!this.data[id] || (!force && removerIp !== this.data[id].ip)) return false;
        delete this.data[id];
        this.save();
        return true;
    }

    updateLink(id, updaterIp, options = {}) {
        if(!this.data[id] || updaterIp !== this.data[id].ip) return false;
        Object.keys(options).forEach(optionKey => {
            const option = options[optionKey];
            if(Object.keys(this.data[id]).includes(optionKey) && optionKey !== "id" && optionKey !== "ip") {
                this.data[id][optionKey] = option;
            }
        });
        return true;
    }

    isLinkExpired(id) {
        return this.data[id] && this.data[id].expireDate < Date.now() && this.data[id].expireDate > 0;
    }

    checkLink(id) {
        if(this.isLinkExpired(id)) {
            this.removeLink(-1, id, true);
        }
    }
}