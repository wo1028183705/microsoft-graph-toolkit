import { IAuthProvider, LoginChangedEvent, LoginType } from "./IAuthProvider";
import { Graph } from "./GraphSDK";
import { EventHandler, EventDispatcher } from "./EventHandler";
import { MsalConfig } from "./MsalConfig";
import {UserAgentApplication} from "msal/lib-es6";

export class MsalProvider implements IAuthProvider {

    private _loginChangedDispatcher = new EventDispatcher<LoginChangedEvent>();
    private _loginType : LoginType;

    private _idToken : string;

    private _userAgentApplication : UserAgentApplication;

    get provider(): UserAgentApplication {
        return this._userAgentApplication;
    }

    get isLoggedIn(): boolean {
        return !!this._idToken;
    }

    get isAvailable(): boolean{
        return true;
    }

    scopes: string[];

    graph: Graph;

    private constructor() { }

    public static create(config: MsalConfig) {
        if (!config.clientId) {
            throw "ClientID must be a valid string";
        }

        let provider = new MsalProvider();
        provider.initProvider(config);

        return provider;
    }

    public static createFromUserAgentApplication(userAgentApplication: UserAgentApplication, loginType = LoginType.Redirect){
        let provider = new MsalProvider();
        provider.scopes = ["user.read"];
        provider._loginType = loginType;

        provider._userAgentApplication = userAgentApplication;
        provider.graph = new Graph(provider);

        provider.tryGetIdTokenSilent();

        return provider;
    }

    private initProvider(config: MsalConfig) {
        let clientId = config.clientId;
        this.scopes = (typeof config.scopes !== 'undefined') ? config.scopes : ["user.read"];
        let authority = (typeof config.authority !== 'undefined') ? config.authority : null;
        let options = (typeof config.options != 'undefined') ? config.options : {};
        this._loginType = (typeof config.loginType !== 'undefined') ? config.loginType : LoginType.Redirect;

        let callbackFunction = ((errorDesc : string, token: string, error: any, state: any) => {
            this.tokenReceivedCallback(errorDesc, token, error, state);
        }).bind(this);

        // import msal
        // let msal = await import(/* webpackChunkName: "msal" */ "msal/lib-es6");

        this._userAgentApplication = new UserAgentApplication(clientId, authority, callbackFunction, options);
        this.graph = new Graph(this);

        this.tryGetIdTokenSilent();
    }

    async login(): Promise<void> {
        if (this._loginType === LoginType.Popup) {
            this._idToken = await this.provider.loginPopup(this.scopes);
            this.fireLoginChangedEvent({});
        } else {
            this.provider.loginRedirect(this.scopes);
        }
    }

    async tryGetIdTokenSilent(): Promise<boolean> {
        try {
            this._idToken = await this.provider.acquireTokenSilent([this._userAgentApplication.clientId]);
            if (this._idToken) {
                this.fireLoginChangedEvent({});
            }
            return this.isLoggedIn;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async getAccessToken(scopes?: string[]): Promise<string> {
        let accessToken : string;
        scopes = scopes || this.scopes;
        try {
            accessToken = await this.provider.acquireTokenSilent(scopes);
        } catch (e) {
            try {
                // TODO - figure out for what error this logic is needed so we
                // don't prompt the user to login unnecessarily
                if (this._loginType == LoginType.Redirect) {
                    await this.provider.acquireTokenRedirect(scopes);
                } else {
                    accessToken = await this.provider.acquireTokenPopup(scopes);
                }
            } catch (e) {
                // TODO - figure out how to expose this during dev to make it easy for the dev to figure out
                // if error contains "'token' is not enabled", make sure to have implicit oAuth enabled in the AAD manifest
                console.log(e);
                throw e;
            }
        }
        return accessToken;
    }
    
    async logout(): Promise<void> {
        this.provider.logout();
        this.fireLoginChangedEvent({});
    }
    
    updateScopes(scopes: string[]) {
        this.scopes = scopes;
    }

    tokenReceivedCallback(errorDesc : string, token: string, error: any, state: any)
    {
        if (error) {
            console.log(errorDesc);
        } else {
            this._idToken = token;
            this.fireLoginChangedEvent({});
        }

        console.log('here');
    }

    onLoginChanged(eventHandler : EventHandler<LoginChangedEvent>) {
        this._loginChangedDispatcher.register(eventHandler);
    }

    private fireLoginChangedEvent(event : LoginChangedEvent) {
        this._loginChangedDispatcher.fire(event);
    }
}