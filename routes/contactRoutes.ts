import { Router } from 'express';
import { identifyContact } from '../controllers/contactController';

const router = Router();

// Define the route for identifying contacts
router.post('/', identifyContact);

export default router;
