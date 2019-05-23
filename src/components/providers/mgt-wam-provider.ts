/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { LitElement, customElement, property } from 'lit-element';
import { Providers } from '../../Providers';
import { WamProvider } from '../../providers/WamProvider';
import { MgtBaseProvider } from './baseProvider';

@customElement('mgt-wam-provider')
export class MgtWamProvider extends MgtBaseProvider {
  @property({ attribute: 'client-id' }) clientId: string;

  @property({ attribute: 'authority' }) authority?: string;

  firstUpdated(changedProperties) {
    this.validateAuthProps();

    super.firstUpdated(changedProperties);
  }

  private validateAuthProps() {
    if (this.clientId !== undefined) {
      Providers.globalProvider = new WamProvider(this.clientId, this.authority);
    }
  }
}
