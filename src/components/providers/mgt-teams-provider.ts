/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { customElement, property } from 'lit-element';
import { TeamsProvider } from '../../providers/TeamsProvider';
import { MgtBaseProvider } from './baseProvider';

@customElement('mgt-teams-provider')
export class MgtTeamsProvider extends MgtBaseProvider {
  @property({
    type: String,
    attribute: 'client-id'
  })
  clientId = '';

  @property({
    type: String,
    attribute: 'auth-popup-url'
  })
  authPopupUrl = '';

  firstUpdated(changedProperties) {
    this.validateAuthProps();
  }

  private validateAuthProps() {
    if (TeamsProvider.isAvailable() && this.clientId && this.authPopupUrl) {
      if (!this.provider) {
        this.provider = new TeamsProvider({
          clientId: this.clientId,
          authPopupUrl: this.authPopupUrl
        });
      }
    }
  }
}
