/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { LitElement, customElement } from 'lit-element';
import { MockProvider } from './MockProvider';
import { Providers } from '../Providers';
import { MgtBaseProvider } from '../components/providers/baseProvider';

@customElement('mgt-mock-provider')
export class MgtMockProvider extends MgtBaseProvider {
  constructor() {
    super();
    Providers.globalProvider = new MockProvider(true);
  }
}
