import express from 'express';
import * as configController from '../controllers/configController.js';

const router = express.Router();

router.get('/languages', configController.getLanguage);

export default router;
