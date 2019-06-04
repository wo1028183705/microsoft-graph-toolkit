/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { LitElement, html, customElement, property } from 'lit-element';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

import { Providers } from '../../Providers';
import { ProviderState } from '../../providers/IProvider';
import { styles } from './mgt-picker-css';

import '../mgt-person/mgt-person';
import '../../styles/fabric-icon-font';
import { MgtTemplatedComponent } from '../templatedComponent';
import { MgtPersonDetails, MgtPerson } from '../mgt-person/mgt-person';

@customElement('mgt-picker')
export class MgtPicker extends MgtTemplatedComponent {
  private _firstUpdated = false;

  @property({
    attribute: 'people',
    type: Object
  })
  people: Array<MgtPersonDetails> = null;

  @property({
    attribute: 'show-max',
    type: Number
  })
  showMax: number = 6;

  @property() private _personName: string = '';
  @property() private _selectedPeople: Array<any> = [];
  @property() private _duplicatePersonId: string = '';

  /* TODO: Do we want a query property for loading groups from calls? */

  static get styles() {
    return styles;
  }

  constructor() {
    super();
  }

  firstUpdated() {
    this._firstUpdated = true;
    Providers.onProviderUpdated(() => this.loadPeople());
    this.loadPeople();
  }

  private onUserTypeSearch(event: any) {
    console.log(event);
    if (event.code == 'Tab') {
      this.addPerson(this.people[0]);
    }
    this.loadPersonSearch(event.target.value);
  }

  private addPerson(person: MgtPersonDetails) {
    this._duplicatePersonId = '';
    let chosenPerson: any = person;
    let filteredPersonArr = this._selectedPeople.filter(function(person) {
      return person.id == chosenPerson.id;
    });
    if (this._selectedPeople.length && filteredPersonArr.length) {
      console.log('match');
      this._duplicatePersonId = chosenPerson.id;
    } else {
      this._selectedPeople.push(person);
      this.loadPeople();
    }
    this.renderChosenPeople();
  }

  private async loadPersonSearch(name: string) {
    let provider = Providers.globalProvider;

    if (provider && provider.state === ProviderState.SignedIn) {
      let client = Providers.globalProvider.graph;
      this.people = await client.findPerson(name);
    }
  }

  private async loadPeople() {
    let provider = Providers.globalProvider;

    if (provider && provider.state === ProviderState.SignedIn) {
      let client = Providers.globalProvider.graph;
      this.people = (await client.getPeople()).slice(0, this.showMax);
    }
  }
  private removePerson(person: MgtPersonDetails) {
    let chosenPerson: any = person;
    let filteredPersonArr = this._selectedPeople.filter(function(person) {
      return person.id !== chosenPerson.id;
    });
    this._selectedPeople = filteredPersonArr;
    this.renderChosenPeople();
  }

  private renderChosenPeople() {
    if (this._selectedPeople.length > 0) {
      return html`
        <ul class="people-chosen-list">
          ${this._selectedPeople.slice(0, this._selectedPeople.length).map(
            person =>
              html`
                <li
                  class="${person.id == this._duplicatePersonId ? 'people-person duplicate-person' : 'people-person'}"
                >
                  ${this.renderTemplate('person', { person: person }, person.displayName) || this.renderPerson(person)}
                  <p class="person-display-name">${person.displayName}</p>
                  <p class="remove-person-button" @click="${() => this.removePerson(person)}">x</p>
                  <p class="remove-person-button-secondary" @click="${() => this.removePerson(person)}">x</p>
                </li>
              `
          )}
          <input
            type="text"
            placeholder="Name/email..."
            .value="${this._personName}"
            @keydown="${(e: KeyboardEvent & { target: HTMLInputElement }) => {
              this.onUserTypeSearch(e);
            }}"
          />
        </ul>
      `;
    } else {
      return html`
        <div></div>
      `;
    }
  }

  render() {
    if (this.people) {
      return (
        this.renderTemplate('default', { people: this.people }) ||
        html`
          <div>
            <div class="people-picker-input">
              ${this.renderChosenPeople()}
            </div>
            <div class="people-list-separator"></div>
            <ul class="people-list">
              ${this.people.slice(0, this.showMax).map(
                person =>
                  html`
                    <li class="people-person" @click="${() => this.addPerson(person)}">
                      ${this.renderTemplate('person', { person: person }, person.displayName) ||
                        this.renderPerson(person)}
                      <p id="${person.displayName}">${person.displayName}</p>
                    </li>
                  `
              )}
              ${this.people.length > this.showMax
                ? this.renderTemplate('overflow', {
                    people: this.people,
                    max: this.showMax,
                    extra: this.people.length - this.showMax
                  }) ||
                  html`
                    <li>+${this.people.length - this.showMax}</li>
                  `
                : null}
            </ul>
          </div>
        `
      );
    } else {
      return this.renderTemplate('no-data', null) || html``;
    }
  }

  private renderPerson(person: MicrosoftGraph.Person) {
    return html`
      <mgt-person person-details=${JSON.stringify(person)}></mgt-person>
    `;
  }
}
