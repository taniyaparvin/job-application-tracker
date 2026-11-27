const router = require("express").Router();
const Application = require("../models/Application");

// Escape user text so it is safe inside a RegExp
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/applications?status=&search=
router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.company = new RegExp(escapeRegex(search), "i");
    const apps = await Application.find(filter).sort({ dateApplied: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/applications/stats  (must be above "/:id" routes)
router.get("/stats", async (req, res) => {
  try {
    const groups = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const stats = { total: 0, Wishlist: 0, Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
    groups.forEach((g) => {
      stats[g._id] = g.count;
      stats.total += g.count;
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/applications
router.post("/", async (req, res) => {
  try {
    const created = await Application.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/applications/:id
router.put("/:id", async (req, res) => {
  try {
    const updated = await Application.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/applications/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Application.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
