import {Webhook_MoralisStream} from '../webhooks/moralisStreamAPI.js';
import {createServiceResponse} from '../responses/typedResponses.js';
import Logger from '../../middleware/loggers/loggerService.js'

export async function routeWebhooks(req) {
    try {
        switch (true) {
            case Boolean(req.headers['x-signature']):
                const whMrls = new Webhook_MoralisStream();
                const isMoralis = whMrls.checkSignature(req);
                if (isMoralis) {
                    const transfers = whMrls.parseTransfers(req);
                    return createServiceResponse({success: true, message: 'Moralis. Webhook', data: {type: 'moralis', payload: transfers}});
                } else {
                    return createServiceResponse({success: false, message: 'Moralis. False signature', data: {type: 'moralis'}});
                }

            default:
                return createServiceResponse({success: false, message: 'Unknown hook', data: {type: undefined}});
        }

    } catch (e) {
        Logger.error({ error: e });
        return createServiceResponse({
            success: false, 
            message: 'Internal server error',
            code: 500,
            errors: [e]
        });
    }
}