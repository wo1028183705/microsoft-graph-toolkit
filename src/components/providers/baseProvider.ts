/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { MgtBaseComponent } from '../baseComponent';
import { IProvider } from '../../providers/IProvider';
import { Providers } from '../../Providers';

export abstract class MgtBaseProvider extends MgtBaseComponent {
  private _provider: IProvider;

  public get provider() {
    return this._provider;
  }

  public set provider(value) {
    if (!Providers.globalProvider && !this._provider && value) {
      this._provider = value;
      Providers.globalProvider = this.provider;

      this._provider.onStateChanged(this.onProviderStateChanged.bind(this));
      this.fireStateChangedEvent();
    }
  }

  private onProviderStateChanged() {
    this.fireStateChangedEvent();
  }

  private fireStateChangedEvent() {
    this.fireCustomEvent('stateChanged', this._provider.state);
  }
}
