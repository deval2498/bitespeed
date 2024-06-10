import { Request, Response } from 'express';

export const identifyContact = (req: Request, res:Response) => {
    return res.status(200).json({
        error: false
    })
}