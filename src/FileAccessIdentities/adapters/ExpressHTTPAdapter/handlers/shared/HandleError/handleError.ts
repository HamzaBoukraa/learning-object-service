import { Response } from './node_modules/express';
import { mapErrorToResponseData } from '../../../../../../shared/errors';

export function handleError(params: {
    error: Error,
    res: Response,
}) {
    const { code, message } = mapErrorToResponseData(params.error);
    params.res.status(code).json({ message });
}
