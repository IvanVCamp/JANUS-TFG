const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const planetController = require('../controllers/planet.controller');

router.post('/', authMiddleware, planetController.createPlanetResult);
router.get('/', authMiddleware, planetController.getPlanetResults);

module.exports = router;
