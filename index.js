const express = require("express");
const app = express();
const fs = require("fs");
const LinkManager = new (require("./LinkManager"))();

app.get("/", (req, res) => {
    res.send(fs.readFileSync("./index.html").toString().replace(/{DOMAIN}/g, "https://" + req.hostname));
});

app.get("/l/:customName", (req, res) => {
    const ip = req.headers["x-forwarded-for"];
    const customName = req.params.customName;
    const link = LinkManager.getLinkInfo(ip, customName, req.query.password);
    if (link.error === LinkManager.ERROR_ENTER_PASSWORD) return res.send(
        `
<script>
    window.location.href="/l/${customName}?password="+prompt("Enter password");
</script>
`
    );
    if (link.error) return res.send(`<script>alert("${link.error}");window.location.href="/";</script>`);
    res.redirect(!link.link.startsWith("https://") && !link.link.startsWith("http" + "://") ? "https://" + link.link : link.link);
});

app.get("/api", (req, res) => {
    const ip = req.headers["x-forwarded-for"];
    const action = req.query.action;
    if (!action) return res.json({
        code: -1,
        error: "You should enter an action!"
    });
    switch (action) {
        case "getLink":
            const customName = req.query.customName;
            if (!customName) return res.json({
                code: -1,
                error: "You should enter custom name!"
            });
            const link = LinkManager.getLinkInfo(ip, customName, req.query.password);
            res.json(link);
            break;
        case "addLink":
            if (!req.query.link) return res.json({
                code: -1,
                error: "You should enter link!"
            });
            const id = LinkManager.addLink(ip, req.query.link, req.query.isPrivate === "true", req.query.customName, req.query.password, req.query.expireDate || -1);
            const cName = req.query.customName || id;
            if (!id) return res.json({
                code: -1,
                error: "This custom name already exists!"
            });
            res.json({
                code: 1,
                id,
                cName
            });
            break;
        case "removeLink":
            if (!req.query.id) return res.json({
                code: -1,
                error: "You should enter link id!"
            });
            if (!LinkManager.removeLink(ip, req.query.id)) return res.json({
                code: -1,
                error: "Link Id not found or you cannot remove this link!"
            });
            res.json({
                code: 1,
                message: "Success"
            });
            break;
        case "updateLink":
            if (!req.query.id) return res.json({
                code: -1,
                error: "You should enter link id!"
            });
            if (!req.query.options) return res.json({
                code: -1,
                error: "You should enter link options!"
            });
            try {
                const options = JSON.parse(req.query.options);
                if (!LinkManager.updateLink(ip, options)) return res.json({
                    code: -1,
                    error: "Link Id not found or you cannot remove this link!"
                });
                res.json({
                    code: 1,
                    message: "Success"
                });
            } catch (err) {
                res.json({
                    code: -1,
                    error: "Invalid JSON."
                });
            }
            break;
        default:
            res.json({
                code: -1,
                error: "Invalid action."
            });
    }
});

app.listen(3000);