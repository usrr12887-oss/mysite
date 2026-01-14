const express = require("express");
const fs = require("fs");
const session = require("express-session");
const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use(session({
    secret: process.env.SESSION_SECRET || "dior-secret",
    resave: false,
    saveUninitialized: false
}));

// 🔁 Log oxuma
function readLogs(){
    try{
        if(!fs.existsSync("logs.json")) return [];
        const data = fs.readFileSync("logs.json","utf8");
        return data ? JSON.parse(data) : [];
    }catch{
        return [];
    }
}

// 📝 Log yazma
app.post("/log", (req, res) => {
    const logs = readLogs();

    const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress ||
        "unknown";

    logs.push({
        code: req.body.code,
        valid: req.body.valid,
        agent: req.body.agent,
        ip: ip,
        time: new Date().toLocaleString()
    });

    fs.writeFileSync("logs.json", JSON.stringify(logs, null, 2));
    res.sendStatus(200);
});

// 🔒 Logları yalnız admin görsün
app.get("/logs", (req, res) => {
    if(!req.session.admin){
        return res.status(401).json([]);
    }
    res.json(readLogs());
});

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "12345";

// 🔐 Admin login
app.post("/admin-login", (req, res) => {
    if(
        req.body.username === ADMIN_USER &&
        req.body.password === ADMIN_PASS
    ){
        req.session.admin = true;
        res.json({success:true});
    } else {
        res.json({success:false});
    }
});


// 🔐 Qorunan admin panel
app.get("/admin", (req, res) => {
    if(!req.session.admin){
        return res.redirect("/admin.html");
    }
    res.sendFile(__dirname + "/public/admin-panel.html");
});

// 🚪 Logout
app.get("/logout", (req, res) => {
    req.session.destroy(()=>{
        res.redirect("/admin.html");
    });
});

// 🌍 ONLINE PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server işləyir, port:", PORT);
});
