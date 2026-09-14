import * as configService from '../models/configService.js';

export const getLanguage = async (req, res) => {
    try {
        const data = await configService.getLanguage();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching languages:', error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};
