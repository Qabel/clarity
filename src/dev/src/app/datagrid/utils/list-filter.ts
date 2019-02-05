/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { Component, EventEmitter } from '@angular/core';
import { User } from '../inventory/user';
import { SerializableFilter } from '../../../../../clr-angular/data/datagrid/interfaces/serializable.filter.interface';
import { ListFilterStateInterface } from '../../../../../clr-angular/data/datagrid/interfaces/list.filter.state.interface';

@Component({
  selector: 'clr-datagrid-list-filter-demo',
  template: `
    <div class="select">
      <select (change)="selectionChanged()" [(ngModel)]="selectedValue">
        <option></option>
        <option [value]="value" *ngFor="let value of values">
          {{value}}
        </option>
      </select>
    </div>`,
  styleUrls: ['../datagrid.demo.scss'],
})
export class ListFilter implements SerializableFilter<User> {
  id: string;
  values: string[] = [];
  selectedValue: string;
  changes: EventEmitter<any> = new EventEmitter<any>(false);

  constructor() {
    this.id = Math.random().toString();
  }

  public get filterState(): ListFilterStateInterface {
    return {
      id: this.id,
      type: 'ListFilter',
      values: this.values,
      selectedValue: this.selectedValue,
    };
  }

  public set filterState(state: ListFilterStateInterface) {
    this.selectedValue = state.selectedValue;
  }

  equals(other: ListFilter): boolean {
    return other.filterState.type === this.filterState.type && other.filterState.id === this.filterState.id;
  }

  selectionChanged(): void {
    this.changes.emit(true);
  }

  accepts(user: User): boolean {
    return this.selectedValue === user.gender;
  }

  isActive(): boolean {
    return !!this.selectedValue;
  }
}
