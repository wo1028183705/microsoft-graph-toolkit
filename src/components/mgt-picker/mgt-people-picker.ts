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
import { styles } from './mgt-people-picker-css';

import '../mgt-person/mgt-person';
import '../../styles/fabric-icon-font';
import { MgtTemplatedComponent } from '../templatedComponent';
import { MgtPersonDetails, MgtPerson } from '../mgt-person/mgt-person';

@customElement('mgt-people-picker')
export class MgtPicker extends MgtTemplatedComponent {
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
  @property() private _userInput: string = '';
  @property() private _previousSearch: any;

  /* TODO: Do we want a query property for loading groups from calls? */

  static get styles() {
    return styles;
  }

  constructor() {
    super();
  }

  private onUserTypeSearch(event: any) {
    if (event.code == 'Escape') {
      event.target.value = '';
      this._userInput = '';
      this.people = [];
      return;
    }
    this._userInput = event.target.value;
    if (event.target.value) {
      this.loadPersonSearch(this._userInput);
    } else {
      event.target.value = '';
      this._userInput = '';
      this.people = [];
    }
  }

  private onUserKeyDown(event: any) {
    if (event.code == 'Tab') {
      this.addPerson(this.people[0], event);
    }
  }

  private addPerson(person: MgtPersonDetails, event: any) {
    if (person) {
      this._personName = '';
      this._duplicatePersonId = '';
      let chosenPerson: any = person;
      let filteredPersonArr = this._selectedPeople.filter(function(person) {
        return person.id == chosenPerson.id;
      });
      if (this._selectedPeople.length && filteredPersonArr.length) {
        this._duplicatePersonId = chosenPerson.id;
      } else {
        this._selectedPeople.push(person);
        let event = new CustomEvent('selectedPeople', {
          bubbles: true,
          cancelable: false,
          detail: this._selectedPeople
        });
        this.dispatchEvent(event);

        this.people = [];
        this._userInput = '';
        this._personName = '';
        (<HTMLInputElement>event.target).value = '';
      }
    }
  }

  private async loadPersonSearch(name: string) {
    let provider = Providers.globalProvider;

    if (provider && provider.state === ProviderState.SignedIn) {
      let client = Providers.globalProvider.graph;

      let peoples: any = await client.findPerson(name);

      this.filterPeople(peoples);
    }
  }

  private filterPeople(peoples: any) {
    //check if people need to be updated
    if (this.people) {
      if (this.people.length > 0) this._previousSearch = this.people;
      //find ids from previous search
      let id_filter = peoples.map(function(el) {
        return el.id;
      });
      var filtered = this._previousSearch.filter(function(person) {
        return id_filter.indexOf(person.id) === -1;
      });
      if (filtered.length == 0 && this._userInput.length > 0) {
        console.log('getting filtered result, no changes', filtered);
        this.findHighlightText();
        return;
      } else {
        this.people = peoples;
      }
    } else {
      this.people = peoples;
    }
    //this.people = peoples;
    //filter already selected people
    let selected = this._selectedPeople;
    for (let i = 0; i < selected.length; i++) {
      this.people = peoples.filter(function(person: any) {
        return person.id !== selected[i].id;
      });
    }
    //create highlight text
    this.findHighlightText();
    for (var i = 0; i < this.people.length; i++) {
      if (peoples[i].image == undefined) {
        this.updateProfile(this.people);
      }
    }
  }

  private async updateProfile(peoples: any) {
    let provider = Providers.globalProvider;
    if (this.people) {
      for (var i = 0; i < peoples.length; i++) {
        if (peoples[i].id && peoples[i].image == undefined) {
          await Promise.all([
            provider.graph.getUser(peoples[i].id).then(user => {
              if (user) {
                peoples[i].displayName = user.displayName;
                this.requestUpdate();
              }
            }),
            provider.graph.getUserPhoto(peoples[i].id).then(photo => {
              if (photo) {
                peoples[i].image = photo;
                this.requestUpdate();
              }
            })
          ]);
        }
      }
    }
  }

  private findHighlightText() {
    let that = this;
    setTimeout(function() {
      if (that._userInput.length) {
        if (that.people) {
          for (var i = 0; i < that.people.length; i++) {
            let newName: string = that.people[i].displayName.toLowerCase();
            newName = newName.replace(
              that._userInput.toLowerCase(),
              '<span class="highlight-search-text">' +
                that.people[i].displayName.slice(0, that._userInput.length) +
                '</span>'
            );
            if (document.getElementById(that.people[i].displayName) !== null) {
              document.getElementById(that.people[i].displayName).innerHTML = newName;
            }
          }
        }
      }
    }, 0o400);
  }

  private removePerson(person: MgtPersonDetails) {
    let chosenPerson: any = person;
    let filteredPersonArr = this._selectedPeople.filter(function(person) {
      return person.id !== chosenPerson.id;
    });
    this._selectedPeople = filteredPersonArr;
    this.renderChosenPeople();
  }

  private renderErrorMessage() {
    if (this.people) {
      if (this.people.length == 0 && this._userInput.length > 0) {
        return html`
          <div class="error-message-parent">
            <div class="search-error-text">We didn't find any matches.</div>
          </div>
        `;
      }
    }
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
                  <div class="CloseIcon" @click="${() => this.removePerson(person)}">\uE711</div>
                </li>
              `
          )}
          <div class="input-search-start">
            <input
              id="people-picker-input"
              class="people-chosen-input"
              type="text"
              placeholder="Start typing a name"
              .value="${this._personName}"
              @keydown="${(e: KeyboardEvent & { target: HTMLInputElement }) => {
                this.onUserKeyDown(e);
              }}"
              @keyup="${(e: KeyboardEvent & { target: HTMLInputElement }) => {
                this.onUserTypeSearch(e);
              }}"
            />
          </div>
        </ul>
      `;
    } else {
      return html`
        <div class="input-search-start">
          <input
            id="people-picker-input"
            class="people-chosen-input"
            type="text"
            placeholder="Start typing a name"
            .value="${this._personName}"
            @keydown="${(e: KeyboardEvent & { target: HTMLInputElement }) => {
              this.onUserKeyDown(e);
            }}"
            @keyup="${(e: KeyboardEvent & { target: HTMLInputElement }) => {
              this.onUserTypeSearch(e);
            }}"
          />
        </div>
      `;
    }
  }

  private renderHightlightText(person: MgtPersonDetails) {
    return html`
      <p class="people-person-text" id="${person.displayName}">
        ${person.displayName}
      </p>
    `;
  }

  private renderPeopleList() {
    if (this.people) {
      return html`
        <ul class="people-list">
          ${this.people.slice(0, this.showMax).map(
            person =>
              html`
                <li class="people-person-list" @click="${(event: any) => this.addPerson(person, event)}">
                  ${this.renderTemplate('person', { person: person }, person.displayName) || this.renderPerson(person)}
                  <p class="people-person-text" id="${person.displayName}">
                    ${this.renderHightlightText(person)}
                  </p>
                </li>
              `
          )}
        </ul>
      `;
    }
  }

  render() {
    return (
      this.renderTemplate('default', { people: this.people }) ||
      html`
        <div class="people-picker">
          <div class="people-picker-input">
            ${this.renderChosenPeople()}
          </div>
          <div class="people-list-separator"></div>
          ${this.renderPeopleList()}
          <div class="error-message-holder">
            ${this._userInput.length !== 0 ? this.renderErrorMessage() : null}
          </div>
        </div>
      `
    );
  }

  private renderPerson(person: MicrosoftGraph.Person) {
    return html`
      <mgt-person person-details=${JSON.stringify(person)}></mgt-person>
    `;
  }
}
