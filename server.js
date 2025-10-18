const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
// serve static site after APIs so /budget route isn't shadowed
app.use("/", express.static(path.join(__dirname, "public")));

//connect Database
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/personal_budget";
mongoose.set("strictQuery", true);
mongoose
    .connect(uri)
    .then(() => console.log("✅ Connected to MongoDB",
        mongoose.connection.name))
    .catch((e) => {
        console.error("MongoDB connect error:", e.message);
        process.exit(1);
    });

// schema/model with respond fields and color validation
const BudgetItemSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, minlength: 1, maxlength: 60 },
        value: { type: Number, required: true, min: 0 },
        color: { type: String, required: true, match: /^#([A-Fa-f0-9]{6})$/}
    },
    { timestamps: true }
);
const BudgetItem = mongoose.model("BudgetItem", BudgetItemSchema);

// Legacy compatibility endpoint for the old frontend (returns { myBudget: [...] })
app.get("/budget", async (req, res, next) => {
    try {
        const items = await BudgetItem.find().sort({ createdAt: 1 });
        const payload = {
            myBudget: items.map(i => ({
                title: i.title,
                budget: i.value,
                color: i.color
            }))
        };
        res.json(payload);
    } catch (err) { next(err); }
});

app.get("/api/budget", async (req, res, next) => {
    try {
        const items = await
        BudgetItem.find().sort({ createdAt: 1 });
        res.json({ success: true, data: items });
    } catch (err) { next(err); }
});

app.post("/api/budget", async (req, res, next) => {
    try{
        const created = await BudgetItem.create(req.body);
        res.status(201).json({ success: true, data: created});
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ success: false, message: "Validation error", details: err.errors });
        }
        next(err);
    }
});

// DELETE route to remove a budget item by title
app.delete("/api/budget/:title", async (req, res, next) => {
    try {
        const deleted = await BudgetItem.findOneAndDelete({ title: req.params.title });
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }
        res.json({ success: true, message: `Deleted item: ${req.params.title}` });
    } catch (err) {
        next(err);
    }
});

// health check route
app.get("/health", (_, res) => {
    res.json({ ok: true });
});

//handling the error
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", detail: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Personal Budget server on http://localhost:${port}`));
