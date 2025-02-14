/**
 * @module botframework-streaming-extensions
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { IReceiveResponse } from '../Interfaces/IReceiveResponse';

class PendingRequest {
    public requestId: string;
    public resolve: (response: IReceiveResponse) => void;
    public reject: (reason?: any) => void;
}

export class RequestManager {
    private readonly _pendingRequests = {};

    public pendingRequestCount(): number {
        return Object.keys(this._pendingRequests).length;
    }

    public async signalResponse(requestId: string, response: IReceiveResponse): Promise<boolean> {
        let pendingRequest = this._pendingRequests[requestId];

        if (pendingRequest) {
            pendingRequest.resolve(response);
            delete this._pendingRequests[requestId];

            return true;
        }

        return false;
    }

    public getResponse(requestId: string): Promise<IReceiveResponse> {
        let pendingRequest = this._pendingRequests[requestId];

        if (pendingRequest) {
            return Promise.reject('requestId already exists in RequestManager');
        }

        pendingRequest = new PendingRequest();
        pendingRequest.requestId = requestId;

        let promise = new Promise<IReceiveResponse>((resolve, reject): void => {
            pendingRequest.resolve = resolve;
            pendingRequest.reject = reject;
        });

        this._pendingRequests[requestId] = pendingRequest;

        return promise;
    }
}
