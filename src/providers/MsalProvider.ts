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

    private _resolveToken;
    private _rejectToken;
    
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
    authority: string;

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
        console.log('initProvider');
        let clientId = config.clientId;
        this.scopes = (typeof config.scopes !== 'undefined') ? config.scopes : ["user.read"];
        let options = (typeof config.options != 'undefined') ? config.options : {cacheLocation: 'localStorage'};
        this.authority = (typeof config.authority !== 'undefined') ? config.authority : null;
        this._loginType = (typeof config.loginType !== 'undefined') ? config.loginType : LoginType.Redirect;

        let callbackFunction = ((errorDesc : string, token: string, error: any, tokenType: any, state: any) => {
            this.tokenReceivedCallback(errorDesc, token, error, tokenType, state);
        }).bind(this);

        // import msal
        // let msal = await import(/* webpackChunkName: "msal" */ "msal/lib-es6");

        this._userAgentApplication = new UserAgentApplication(clientId, this.authority, callbackFunction, options);
        console.log(this._userAgentApplication);
        this.graph = new Graph(this);

        this.tryGetIdTokenSilent();
    }

    async login(): Promise<void> {
        console.log('login');
        if (this._loginType === LoginType.Popup) {
            this._idToken = await this.provider.loginPopup(this.scopes);
            this.fireLoginChangedEvent({});
        } else {
            this.provider.loginRedirect(this.scopes);
        }
    }

    async tryGetIdTokenSilent() : Promise<boolean> {
        console.log('tryGetIdTokenSilent');
        try {
            this._idToken = await this.provider.acquireTokenSilent([this._userAgentApplication.clientId]);
            if (this._idToken) {
                console.log('tryGetIdTokenSilent: got a token');
                this.fireLoginChangedEvent({});
            }
            return this.isLoggedIn;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    private temp = 0;
    async getAccessToken(...scopes: string[]): Promise<string> {
        ++this.temp
        let temp = this.temp;
        scopes = scopes || this.scopes;
        console.log('getaccesstoken' + ++temp + ': scopes' + scopes);
        let accessToken : string;
        try {
            accessToken = await this.provider.acquireTokenSilent(scopes, this.authority);
            console.log('getaccesstoken' + temp + ': got token');
    } catch (e) {
            try {
                console.log('getaccesstoken' + temp + ': catch ' + e);
                // TODO - figure out for what error this logic is needed so we
                // don't prompt the user to login unnecessarily
                if (e.includes('multiple_matching_tokens_detected')) {
                    console.log(e);
                    return null;
                }

                if (this._loginType == LoginType.Redirect) {
                    this.provider.acquireTokenRedirect(scopes);
                    return new Promise((resolve, reject) => {
                        this._resolveToken = resolve;
                        this._rejectToken = reject;
                    });
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

    tokenReceivedCallback(errorDesc : string, token: string, error: any, tokenType: any, state: any)
    {
        debugger;
        console.log('tokenReceivedCallback ' + errorDesc + ' | ' + tokenType);
        if (this._userAgentApplication) {
            console.log(window.location.hash);
            console.log("isCallback: " + this._userAgentApplication.isCallback(window.location.hash));
        }
        if (error) {
            console.log(error + " " + errorDesc);
            if (this._rejectToken) {
                this._rejectToken(errorDesc);
            }
        } else {
            if(tokenType == 'id_token') {
                this._idToken = token;
                this.fireLoginChangedEvent({});
            } else {
                if (this._resolveToken) {
                    this._resolveToken(token);
                }
            }
        }

        console.log('here');
    }

    onLoginChanged(eventHandler : EventHandler<LoginChangedEvent>) {
        console.log('onloginChanged');
        this._loginChangedDispatcher.register(eventHandler);
    }

    private fireLoginChangedEvent(event : LoginChangedEvent) {
        console.log('fireLoginChangedEvent');
        this._loginChangedDispatcher.fire(event);
    }
}