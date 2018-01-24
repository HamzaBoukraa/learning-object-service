import { Responder } from "../../interfaces/interfaces";
import { Response } from 'express';
export class ExpressResponder implements Responder {

    constructor(private res: Response) { }
    sendOperationSuccess(): void {
        this.res.sendStatus(200);
    }

    sendOperationErrorJSON(error?: { error: string }, status?: number) {
        error && status ? this.res.status(status).json(error)
            : error && !status ? this.res.status(400).json(error)
                : !error && status ? this.res.status(status).json({ error: "Server error encounter." })
                    : this.res.status(400).json({ error: "Server error encounter." });
    }
    sendOperationError(error?: string, status?: number): void {
        error && status ? this.res.status(status).send(error)
            : error && !status ? this.res.status(400).send(error)
                : !error && status ? this.res.status(status).send("Server error encounter.")
                    : this.res.status(400).send("Server error encounter.");
    }
    sendObject(object: any): void {
        this.res.json(object);
    }

}