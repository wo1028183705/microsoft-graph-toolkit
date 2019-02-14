import { IGraph } from "./GraphSDK";
import { EventHandler } from "./EventHandler";

// TODO: once graph client sdk updates to support this
//import { IAuthenticationProvider } from "@microsoft/microsoft-graph-client/lib/src/";

export interface IAuthProvider //extends AuthenticationProvider
{
    readonly isLoggedIn : boolean;
    readonly isAvailable : boolean;

    login() : Promise<void>;
    logout() : Promise<void>;
    getAccessToken() : Promise<any>;
    addScope(...scope: string[]);

    // get access to underlying provider
    provider : any;
    graph : IGraph;

    // events
    onLoginChanged(eventHandler : EventHandler<LoginChangedEvent>)
}

export interface LoginChangedEvent { }

export enum LoginType
{
    Popup,
    Redirect
}