/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { Component, EventEmitter } from '@angular/core';
import { User } from '../inventory/user';
import { SerializableFilter } from '../../../../../clr-angular/data/datagrid/interfaces/serializable.filter.interface';
import { DateIntervalFilterStateInterface } from '../../../../../clr-angular/data/datagrid/interfaces/date.interval.filter.state.interface';
import { from } from 'rxjs/internal/observable/from';

@Component({
  selector: 'clr-datagrid-date-interval-filter-demo',
  template: `
    <div (click)="setFilters()">
      <span (click)="setToDate()">
        From: <input *ngIf="visible" type="text" [(clrDate)]="from">
      </span>
      To: <input *ngIf="visible" type="text" [(clrDate)]="to">
      <clr-icon role="button" shape="trash" (click)="resetFilter()"></clr-icon>
    </div>`,
  styleUrls: ['../datagrid.demo.scss'],
})
export class DateIntervalFilter implements SerializableFilter<User> {
  id: string;
  from: Date;
  to: Date;
  visible = true;
  changes: EventEmitter<any> = new EventEmitter<any>(false);

  constructor() {
    this.id = Math.random().toString();
  }

  public get filterState(): DateIntervalFilterStateInterface {
    return {
      id: this.id,
      type: 'DateIntervalFilter',
      from: this.from,
      to: this.to,
    };
  }

  public set filterState(state: DateIntervalFilterStateInterface) {
    this.from = state.from;
    this.to = state.to;
  }

  equals(other: DateIntervalFilter): boolean {
    return other.filterState.type === this.filterState.type && other.filterState.id === this.filterState.id;
  }

  setFilters(): void {
    this.changes.emit(true);
  }

  setToDate(): void {
    if (this.from) {
      this.to = this.from;
      this.changes.emit(true);
    }
  }

  resetFilter(): void {
    this.from = undefined;
    this.to = undefined;

    this.changes.emit(true);

    this.visible = false;
    setTimeout(() => {
      this.visible = true;
    });
  }

  accepts(user: User): boolean {
    return this.from <= user.creation && this.to >= user.creation;
  }

  isActive(): boolean {
    return !!this.from || !!this.to;
  }
}
