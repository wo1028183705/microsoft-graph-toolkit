/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { customElement } from 'lit-element';
import { MockProvider } from './MockProvider';
import { MgtBaseProvider } from '../components/providers/baseProvider';

@customElement('mgt-mock-provider')
export class MgtMockProvider extends MgtBaseProvider {
  constructor() {
    super();
    this.provider = new MockProvider(true);
  }
}
