/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { Component, EventEmitter } from '@angular/core';
import { User } from '../inventory/user';
import { SerializableFilter } from '../../../../../clr-angular/data/datagrid/interfaces/serializable.filter.interface';
import { NumberIntervalFilterStateInterface } from '../../../../../clr-angular/data/datagrid/interfaces/number.interval.filter.state.interface';

@Component({
  selector: 'clr-datagrid-number-interval-filter-demo',
  template: `
    From: <input type="text" [(ngModel)]="from" (change)="valueChanged()">
    To: <input type="text" [(ngModel)]="to" (change)="valueChanged()">
    <clr-icon role="button" shape="trash" (click)="resetFilter()"></clr-icon>`,
  styleUrls: ['../datagrid.demo.scss'],
})
export class NumberIntervalFilter implements SerializableFilter<User> {
  from: number;
  to: number;
  changes: EventEmitter<any> = new EventEmitter<any>(false);

  constructor() {
    this._id = Math.random().toString();
  }

  private _id: string;

  get id() {
    return this._id;
  }

  public get filterState(): NumberIntervalFilterStateInterface {
    return {
      id: this.id,
      type: 'NumberIntervalFilter',
      from: this.from,
      to: this.to,
    };
  }

  public set filterState(state: NumberIntervalFilterStateInterface) {
    this.from = state.from;
    this.to = state.to;
  }

  setId(id: string) {
    this._id = id;
  }

  equals(other: NumberIntervalFilter): boolean {
    return other.filterState.type === this.filterState.type && other.filterState.id === this.filterState.id;
  }

  valueChanged(): void {
    this.changes.emit(true);
  }

  resetFilter(): void {
    this.from = null;
    this.to = null;
    this.valueChanged();
  }

  accepts(user: User): boolean {
    return this.from <= user.age && this.to >= user.age;
  }

  isActive(): boolean {
    return !!this.from || !!this.to;
  }
}
