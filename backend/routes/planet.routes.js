// routes/planetMap.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const planetMapController = require('../controllers/planet.controller');

router.post('/', authMiddleware, planetMapController.createPlanetMap);
router.get('/', authMiddleware, planetMapController.getPlanetMap);

module.exports = router;
