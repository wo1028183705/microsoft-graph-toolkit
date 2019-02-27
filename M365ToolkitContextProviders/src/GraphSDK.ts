import * as MicrosoftGraph from "@microsoft/microsoft-graph-types"
import { Client, ResponseType } from "@microsoft/microsoft-graph-client/lib/es6/src"
import { IAuthProvider } from "./IAuthProvider";

export interface IGraph {
    getMe() : Promise<MicrosoftGraph.User>;
    getUser(id: string) : Promise<MicrosoftGraph.User>;
    findPerson(query: string) : Promise<MicrosoftGraph.Person[]>;
    myPhoto() : Promise<string>;
    getUserPhoto(id: string) : Promise<string>;
    getMyCalendarEvents(startDateTime : Date, endDateTime : Date) : Promise<Array<MicrosoftGraph.Event>>
}

export class Graph implements IGraph {

    // private token: string;
    private client : Client;

    constructor(provider: IAuthProvider) {
        this.client = Client.init({
            authProvider: async (done) => {
                done(null, await provider.getAccessToken());
            }
        })
    }

    // async getJson(resource: string, scopes? : string[]) {
    //     let response = await this.get(resource, scopes);
    //     if (response) {
    //         return response.json();
    //     }

    //     return null;
    // }

    // async get(resource: string, scopes?: string[]) : Promise<Response> {
    //     if (!resource.startsWith('/')){
    //         resource = "/" + resource;
    //     }
        
    //     let token : string;
    //     try {
    //         if (typeof scopes !== 'undefined') {
    //             token = await this._provider.getAccessToken(scopes);
    //         } else {
    //             token = await this._provider.getAccessToken();
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         return null;
    //     }
        
    //     if (!token) {
    //         return null;
    //     }

    //     let response = await fetch(this.rootUrl + resource, {
    //         headers: {
    //             authorization: 'Bearer ' + token
    //         }
    //     });

    //     if (response.status >= 400) {

    //         // hit limit - need to wait and retry per:
    //         // https://docs.microsoft.com/en-us/graph/throttling
    //         if (response.status == 429) {
    //             console.log('too many requests - wait ' + response.headers.get('Retry-After') + ' seconds');
    //             return null;
    //         }

    //         let error : any = response.json();
    //         if (error.error !== undefined) {
    //             console.log(error);
    //         }
    //         console.log(response);
    //         throw 'error accessing graph';
    //     }

    //     return response;
    // }

    getMe() : Promise<MicrosoftGraph.User> {
        return this.client.api('me').get();
    }

    getUser(userPrincipleName: string) : Promise<MicrosoftGraph.User> {
        return this.client.api(`/users/${userPrincipleName}`).get();
    }

    async findPerson(query: string) : Promise<MicrosoftGraph.Person[]>{
        let result = await this.client.api(`/me/people`).search('"' + query + '"').get();
        return result ? result.value : null;
    }

    async myPhoto() : Promise<string> {
        let blob = await this.client.api('/me/photo/$value').responseType(ResponseType.BLOB).get();
        return await this.blobToBase64(blob);
    }

    async getUserPhoto(id: string) : Promise<string> {
        let blob = await this.client.api(`users/${id}/photo/$value`).responseType(ResponseType.BLOB).get();
        return await this.blobToBase64(blob);
    }

    private blobToBase64(blob: Blob) : Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader;
            reader.onerror = reject;
            reader.onload = _ => {
                resolve(reader.result as string);
            }
            reader.readAsDataURL(blob);
        });
    }

    // private async getBase64(resource: string, scopes: string[]) : Promise<string> {
    //     try {
    //         let response = await this.get(resource, scopes);
    //         if (!response) {
    //             return null;
    //         }

    //         let blob = await response.blob();
            
    //         return new Promise((resolve, reject) => {
    //             const reader = new FileReader;
    //             reader.onerror = reject;
    //             reader.onload = _ => {
    //                 resolve(reader.result as string);
    //             }
    //             reader.readAsDataURL(blob);
    //         });
    //     } catch {
    //         return null;
    //     }
    // }

    async getMyCalendarEvents(startDateTime : Date, endDateTime : Date) : Promise<MicrosoftGraph.Event[]> {
        let sdt = `startdatetime=${startDateTime.toISOString()}`;
        let edt = `enddatetime=${endDateTime.toISOString()}`
        let uri = `/me/calendarview?${sdt}&${edt}`;

        let calendarView = await this.client.api(uri).get();
        return calendarView ? calendarView.value : null;
    }
}
