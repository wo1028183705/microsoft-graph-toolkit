/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { LitElement, html } from 'lit-element';

export abstract class MgtBaseComponent extends LitElement {
  protected fireCustomEvent(eventName: string, detail?: any): boolean {
    let event = new CustomEvent(eventName, {
      cancelable: true,
      bubbles: true, // Needs to be true for composed
      detail: detail,
      composed: true // Let the event cross the shadow dom https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
    });
    return this.dispatchEvent(event);
  }
}
