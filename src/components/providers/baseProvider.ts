/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { Providers } from '../../Providers';
import { MgtBaseComponent } from '../baseComponent';

export abstract class MgtBaseProvider extends MgtBaseComponent {
  constructor() {
    super();
    Providers.onProviderUpdated(() => this.loadState());
    this.loadState();
  }

  private async loadState() {
    const provider = Providers.globalProvider;

    if (provider) {
      // Fire event for current state
      this.fireCustomEvent('onStateChanged', provider.state);

      provider.onStateChanged(() => {
        this.fireCustomEvent('onStateChanged', provider.state);
      });
    }
  }

  firstUpdated(changedProperties) {
    const provider = Providers.globalProvider;

    if (provider) {
      this.fireCustomEvent('onStateLoaded', provider.state);
    }
  }
}
